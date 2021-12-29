const { parseUnits } = require("ethers").utils;
const addressProviderAbi =
  require("@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json").abi;
const addresses = require("../utils/addresses");

async function mintToken(taskArguments, hre) {
  if (hre.network.name !== "fuji") {
    throw new Error("Only mint rando ERC20s on testnet!");
  }
  const { address, from, amount } = taskArguments;
  const sFrom = hre.ethers.provider.getSigner(from);

  const mintable = await hre.ethers.getContractAt("MintableERC20", address);
  const decimals = await mintable.decimals();

  await mintable.connect(sFrom).mint(parseUnits(amount.toString(), decimals));
  console.log(`Minted ${amount} x 10^${decimals} of ${address} to ${from}`);
}

async function getAVTokenAddress(taskArguments, hre) {
  const { address } = taskArguments;
  const cAddressProvider = new hre.ethers.Contract(
    "0x0668EDE013c1c475724523409b8B6bE633469585",
    addressProviderAbi,
    await hre.ethers.getDefaultProvider()
  );
  console.log(
    hre.network.name,
    await cAddressProvider.getReserveTokensAddresses(address)
  );
}

module.exports = {
  mintToken,
  getAVTokenAddress,
};
