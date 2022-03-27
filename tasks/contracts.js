const { parseUnits } = require("ethers").utils;
const aaveProviderAbi =
  require("@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json").abi;

async function mintToken(taskArguments, hre) {
  if (hre.network.name !== "localhost") {
    throw new Error("Only mint rando ERC20s on testnet!");
  }
  const { address, from, amount } = taskArguments;
  const sFrom = hre.ethers.provider.getSigner(from);

  const mintable = await hre.ethers.getContractAt("MintableERC20", address);
  const decimals = await mintable.decimals();

  await mintable.connect(sFrom).mint(parseUnits(amount.toString(), decimals));
  console.log(`Minted ${amount} x 10^${decimals} of ${address} to ${from}`);
}

async function ercBalanceOf(taskArguments, hre) {
  const { address } = taskArguments;
  const addresses = require("../utils/addresses");
  const tokenNames = [
    "WAVAX",
    "USDC",
    "USDC_native",
    "USDT",
    "DAI",
    "ALPHA",
    "CRV",
  ];
  const networkName =
    hre.network.name === "localhost" && process.env.FORK === "mainnet"
      ? "mainnet"
      : "fuji";
  let _address, cToken, balance;
  for (const token of tokenNames) {
    _address = addresses[networkName][token];
    cToken = await hre.ethers.getContractAt("ERC20", _address);
    balance = await cToken.balanceOf(address);
    console.log(hre.network.name, token, _address, balance.toString());
  }
}

async function getAVTokenAddress(taskArguments, hre) {
  const addresses = require("../utils/addresses");
  const cAddressProvider = new hre.ethers.Contract(
    addresses[hre.network.name].AAVE_DATA_PROVIDER,
    aaveProviderAbi,
    await hre.ethers.getSigner("0x3cECEAe65A70d7f5b7D579Ba25093A37A47706B3")
  );

  const tokenNames = ["USDC", "USDT", "DAI"];
  let address;
  for (const token of tokenNames) {
    console.log(token);
    address = addresses[hre.network.name][token];
    console.log(address);
    console.log(
      hre.network.name,
      token,
      address,
      await cAddressProvider.getReserveTokensAddresses(address)
    );
  }
  console.log(await cAddressProvider.getAllATokens());
}

module.exports = {
  mintToken,
  getAVTokenAddress,
  ercBalanceOf,
};
