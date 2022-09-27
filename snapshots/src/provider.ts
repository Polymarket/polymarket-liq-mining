import { JsonRpcProvider } from "@ethersproject/providers";

let provider: JsonRpcProvider;

export function getProvider(): JsonRpcProvider {
    if (provider == null) {
        if (process.env.MATIC_RPC_URL != null) {
            provider = new JsonRpcProvider(process.env.MATIC_RPC_URL);
        } else {
            provider = new JsonRpcProvider(process.env.STAGING_RPC_URL); // kind of hacky, but good enough for now, provider should really be passed
        }
    }
    return provider;
}
