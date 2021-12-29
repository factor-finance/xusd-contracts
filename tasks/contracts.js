const { parseUnits } = require("ethers").utils;
const { isFuji } = require("../test/helpers");

async function mintToken(taskArguments, hre) {
  if (!isFuji) {
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
}

module.exports = {
  mintToken,
};
