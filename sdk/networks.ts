type RegistryContracts = {
  distributor: string;
};

export const MAINNET_CONTRACTS: RegistryContracts = {
  distributor: "",
};

export const MUMBAI_CONTRACTS: RegistryContracts = {
  distributor: "",
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
