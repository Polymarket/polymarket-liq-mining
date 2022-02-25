import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "hardhat-spdx-license-identifier";
import "hardhat-typechain";
import "hardhat-watcher";
import "solidity-coverage";

import { HardhatUserConfig, task } from "hardhat/config";

const accounts = {
  mnemonic:
    process.env.MNEMONIC ||
    "test test test test test test test test test test test junk",
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, { ethers }) => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// Matic config from other chain
// const maticVigilChains = ["matic", "mumbai"] as const;
// type MaticVigilChain = typeof maticVigilChains[number];
// const getMaticVigilConfig = (network: MaticVigilChain): { url: string; chainId: number, gasPrice?: number } => {
//     if (!maticVigilApiKey) {
//         throw new Error("Please set your MATICVIGIL_API_KEY in a .env file");
//     }

//     const networkString = network === "matic" ? "mainnet" : "mumbai";
//     return {
//         url: `https://rpc-${networkString}.maticvigil.com/v1/${maticVigilApiKey}`,
//         chainId: ChainId[network],
//         gasPrice: 8000000000, // default is 'auto' which breaks chains without the london hardfork => https://stackoverflow.com/questions/68934132/on-hardhat-when-deploying-a-contract-or-minting-an-nft-getting-error-providerer
//     };
// };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY
    },
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: "USD",
    enabled: process.env.REPORT_GAS === "true",
  },
  namedAccounts: {
    deployer: { default: 0 },
    alice: { default: 1 },
    bob: { default: 2 },
    carol: { default: 3 },
    daryl: { default: 4 },
    evan: { default: 5 },
    frank: { default: 6 },
    greg: { default: 7 },
    hank: { default: 8 },
    ivan: { default: 9 },
  },
  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ["local"],
    },
    hardhat: {
      // Seems to be a bug with this, even when false it complains about being unauthenticated.
      // Reported to HardHat team and fix is incoming
      forking: {
        enabled: process.env.FORKING === "true",
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      },
      live: false,
      saveDeployments: true,
      tags: ["test", "local"],
      blockGasLimit: 12450000,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 3,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 4,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 5,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 42,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    moonbase: {
      url: "https://rpc.testnet.moonbeam.network",
      accounts,
      chainId: 1287,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    arbitrum: {
      url: "https://kovan3.arbitrum.io/rpc",
      accounts,
      chainId: 79377087078960,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    fantom: {
      url: "https://rpcapi.fantom.network",
      accounts,
      chainId: 250,
      live: true,
      saveDeployments: true,
    },
    fantom_testnet: {
      url: "https://rpc.testnet.fantom.network",
      accounts,
      chainId: 4002,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
    matic: {
      url: "https://rpc-mainnet.maticvigil.com",
      accounts,
      chainId: 137,
      live: true,
      saveDeployments: true,
    },
    xdai: {
      url: "https://rpc.xdaichain.com",
      accounts,
      chainId: 100,
      live: true,
      saveDeployments: true,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      accounts,
      chainId: 56,
      live: true,
      saveDeployments: true,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      accounts,
      chainId: 97,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  watcher: {
    compile: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
  },
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
export default config;
