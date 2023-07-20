import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

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
		mumbai: {
			url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_API_KEY}`,
			accounts:
				process.env.PRIVATE_KEY_MUMBAI !== undefined
					? [process.env.PRIVATE_KEY_MUMBAI]
					: [],
		},
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS !== undefined,
		currency: "USD",
	},
	etherscan: {
		apiKey: process.env.POLYGONSCAN_API_KEY,
	},
};

export default config;
