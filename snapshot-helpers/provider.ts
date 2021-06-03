import { JsonRpcProvider } from "@ethersproject/providers";

let provider : JsonRpcProvider;

export async function getProvider() : Promise<JsonRpcProvider> {
    if(provider == null){
        provider = new JsonRpcProvider(process.env.MATIC_RPC_URL);
    }
    return provider;
}