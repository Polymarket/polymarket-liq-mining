"use strict";
/**
 * A list of addresses currently excluded from the snapshot calculation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXCLUDED_ACCOUNT_MAP = exports.EXCLUDED_ACCOUNTS = void 0;
exports.EXCLUDED_ACCOUNTS = [
    "0x684592063acf613e2d0d5887256a0c16cb48c125",
    "0x782186952ef2ca75ea91c95aef25bbdcffb4bb1a",
    "0xacebab2569ce6e5b660793b76e54d79eb7360c6a",
    "0x8e60d10f3b34fb1698dd6e97b8e357db65bc7fdb",
    "0xacebab1a14ae28db67b6e1ea4194a96a34602909",
];
exports.EXCLUDED_ACCOUNT_MAP = exports.EXCLUDED_ACCOUNTS.reduce((acc, curr) => {
    if (!acc[curr.toLowerCase()]) {
        acc[curr.toLowerCase()] = true;
    }
    return acc;
}, {});
