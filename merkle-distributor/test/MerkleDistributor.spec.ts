import chai, { expect } from 'chai'
import { ethers, waffle } from "hardhat";
import { Contract, BigNumber, constants, utils } from 'ethers'
import BalanceTree from '../src/balance-tree'

import Distributor from '../artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json'
import TestERC20 from '../artifacts/contracts/test/TestERC20.sol/TestERC20.json'
import { parseBalanceMap } from '../src/parse-balance-map'

const { solidity, provider, deployContract } = waffle;

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const ONE_BYTES32 = '0x1111111111111111111111111111111111111111111111111111111111111111'

describe('MerkleDistributor', () => {
  const wallets = provider.getWallets()
  const [wallet0, wallet1] = wallets

  let token: Contract
  beforeEach('deploy token', async () => {
    token = await deployContract((await ethers.getSigners())[0], TestERC20, ['Token', 'TKN', 0], overrides)
  })

  describe('#token', () => {
    it('returns the token address', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      expect(await distributor.token()).to.eq(token.address)
    })
  })

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      expect(await distributor.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#week', () => {
    it('returns the 0th week', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      expect(await distributor.week()).to.eq(0)
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await expect(distributor.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'MerkleDistributor: Invalid proof.'
      )
    })

    it('fails for invalid index', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await expect(distributor.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'MerkleDistributor: Invalid proof.'
      )
    })

    it('fails when frozen', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await distributor.freeze()
      await expect(distributor.claim(0, wallet0.address, 0, [ZERO_BYTES32], overrides)).to.be.revertedWith(
        'MerkleDistributor: Claiming is frozen.'
      )
    })

    describe('two account tree', () => {
      let distributor: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree([
          { account: wallet0.address, amount: BigNumber.from(100) },
          { account: wallet1.address, amount: BigNumber.from(101) },
        ])
        distributor = await deployContract(wallet0, Distributor, [token.address, tree.getHexRoot()], overrides)
        await token.setBalance(distributor.address, 201)
      })

      it('successful claim', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(0, 100, wallet0.address, wallet0.address, 0)
        const proof1 = tree.getProof(1, wallet1.address, BigNumber.from(101))
        await expect(distributor.claim(1, wallet1.address, 101, proof1, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(1, 101, wallet1.address, wallet1.address, 0)
      })

      it('transfers the token', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await token.balanceOf(wallet0.address)).to.eq(0)
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await token.balanceOf(wallet0.address)).to.eq(100)
      })

      it('must have enough to transfer', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await token.setBalance(distributor.address, 99)
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance'
        )
      })

      it('sets #isClaimed', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await distributor.isClaimed(0)).to.eq(false)
        expect(await distributor.isClaimed(1)).to.eq(false)
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await distributor.isClaimed(0)).to.eq(true)
        expect(await distributor.isClaimed(1)).to.eq(false)
      })

      it('cannot allow two claims', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Drop already claimed.'
        )
      })

      it('cannot claim more than once: 0 and then 1', async () => {
        await distributor.claim(
          0,
          wallet0.address,
          100,
          tree.getProof(0, wallet0.address, BigNumber.from(100)),
          overrides
        )
        await distributor.claim(
          1,
          wallet1.address,
          101,
          tree.getProof(1, wallet1.address, BigNumber.from(101)),
          overrides
        )

        await expect(
          distributor.claim(0, wallet0.address, 100, tree.getProof(0, wallet0.address, BigNumber.from(100)), overrides)
        ).to.be.revertedWith('MerkleDistributor: Drop already claimed.')
      })

      it('cannot claim more than once: 1 and then 0', async () => {
        await distributor.claim(
          1,
          wallet1.address,
          101,
          tree.getProof(1, wallet1.address, BigNumber.from(101)),
          overrides
        )
        await distributor.claim(
          0,
          wallet0.address,
          100,
          tree.getProof(0, wallet0.address, BigNumber.from(100)),
          overrides
        )

        await expect(
          distributor.claim(1, wallet1.address, 101, tree.getProof(1, wallet1.address, BigNumber.from(101)), overrides)
        ).to.be.revertedWith('MerkleDistributor: Drop already claimed.')
      })

      it('cannot claim for address other than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(1, wallet1.address, 101, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Invalid proof.'
        )
      })

      it('cannot claim more than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(0, wallet0.address, 101, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Invalid proof.'
        )
      })
    })

    describe('larger tree', () => {
      let distributor: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree(
          wallets.map((wallet, ix) => {
            return { account: wallet.address, amount: BigNumber.from(ix + 1) }
          })
        )
        distributor = await deployContract(wallet0, Distributor, [token.address, tree.getHexRoot()], overrides)
        await token.setBalance(distributor.address, 201)
      })

      it('claim index 4', async () => {
        const proof = tree.getProof(4, wallets[4].address, BigNumber.from(5))
        await expect(distributor.claim(4, wallets[4].address, 5, proof, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(4, 5, wallets[4].address, wallets[4].address, 0)
      })

      it('claim index 9', async () => {
        const proof = tree.getProof(9, wallets[9].address, BigNumber.from(10))
        await expect(distributor.claim(9, wallets[9].address, 10, proof, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(9, 10, wallets[9].address, wallets[9].address, 0)
      })
    })

    describe('realistic size tree', () => {
      let distributor: Contract
      const NUM_LEAVES = 100_000
      const NUM_SAMPLES = 25
      const elements: { account: string; amount: BigNumber }[] = []
      for (let i = 0; i < NUM_LEAVES; i++) {
        const node = { account: wallet0.address, amount: BigNumber.from(100) }
        elements.push(node)
      }
      const tree: BalanceTree = new BalanceTree(elements)

      it('proof verification works', () => {
        const root = Buffer.from(tree.getHexRoot().slice(2), 'hex')
        for (let i = 0; i < NUM_LEAVES; i += NUM_LEAVES / NUM_SAMPLES) {
          const proof = tree
            .getProof(i, wallet0.address, BigNumber.from(100))
            .map((el) => Buffer.from(el.slice(2), 'hex'))
          const validProof = BalanceTree.verifyProof(i, wallet0.address, BigNumber.from(100), proof, root)
          expect(validProof).to.be.true
        }
      })

      beforeEach('deploy', async () => {
        distributor = await deployContract(wallet0, Distributor, [token.address, tree.getHexRoot()], overrides)
        await token.setBalance(distributor.address, constants.MaxUint256)
      })

      it('no double claims in random distribution', async () => {
        for (let i = 0; i < 25; i += Math.floor(Math.random() * (NUM_LEAVES / NUM_SAMPLES))) {
          const proof = tree.getProof(i, wallet0.address, BigNumber.from(100))
          await distributor.claim(i, wallet0.address, 100, proof, overrides)
          await expect(distributor.claim(i, wallet0.address, 100, proof, overrides)).to.be.revertedWith(
            'MerkleDistributor: Drop already claimed.'
          )
        }
      })
    })
  })

  describe('#freeze', () => {
    it('changes the frozen var to true', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await distributor.freeze()
      expect(await distributor.frozen()).to.eq(true)
    })

    it('fails if not called by owner', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      const distributorFromOtherWallet = distributor.connect(wallet1)
      expect(distributorFromOtherWallet.freeze()).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('#unfreeze', () => {
    it('changes the frozen var to false', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await distributor.unfreeze()
      expect(await distributor.frozen()).to.eq(false)
    })

    it('fails if not called by owner', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      const distributorFromOtherWallet = distributor.connect(wallet1)
      expect(distributorFromOtherWallet.unfreeze()).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('#updateMerkleRoot', () => {
    it('fails when not frozen', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await expect(distributor.updateMerkleRoot(ONE_BYTES32)).to.be.revertedWith(
        'MerkleDistributor: Contract not frozen.'
      )
    })

    it('updates the merkle root', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await distributor.freeze()
      await expect(distributor.updateMerkleRoot(ONE_BYTES32))
        .to.emit(distributor, 'MerkleRootUpdated')
        .withArgs(ONE_BYTES32, 1)
      expect(await distributor.merkleRoot()).to.eq(ONE_BYTES32)
    })

    it('increments the week', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      await distributor.freeze()
      await distributor.updateMerkleRoot(ONE_BYTES32)
      expect(await distributor.week()).to.eq(1)
    })

    it('fails if not called by owner', async () => {
      const distributor = await deployContract(wallet0, Distributor, [token.address, ZERO_BYTES32], overrides)
      const distributorFromOtherWallet = distributor.connect(wallet1)
      expect(distributorFromOtherWallet.updateMerkleRoot(ONE_BYTES32)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('parseBalanceMap', () => {
    let distributor: Contract
    let claims: {
      [account: string]: {
        index: number
        amount: string
        proof: string[]
      }
    }
    beforeEach('deploy', async () => {
      const { claims: innerClaims, merkleRoot, tokenTotal } = parseBalanceMap({
        [wallet0.address]: 200,
        [wallet1.address]: 300,
        [wallets[2].address]: 250,
      })
      expect(tokenTotal).to.eq('0x02ee') // 750
      claims = innerClaims
      distributor = await deployContract(wallet0, Distributor, [token.address, merkleRoot], overrides)
      await token.setBalance(distributor.address, tokenTotal)
    })

    it('check the proofs is as expected', () => {
      expect(claims).to.deep.eq({
        [wallet0.address]: {
          index: 1,
          amount: "0xc8",
          proof: [
              "0xc48a4bd2d62eacb8296f75dd2bf6987cbfba264dfd27cfe77a70dbd7d82bd2ac",
              "0xd1d56b96964e4c3eacb47e9a0d78a19635474a359bbd0dbc99420cabbb996ab9"
          ],
        },
        [wallet1.address]: {
          index: 0,
          amount: '0x012c',
          proof: [
              "0x457a7ea6173187b2ab1cd4ffbc688b5119e65a7d5079d6a97f2a1010232f953e",
              "0xd1d56b96964e4c3eacb47e9a0d78a19635474a359bbd0dbc99420cabbb996ab9"
          ],
        },
        [wallets[2].address]: {
          index: 2,
          amount: '0xfa',
          proof: [
            '0x93fbca20a981321e9e96e40acb59dd6282ab43a16009d4e3f396b992818acf9f',
          ],
        },
      })
    })

    it('all claims work exactly once', async () => {
      for (const account in claims) {
        const claim = claims[account]
        await expect(distributor.claim(claim.index, account, claim.amount, claim.proof, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(claim.index, claim.amount, account, account, 0)
        await expect(distributor.claim(claim.index, account, claim.amount, claim.proof, overrides)).to.be.revertedWith(
          'MerkleDistributor: Drop already claimed.'
        )
      }
      expect(await token.balanceOf(distributor.address)).to.eq(0)
    })
  })

  describe('#claimTo', () => {
      let domain: { name: string; chainId: number; verifyingContract: string; };
      let proof0

      const types = {
          Claim: [
              { name: 'recipient', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'week', type: 'uint32' },
              { name: 'index', type: 'uint256'},
          ]
      }

      describe('two account tree', () => {
          let distributor: Contract
          let tree: BalanceTree

          beforeEach('deploy', async () => {
            tree = new BalanceTree([
              { account: wallet0.address, amount: BigNumber.from(100) },
              { account: wallet1.address, amount: BigNumber.from(101) },
            ])
            distributor = await deployContract(wallet1, Distributor, [token.address, tree.getHexRoot()], overrides)
            await token.setBalance(distributor.address, 201)
          })

          it('successful claim', async () => {
            proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
            domain = {
                name: 'PolyMarket Distributor',
                chainId: (await provider.getNetwork()).chainId,
                verifyingContract: distributor.address,
            };

            const hexSig0 = await wallet0._signTypedData(domain, types, {
                recipient: wallet0.address,
                amount: 100,
                week: 0,
                index: 0
            });
            const { v: v0, r: r0, s: s0 } = utils.splitSignature(hexSig0);

            await expect(distributor.claimTo(0, 100, proof0, wallet0.address, v0, r0, s0, overrides))
              .to.emit(distributor, 'Claimed')
              .withArgs(0, 100, wallet0.address, wallet0.address, 0)

            const hexSig1 = await wallet1._signTypedData(domain, types, {
                recipient: wallet1.address,
                amount: 101,
                week: 0,
                index: 1,
            });
            const { v: v1, r: r1, s: s1 } = utils.splitSignature(hexSig1);

            const proof1 = tree.getProof(1, wallet1.address, BigNumber.from(101))
            await expect(distributor.claimTo(1, 101, proof1, wallet1.address, v1, r1, s1, overrides))
              .to.emit(distributor, 'Claimed')
              .withArgs(1, 101, wallet1.address, wallet1.address, 0)

            expect(await token.balanceOf(wallet0.address)).to.eq(100)
            expect(await token.balanceOf(wallet1.address)).to.eq(101)
          })

          it('cannot allow duplicate claims', async () => {
              domain = {
                  name: 'PolyMarket Distributor',
                  chainId: (await provider.getNetwork()).chainId,
                  verifyingContract: distributor.address,
              };

              const hexSig0 = await wallet0._signTypedData(domain, types, {
                  recipient: wallet0.address,
                  amount: 100,
                  week: 0,
                  index: 0,
              });
              const { v: v0, r: r0, s: s0 } = utils.splitSignature(hexSig0);
              await distributor.claimTo(0, 100, proof0, wallet0.address, v0, r0, s0, overrides)
              await expect(distributor.claimTo(0, 100, proof0, wallet0.address, v0, r0, s0, overrides)).to.be.revertedWith(
                'MerkleDistributor: Drop already claimed.'
              )
          })

          it('fails on incorrect signature', async () => {
              await expect(
                  distributor.claimTo(
                      0,
                      100,
                      proof0,
                      wallet0.address,
                      0,
                      "0xbadadf45bb33758dc801a946a940951efb246dbe82717ea79e7cdcf252339367",
                      "0xbad4633425c5e7cd68ca9cbd52810e0b6497580f7b27775e0a46a5eecc756d45",
                      overrides
                  )
              ).to.be.revertedWith(
                "ECDSA: invalid signature 's' value"
              )
          })

          it('fails on signature for different recipient', async () => {
              const hexSig = await wallet0._signTypedData(domain, types, {
                  recipient: wallet0.address,
                  amount: 100,
                  week: 0,
                  index: 0,
              })

              const { v, r, s } = utils.splitSignature(hexSig);

              await expect(distributor.claimTo(0, 100, proof0, wallet1.address, v, r, s, overrides))
                  .to.be.revertedWith('MerkleDistributor: Invalid proof.')
          })

          it('fails when frozen', async () => {
            await distributor.freeze()

            const hexSig0 = await wallet0._signTypedData(domain, types, {
                recipient: wallet0.address,
                amount: 100,
                week: 0,
                index: 0,
            });
            const { v: v0, r: r0, s: s0 } = utils.splitSignature(hexSig0);

            await expect(distributor.claimTo(0, 100, proof0, wallet0.address, v0, r0, s0, overrides))
              .to.be.revertedWith('MerkleDistributor: Claiming is frozen.')
          })
      })
  })
})
