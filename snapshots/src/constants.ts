import * as dotenv from 'dotenv';

dotenv.config();

export const LOCAL_STRAPI_URL = "http://localhost:1337";
export const PRODUCTION_STRAPI_URL = process.env.PRODUCTION_STRAPI_URL;
export const HIJACK_ADDRESS_FOR_TESTING =
  process.env.HIJACK_ADDRESS_FOR_TESTING;
export const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL;
export const PRODUCTION_RPC_URL = process.env.MATIC_RPC_URL;
export const DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_ADDRESS;
export const DEFAULT_BLOCKS_PER_SAMPLE = process.env.DEFAULT_BLOCKS_PER_SAMPLE;