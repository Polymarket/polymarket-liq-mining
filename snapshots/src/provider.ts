import { JsonRpcProvider } from "@ethersproject/providers";

let provider : JsonRpcProvider;

export function getProvider() : JsonRpcProvider {
    if(provider == null){
        provider = new JsonRpcProvider(process.env.MATIC_RPC_URL);
    }
    return provider;
}