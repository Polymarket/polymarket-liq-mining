/**
 * A list of addresses currently excluded from the snapshot calculation
 */

export const EXCLUDED_ACCOUNTS = [
    "0x778f6b920f7b96b0a76b1711b495e429b932e2c3",
    "0x7dbdfcb8ab9d17e8816afab8869ad06979d4bce9",
    "0x5122e4cddd84b946e4bec946f08361d9ef48e05d",
    "0xfa956ba0ddd2bade554759d2a4d5d40a055f8718",
    "0x3e6ebb4adc9f53373089caf3f3d102a4b0576ef6",
    "0xacebab2569ce6e5b660793b76e54d79eb7360c6a",
];

export const EXCLUDED_ACCOUNT_MAP = EXCLUDED_ACCOUNTS.reduce((acc, curr) => {
    if (!acc[curr.toLowerCase()]) {
        acc[curr.toLowerCase()] = true;
    }
    return acc;
}, {});
