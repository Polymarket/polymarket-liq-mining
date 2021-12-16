import { JsonRpcSigner, JsonRpcProvider } from "@ethersproject/providers";
import { ethers, Contract, BigNumberish } from "ethers";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";
import { claimToTx, claimTx } from "./claims";
import { utils } from "ethers";
import { IsClaimed } from "./types";
import { MerkleDistributorInfo } from "../merkle-distributor/src/parse-balance-map";
import { freezeTx, unfreezeTx, updateMerkleRootTx } from "./admin";
import { getContracts } from "./networks";

export class DistributorSdk {
  readonly chainID: number;
  readonly signer: JsonRpcSigner;
  distributor: Contract;

  constructor(
    signer: JsonRpcSigner,
    chainID: number,
    distributorAddress?: string
  ) {
    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }
    this.signer = signer;
    this.chainID = chainID;

    this.distributor = new Contract(
      distributorAddress ?? getContracts(chainID).distributor,
      MerkleDistributorAbi,
      signer.provider
    );
  }

  /**
   * returns an array of what leafs have been claimed
   * @param merkleInfo - merkle distributor info. which claims to iterate over
   */
  public async getClaimedStatus(
    merkleInfo: MerkleDistributorInfo
  ): Promise<IsClaimed[]> {
    const promises = [];
    for (const address in merkleInfo.claims) {
      const isClaimed = await this.isClaimed(merkleInfo.claims[address].index);
      promises.push({
        ...merkleInfo.claims[address],
        isClaimed,
        address,
      });
    }
    return Promise.all(promises);
  }

  /**
   * freezes the contract
   * @notice - only admin
   */
  public async freeze(): Promise<ethers.providers.TransactionResponse> {
    const tx = freezeTx(this.distributor.address);
    const res = await this.signer.sendTransaction(tx);
    return res;
  }

  /**
   * unfreezes the contract
   * @notice - only admin
   */
  public async unfreeze(): Promise<ethers.providers.TransactionResponse> {
    const tx = unfreezeTx(this.distributor.address);
    const res = await this.signer.sendTransaction(tx);
    return res;
  }

  /**
   * updates the merkle root
   * @notice - only admin
   * @param newRoot - new merkle root
   */
  public async updateMerkleRoot(
    newRoot: string
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = updateMerkleRootTx(this.distributor.address, newRoot);
    const res = await this.signer.sendTransaction(tx);
    return res;
  }

  /**
   * gets current week
   */
  public async getWeek(): Promise<ethers.providers.TransactionResponse> {
    const tx = await this.distributor.week();
    return tx;
  }

  /**
   * @param claimIndex - claim index to check if an amount has been claimed
   */
  public async isClaimed(
    claimIndex: BigNumberish
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = await this.distributor.isClaimed(claimIndex);
    return tx;
  }

  /**
   * @param claimIndex - claim index
   * @param account - account included in the proof + where token will be transferred to
   * @param amount - amount of tokens to be transferred
   * @param merkleProof - proof of claim
   */
  public async claim(
    claimIndex: BigNumberish,
    account: string,
    amount: BigNumberish,
    merkleProof: string[]
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = claimTx(
      this.distributor.address,
      claimIndex,
      account,
      amount,
      merkleProof
    );
    const response = await this.signer.sendTransaction(tx);
    return response;
  }

  /**
   * @param claimIndex - claim index
   * @param amount - amount of tokens to be transferred
   * @param merkleProof - proof of claim
   * @param recipient - where token will be transferred to
   */
  public async claimTo(
    claimIndex: BigNumberish,
    amount: BigNumberish,
    merkleProof: string[],
    recipient: string
  ): Promise<ethers.providers.TransactionResponse> {
    const domain = {
      name: "PolyMarket Distributor", // todo - make token specific?
      chainId: this.chainID,
      verifyingContract: this.distributor.address,
    };

    const types = {
      Claim: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "week", type: "uint32" },
        { name: "index", type: "uint256" },
      ],
    };
    const week = await this.getWeek();

    const value = {
      recipient: recipient,
      amount: amount,
      week: week,
      index: claimIndex,
    };

    const hexSig0 = await this.signer._signTypedData(domain, types, value);
    const { v: v0, r: r0, s: s0 } = utils.splitSignature(hexSig0);

    const tx = claimToTx(
      this.distributor.address,
      claimIndex,
      amount,
      merkleProof,
      recipient,
      v0,
      r0,
      s0
    );

    const response = await this.signer.sendTransaction(tx);
    return response;
  }
}
