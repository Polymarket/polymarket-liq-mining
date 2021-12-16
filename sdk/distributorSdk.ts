import { JsonRpcSigner, JsonRpcProvider } from "@ethersproject/providers";
import { ethers, Contract, BigNumberish } from "ethers";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";
import { claim, claimTo } from "./claims";
import { utils } from "ethers";

export class DistributorSdk {
  readonly chainID: number;
  readonly signer: JsonRpcSigner;
  distributor: Contract;

  constructor(signer: JsonRpcSigner, chainID: number) {
    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }
    this.signer = signer;
    this.chainID = chainID;
    // this.setContracts(this.signer, getContracts(chainID).distributor);
  }

  public setContracts(signer: JsonRpcSigner, distributorAddress: string) {
    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }

    this.distributor = new Contract(
      distributorAddress,
      MerkleDistributorAbi,
      signer.provider
    );
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
    const tx = claim(
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

    const tx = claimTo(
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
