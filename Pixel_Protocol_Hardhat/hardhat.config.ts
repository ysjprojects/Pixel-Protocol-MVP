import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function getAccounts() {
  let arr: string[] = []

  arr = process.env.PRIVATE_KEY_1 !== undefined ? [...arr, process.env.PRIVATE_KEY_1] : arr
  arr = process.env.PRIVATE_KEY_2 !== undefined ? [...arr, process.env.PRIVATE_KEY_2] : arr
  arr = process.env.PRIVATE_KEY_3 !== undefined ? [...arr, process.env.PRIVATE_KEY_3] : arr
  return arr
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts: getAccounts()
    },
    bsctestnet: {
      url: process.env.BINANCE_SMART_CHAIN_TESTNET_URL || "",
      accounts: getAccounts()

    },
    polygontestnet: {
      url: process.env.POLYGON_TESTNET_URL || "",
      accounts: getAccounts()
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
