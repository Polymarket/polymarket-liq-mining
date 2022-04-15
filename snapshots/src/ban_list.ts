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
    "0xcef8576f9c83757ada94080eb0bdf16d69a70df6",
    "0x655e30f3400f64f3f6184b5d94901a0dffefd0dc",
    "0xa93ec6a1868f748f011dff8b1b9549271451ba5e",
    "0x70549c99930d6f5afeab4ede88ff0dedf6fde71b",
    "0x0d851e9b1636d2b0be03bf0e8e037edd079beeb5",
    "0x62d84ed708dd2048ae1616cbd48e50438137df3c",
    "0x0d851e9b1636d2b0be03bf0e8e037edd079beeb5",
    "0x380888bf73ac09025556ce33f3c3c871f97f68f9",
    "0xdcb005ee865d17496be32d4da04127b555bb28dd",
    "0x4844abd66acbd3af04168ec2eca95d34265640c0",
    "0x41b78e67d9d9bb52ef4981686593dbab3c85dda7",
    "0x7c240ff259178a9228b12c942780c7633687b9dc",
    "0x1466daa7c1020ecef08c945015fee5cc60c74057",
    "0x1557174b6410e6a5cedd44c9bdbacd018a5ca921",
    "0xe567b0cb3d7a7264ed7e74c3ebc0601dc11032a5",
    "0x1189742e8f09b72ccc9955f9b3927519647b554e",
    "0xe567b38dbc9068aab02b4ba8bc5ab487fee4a807",
    "0xE567b0d5C9c0a9468B970Ebe12e799248d3C75a4",
    "0x6E784d0dc474C63D9e7600837B913f70d389d756",
    "0xe567b3a2c2ae704274912d801415ed85df8f1fe4",
    "0xefef3198bfe69d32a8ca1d66df91743b2503a3a7",
    "0xfb23fe615b515ab59c15da4cc707faf85761f68b",
    "0x562a659dbb799378cb07a29d306b807c39986e08",
    "0x556da9ff13e43add5e4b91a8ee5c477f50833e80",
    "0x5c0dc424ea8947a6c375f82b08f391527afa33d4",
    "0xd07fcf4f49ca2bf37bb084d4dd7704de31fb4d0c",
    "0xa5dd4e5d46a38db5bb91fe3d97359d7ae8e0bf9a",
    "0x9bf178bb52f57fbc9095811923def1b5f864fe22",
];

export const EXCLUDED_ACCOUNT_MAP = EXCLUDED_ACCOUNTS.reduce((acc, curr) => {
    if (!acc[curr.toLowerCase()]) {
        acc[curr.toLowerCase()] = true;
    }
    return acc;
}, {});
