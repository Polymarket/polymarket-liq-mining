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

export const STRAPI_ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD;
export const STRAPI_ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL;
export const STRAPI_URL = process.env.STRAPI_URL;
export const USER_SAMPLE_SIZE = process.env.USER_SAMPLE_SIZE;

export const PGHOST = process.env.PGHOST;
export const PGPORT = process.env.PGPORT;
export const PGDATABASE = process.env.PGDATABASE;
export const PGUSER = process.env.PGUSER;
export const PGPASSWORD = process.env.PGPASSWORD;

export const METABASEUSER = process.env.METABASEUSER;
export const METABASEPASSWORD = process.env.METABASEPASSWORD;