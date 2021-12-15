import { JsonRpcSigner, JsonRpcProvider } from "@ethersproject/providers";
import { ethers, Contract, BigNumberish } from "ethers";
// import { IMerkleDistributor } from "../merkle-distributor/typechain/IMerkleDistributor";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";
import { getContracts } from "./networks";
import { claim } from './claims';

export class DistributorSdk {
  readonly chainID: number;
  readonly signer: JsonRpcSigner;
  distributor: Contract;
  // erc20? contract

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
    console.log("distributorAddress", distributorAddress);

    this.distributor = new Contract(
      distributorAddress,
      MerkleDistributorAbi,
      signer.provider
    );
  }

  public async getWeek(): Promise<ethers.providers.TransactionResponse> {
    const tx = await this.distributor.week();
    return tx;
  }

  public async isClaimed(
    claimIndex: BigNumberish
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = await this.distributor.isClaimed(claimIndex);
    return tx;
  }

  public async claim(
    claimIndex: BigNumberish,
    account: string,
    amount: BigNumberish,
    proof: string[]
  ): Promise<ethers.providers.TransactionResponse> {
	const tx = claim(this.distributor.address, claimIndex, account, amount, proof)
    const rex = await this.signer.sendTransaction(tx);
    return rex;
  }
}
