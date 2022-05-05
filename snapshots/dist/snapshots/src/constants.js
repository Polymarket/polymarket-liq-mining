"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.METABASEPASSWORD = exports.METABASEUSER = exports.USER_SAMPLE_SIZE = exports.STRAPI_URL = exports.STRAPI_ADMIN_EMAIL = exports.STRAPI_ADMIN_PASSWORD = exports.DEFAULT_BLOCKS_PER_SAMPLE = exports.DISTRIBUTOR_ADDRESS = exports.PRODUCTION_RPC_URL = exports.LOCAL_RPC_URL = exports.HIJACK_ADDRESS_FOR_TESTING = exports.PRODUCTION_STRAPI_URL = exports.LOCAL_STRAPI_URL = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.LOCAL_STRAPI_URL = "http://localhost:1337";
exports.PRODUCTION_STRAPI_URL = process.env.PRODUCTION_STRAPI_URL;
exports.HIJACK_ADDRESS_FOR_TESTING = process.env.HIJACK_ADDRESS_FOR_TESTING;
exports.LOCAL_RPC_URL = process.env.LOCAL_RPC_URL;
exports.PRODUCTION_RPC_URL = process.env.MATIC_RPC_URL;
exports.DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_ADDRESS;
exports.DEFAULT_BLOCKS_PER_SAMPLE = process.env.DEFAULT_BLOCKS_PER_SAMPLE;
exports.STRAPI_ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD;
exports.STRAPI_ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL;
exports.STRAPI_URL = process.env.STRAPI_URL;
exports.USER_SAMPLE_SIZE = process.env.USER_SAMPLE_SIZE;
exports.METABASEUSER = process.env.METABASEUSER;
exports.METABASEPASSWORD = process.env.METABASEPASSWORD;
