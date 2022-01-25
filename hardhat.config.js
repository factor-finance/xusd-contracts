const ethers = require("ethers");

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-solhint");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("hardhat-deploy-ethers");
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");

const { accounts, fund, mint, redeem, transfer } = require("./tasks/account");
const { debug, printHashes } = require("./tasks/debug");
const { env } = require("./tasks/env");
const {
  execute,
  executeOnFork,
  proposal,
  governors,
} = require("./tasks/governance");
const { balance } = require("./tasks/xusd");
const { smokeTest, smokeTestCheck } = require("./tasks/smokeTest");
const {
  storeStorageLayoutForAllContracts,
  assertStorageLayoutChangeSafe,
  assertStorageLayoutChangeSafeForAll,
} = require("./tasks/storageSlots");
const {
  allocate,
  capital,
  harvest,
  reallocate,
  rebase,
  yield,
} = require("./tasks/vault");
const { mintToken, getAVTokenAddress } = require("./tasks/contracts.js");
const addresses = require("./utils/addresses.js");

const mnemonic =
  "replace hover unaware super where filter stone fine garlic address matrix basic";

let privateKeys = [];

let derivePath = "m/44'/60'/0'/0/";
for (let i = 0; i <= 10; i++) {
  const wallet = new ethers.Wallet.fromMnemonic(mnemonic, `${derivePath}${i}`);
  privateKeys.push(wallet.privateKey);
}

// Environment tasks.
task("env", "Check env vars are properly set for a Mainnet deployment", env);

// Account tasks.
task("accounts", "Prints the list of accounts", async (taskArguments, hre) => {
  return accounts(taskArguments, hre, privateKeys);
});
task("fund", "Fund accounts on local or fork")
  .addOptionalParam("num", "Number of accounts to fund")
  .addOptionalParam("index", "Account start index")
  .addOptionalParam("amount", "Stable coin amount to fund each account with")
  .addOptionalParam(
    "accountsfromenv",
    "Fund accounts from the .env file instead of mnemonic"
  )
  .setAction(fund);
task("mint", "Mint XUSD on local or fork")
  .addOptionalParam("num", "Number of accounts to mint for")
  .addOptionalParam("index", "Account start index")
  .addOptionalParam("amount", "Amount of XUSD to mint")
  .setAction(mint);
task("redeem", "Redeem XUSD on local or fork")
  .addOptionalParam("num", "Number of accounts to mint for")
  .addOptionalParam("index", "Account start index")
  .addOptionalParam("amount", "Amount of XUSD to mint")
  .setAction(redeem);
task("transfer", "Transfer XUSD")
  .addParam("index", "Account  index")
  .addParam("amount", "Amount of XUSD to transfer")
  .addParam("to", "Destination address")
  .setAction(transfer);

// Debug tasks.
task("debug", "Print info about contracts and their configs", debug);

// XUSD tasks.
task("balance", "Get XUSD balance of an account")
  .addParam("account", "The account's address")
  .setAction(balance);

// Vault tasks.
task("allocate", "Call allocate() on the Vault", allocate);
task("capital", "Set the Vault's pauseCapital flag", capital).addParam(
  "pause",
  "true to pause, false to unpause"
);
task("harvest", "Call harvest() on Vault", harvest);
task("rebase", "Call rebase() on the Vault", rebase);
task("yield", "Artificially generate yield on the Vault", yield);
task("reallocate", "Allocate assets from one Strategy to another")
  .addParam("from", "Address to withdraw asset from")
  .addParam("to", "Address to deposit asset to")
  .addParam("assets", "Address of asset to reallocate")
  .addParam("amounts", "Amount of asset to reallocate")
  .setAction(reallocate);

// Governance tasks
task("execute", "Execute a governance proposal")
  .addParam("id", "Proposal ID")
  .addOptionalParam("governor", "Override Governor address")
  .setAction(execute);
task("executeOnFork", "Enqueue and execute a proposal on the Fork")
  .addParam("id", "Id of the proposal")
  .addOptionalParam("gaslimit", "Execute proposal gas limit")
  .setAction(executeOnFork);
task("proposal", "Dumps the state of a proposal")
  .addParam("id", "Id of the proposal")
  .addOptionalParam("governor", "Override Governor address")
  .setAction(proposal);
task("governors", "Get list of governors for all contracts").setAction(
  governors
);

// util tasks
task("printHashes", "print hashes needed for storage slots", printHashes);
task("mintToken", "Mint mintable token on testest")
  .addParam("address", "The address of the mintable ERC20")
  .addParam("from", "The address of caller")
  .addParam("amount", "The amount to mint")
  .setAction(mintToken);
task(
  "getAVTokenAddress",
  "print the aave AV token addresses",
  getAVTokenAddress
);

// Smoke tests
task(
  "smokeTest",
  "Execute smoke test before and after parts when applying the deployment script on the mainnet:fork network"
)
  .addOptionalParam(
    "deployid",
    "Optional deployment id to run smoke tests against"
  )
  .setAction(smokeTest);
task(
  "smokeTestCheck",
  "Execute necessary smoke test environment / deploy script checks before the node is initialized"
)
  .addOptionalParam(
    "deployid",
    "Optional deployment id to run smoke tests against"
  )
  .setAction(smokeTestCheck);

// Storage slots
task(
  "saveStorageSlotLayout",
  "Saves storage slot layout of all the current contracts in the code base to repo. Contract changes can use this file for future reference of storage layout for deployed contracts."
).setAction(storeStorageLayoutForAllContracts);
task(
  "checkUpgradability",
  "Checks storage slots of a contract to see if it is safe to upgrade it."
)
  .addParam("name", "Name of the contract.")
  .setAction(assertStorageLayoutChangeSafe);
task(
  "checkUpgradabilityAll",
  "Checks storage slot upgradability for all contracts"
).setAction(assertStorageLayoutChangeSafeForAll);

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      initialBaseFeePerGas: 0,
      gasPrice: 225000000000,
      chainId:
        (process.env.FORK === "mainnet" && 43114) ||
        (process.env.FORK === "fuji" && 43113) ||
        43114,
    },
    localhost: {
      timeout: 60000,
    },
    "fuji-prod": {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      gasPrice: 225000000000,
      accounts: [
        process.env.DEPLOYER_PK || privateKeys[1],
        process.env.GOVERNOR_PK || privateKeys[1],
      ],
    },
    "mainnet-prod": {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      gasPrice: 225000000000,
      accounts: [
        process.env.DEPLOYER_PK || privateKeys[0],
        process.env.GOVERNOR_PK || privateKeys[0],
      ],
    },
  },
  mocha: {
    bail: process.env.BAIL === "true",
    timeout: 40000,
  },
  throwOnTransactionFailures: true,
  namedAccounts: {
    deployerAddr: {
      default: 0,
      localhost: (process.env.FORK === "fuji" && addresses.fuji.Deployer) || 0,
      "fuji-prod": addresses.fuji.Deployer,
      "mainnet-prod": addresses.mainnet.Deployer,
    },
    governorAddr: {
      default: 1,
      // On Mainnet and fork, the governor is the Governor contract.
      localhost: (process.env.FORK === "fuji" && addresses.fuji.Governor) || 1,
      "fuji-prod": addresses.fuji.Governor,
      "mainnet-prod": addresses.mainnet.Governor,
    },
    guardianAddr: {
      default: 1,
      // On mainnet and fork, the guardian is the multi-sig.
      localhost:
        (process.env.FORK === "mainnet" && addresses.mainnet.Guardian) ||
        (process.env.FORK === "fuji" && addresses.fuji.Guardian) ||
        1,
      "fuji-prod": addresses.fuji.Guardian,
      "mainnet-prod": addresses.mainnet.Guardian,
    },
    strategistAddr: {
      default: 0,
      localhost:
        (process.env.FORK === "fuji" && addresses.fuji.Strategist) || 1,
      "fuji-prod": addresses.fuji.Strategist,
      "mainnet-prod": addresses.mainnet.Strategist,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.XUSD_SNOWTRACE_API_KEY,
      avalancheFujiTestnet: process.env.XUSD_SNOWTRACE_API_KEY,
    },
  },
};
