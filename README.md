# Factor XUSD

XUSD is a new kind of stablecoin that passively accrues yield while you are holding it. If you want to learn about XUSD, visit the [docs](https://docs.xusd.fi)

## Requirements
- Node Version
  - `^8.11.2 >= node <=^14.0.0`
  - Recommended `^14.0.0`
- Web3 Wallet
  - Recommended [Metamask](https://metamask.io/) 

---

## Installation
```bash
# Clone the xusd-contracts project
git clone git@github.com:factor-finance/xusd-contracts.git
```  

---

## Description

The `xusd-contracts` project houses the `smart contracts` codebase. In order to run this project locally, you will need to run both the `node` and the `dapp` from [xusd-dapp](https://github.com/factor-finance/xusd-dapp) in separate processes or terminals. 


### EVM Node
The `smart contracts` and all of their associated code is located in the `<project-root>/` directory. Contract tests and local EVM are managed by [Hardhat](https://hardhat.org/).

A variety of Hardhat [tasks](https://hardhat.org/guides/create-task.html) are available to interact with the contracts. Additional information can be found by running `npx hardhat`
<br/><br/>

---
## Developing Locally

You have two options for running the EVM node locally via hardhat.
- Forked mode - A forked version of mainnet or testnet at a particular block height (specified in `.env` file)
- Standalone mode - A private blockchain with a clean slate

Preferred default development mode is Forked mode. It has a benefit of more closely mimicking behavior of mainnet which is helpful for discovering bugs (that are not evident in local mode) and not requiring setting up complex third party contracts (like Aave and Pangolin).
<br/><br/>


### Running a Local Hardhat Node
Open a separate terminal to run the hardhat node in.
```bash
# Install the dependencies - Note your Node version 'Requirements' 
yarn install
```

#### Forked Mode

If you would like the forked net to mimic a more recent state of mainnet or fuji update the `BLOCK_NUMBER`. And add your mainnet testing account(s) (if more than one comma separate them) under the `ACCOUNTS_TO_FUND`. After the node is started up the script will transfer 100k of USDT, XUSD and DAI to those accounts.

```bash
# Run the local hardhat node in forked mainnet mode
`FORK=mainnet yarn run_node:fork`
```

```bash
# Run the local hardhat node in forked fuji mode
`FORK=fuji yarn run_node:fork`
```

#### Standalone Mode
```bash
# Run the local hardhat node
yarn run_node
```

### Minting Stablecoins in Standalone Mode in via hardhat task
```bash
# Mint 1000 of each supported stablecoin to each account defined in the mnemonic
FORK=mainnet yarn hardhat fund --amount 1000 --network localhost
```

##### Requirements
- You will need your web3 wallet configured before you can interact with the dapp. Make sure that you have one - refer [HERE](### Configure Web3 Wallet) for `Metamask` instructions.
- You will also need the dApp to be running, so refer [xusd-dapp](https://github.com/factor-finance/xusd-dapp) for instructions.

### Configure Web3 Wallet
You will need a web3 wallet to interact with the dApp and sign transactions. Below are the instructions to setup `Metamask` to interact with the dApp running locally.

- Install `Metamask` Chrome extension [HERE](https://metamask.io/)
- Create/Open `Metamask` wallet
- Add a custom RPC endpoint 
  - Name: `xusd` - just an example
  - URL: `http://localhost:8545`
  - Chain ID: `43114`
<br/><br/>

#### Add Accounts to Metamask

##### Forked mode
Just use account(s) you normally use on mainnet.

##### Standalone mode
You can get all the accounts for the locally running node and their associate private keys by running the command 
```bash
# For Standalone mode
npx hardhat accounts --network localhost
```

Choose a test account past index 3 - accounts 0-3 are reserved.
Copy the private key and import it into Metamask as follows:
- Click the current account icon in the uppor right corner of `Metamask`
- Select `Import Account` => paste private key => Click `Import`

Make sure that you select your newly created RPC endpoint in the networks dropdown and use your newly imported account in `Metamask`. You should now be setup to use `Metamask` to interact with the dApp.

Note: 
If you want to add all the accounts via a new `Metamask` wallet and import the `mnemonic` it is located in `contracts/hardhat.config.js`. Make sure that you use Account 4 and up for test accounts as 0-3 are reserved.
<br/><br/>

### Troubleshooting
When freshly starting a node it is usually necessary to also reset Metamask Account being used:
- `Metamask` => `Settings` => `Advanced` => `Reset Account`
<br/><br/>
This will reset the nonce number that is incorrect if you have submitted any transactions in previous runs of the ethereum node. (Wallet has a too high nonce number comparing to the nonce state on the node)

If you get an `error Command "husky-run" not found.` type of error: 
Go to root of the project and run `npx husky install`


## Running Smoke Tests

Smoke tests can be run in 2 modes: 
- Run `scripts/smokeTest.sh` to launch interactive mode. All the "before contract changes" parts of tests
  will execute and wait for the user to manually using a console performs contract changes. Once those are done
  hit "Enter" in the smoke test console and the second part of the tests shall be ran that validate that contract
  changes haven't broken basic functionality.
- Run `scripts/smokeTest.sh --deployid [numeric_id_of_deploy]` will run smoke tests against a specific
  deployid. Validating that that deploy didn't break basic functionality.
<br/><br/>

---
