/**
 * A list of addresses currently excluded from the snapshot calculation
 */

export const EXCLUDED_ACCOUNTS = [
    "0x778f6b920f7b96b0a76b1711b495e429b932e2c3",
    "0x71e037bf153e4e88bb988f57761efc801f3f7a3d",
    "0x851f3f8ffb12b9a7f772294311f03cb673a0c23d",
    "0x5122e4cddd84b946e4bec946f08361d9ef48e05d",
    "0x2d3cb1f16633fb87d69ac08c168302680cfd607a",
    "0x7f8052ef7ce2323dbc668fd1cd6251f3541e6891",
    "0x151b29d09be97d8069d407c21a4cfa7b80d1a742",
    "0x95cc0f7e4e54a34bdad529b8085be19edfa2d114",
    "0x778f6b920f7b96b0a76b1711b495e429b932e2c3",
    "0x9db30adf4332ae357d585fdc3e642b657e5aeed4",
    "0xacebab2569ce6e5b660793b76e54d79eb7360c6a",
];

export const EXCLUDED_ACCOUNT_MAP = EXCLUDED_ACCOUNTS.reduce((acc, curr) => {
    if (!acc[curr.toLowerCase()]) {
        acc[curr.toLowerCase()] = true;
    }
    return acc;
}, {});
