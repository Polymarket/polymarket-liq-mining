import { RPC_ENDPOINT } from "./config";
import { JsonRpcProvider } from "@ethersproject/providers";

export const provider = new JsonRpcProvider(RPC_ENDPOINT);