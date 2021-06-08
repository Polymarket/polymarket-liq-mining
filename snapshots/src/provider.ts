import { JsonRpcProvider } from "@ethersproject/providers";

let provider : JsonRpcProvider;

export function getProvider() : JsonRpcProvider {
    if(provider == null){
        console.log(`Matic url: ${process.env.MATIC_RPC_URL}`);
        provider = new JsonRpcProvider(process.env.MATIC_RPC_URL);
    }
    return provider;
}