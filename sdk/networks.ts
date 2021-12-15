type RegistryContracts = {
  distributor: string;
//   usdc: string;
};

export const MAINNET_CONTRACTS: RegistryContracts = {
  distributor: "",
//   usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
};

export const MUMBAI_CONTRACTS: RegistryContracts = {
  distributor: "",
//   usdc: "0x40fa79E4Cab51e11F935760BCFdA90662d418D74",
};

export const getContracts = (network: number): RegistryContracts => {
  switch (network) {
    case 1:
      return MAINNET_CONTRACTS;
    case 80001:
      return MUMBAI_CONTRACTS;
    default:
      console.log(
        `WARNING: running on network id ${network} with mainnet contract addresses. Ignore this warning if you are testing.`
      );
      return MAINNET_CONTRACTS;
  }
};
