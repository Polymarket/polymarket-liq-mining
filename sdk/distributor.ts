import { JsonRpcSigner } from "@ethersproject/providers";
import { ethers, Contract, BigNumberish } from "ethers";
// import { IMerkleDistributor } from "../merkle-distributor/typechain/IMerkleDistributor";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";
import { getContracts } from './networks';

export class Distributor {
  readonly chainID: number;
  readonly signer: JsonRpcSigner;
  distributor: Contract;
  // erc20? contract

  constructor(signer: JsonRpcSigner, chainID: number) {
    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }
    this.chainID = chainID;
    this.signer = signer;
    this.setContracts(getContracts(chainID).distributor, this.signer);
  }

  public setContracts(
    distributorAddress: string,
    signer: JsonRpcSigner
    // erc20Address: string,
  ) {
    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }

    this.distributor = new Contract(
      distributorAddress,
      MerkleDistributorAbi,
      signer
    );
    // this.erc20Address = new ethers.Contract(ctAddress, ctabi, signer);
  }

  public async isClaimed(
    claimIndex: BigNumberish
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = await this.distributor.isClaimed(claimIndex);
    return tx;
  }
}
