// Displays an account XUSD balance and credits.
async function balance(taskArguments) {
  const xusdProxy = await ethers.getContract("XUSDProxy");
  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);

  const balance = await xusd.balanceOf(taskArguments.account);
  const credits = await xusd.creditsBalanceOf(taskArguments.account);
  console.log(
    "XUSD balance=",
    ethers.utils.formatUnits(balance.toString(), 18)
  );
  console.log(
    "XUSD credits=",
    ethers.utils.formatUnits(credits[0].toString(), 18)
  );
  console.log(
    "XUSD creditsPerToken=",
    ethers.utils.formatUnits(credits[1].toString(), 18)
  );
}

module.exports = {
  balance,
};
