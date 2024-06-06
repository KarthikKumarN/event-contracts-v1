import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { WALLET_PRIVATE_KEY, ALCHEMY_API_KEY } from "./constants";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    plumTest: {
      url: `https://plume-testnet.rpc.caldera.xyz/http`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
    polygon_mainnet: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
    bscTestnet: {
      url: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
    polygonAmoy: {
      url: `https://rpc-amoy.polygon.technology/`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
    base: {
      url: `https://mainnet.base.org`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
    baseSepolia: {
      url: `https://sepolia.base.org`,
      accounts:
        process.env.WALLET_PRIVATE_KEY !== undefined
          ? [process.env.WALLET_PRIVATE_KEY]
          : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      plumTest: "test",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygon_mainnet: process.env.POLYGONSCAN_API_KEY || "",
      bscTestnet: process.env.BNB_API_KEY || "",
      baseSepolia: process.env.BASE_API_KEY || "PLACEHOLDER_STRING",
      base: process.env.BASE_API_KEY || "PLACEHOLDER_STRING",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "plumTest",
        chainId: 161221135,
        urls: {
          apiURL: "https://plume-testnet.explorer.caldera.xyz/api?",
          browserURL: "https://plume-testnet.explorer.caldera.xyz",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      //TODO - For base mainnet
    ],
  },
};

export default config;
