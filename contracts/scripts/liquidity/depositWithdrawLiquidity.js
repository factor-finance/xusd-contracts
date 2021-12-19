// Script to test depositing funds into the liquidity mining contract,
// then exiting after waiting for N blocks.

const { ethers, getNamedAccounts } = require("hardhat");
const { utils } = require("ethers");
const addresses = require("../../utils/addresses");
const ERC20Abi = require("../../test/abi/erc20.json");
const USDTAbiContainer = require("../../test/abi/usdt.json");

const {
  usdtUnits,
  usdcUnits,
  xusdUnits,
  advanceBlocks,
} = require("../../test/helpers");

async function main() {
  // in a fork env these guys should have a good amount of OGN and USDT/USDC
  const signers = await ethers.getSigners();

  const usdt = await ethers.getContractAt(
    USDTAbiContainer.abi,
    addresses.mainnet.USDT
  );
  const usdc = await ethers.getContractAt(ERC20Abi, addresses.mainnet.USDC);
  const ogn = await ethers.getContractAt(ERC20Abi, addresses.mainnet.OGN);

  const uniswapPairXUSD_USDT = await ethers.getContractAt(
    ERC20Abi,
    addresses.mainnet.uniswapXUSD_USDT
  );

  const liquidityProxy = await ethers.getContract(
    "LiquidityRewardXUSD_USDTProxy"
  );
  const liquidityContract = await ethers.getContractAt(
    "LiquidityReward",
    liquidityProxy.address
  );

  const xusdProxy = await ethers.getContract("XUSDProxy");
  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);

  const vaultProxy = await ethers.getContract("VaultProxy");
  const vault = await ethers.getContractAt("IVault", vaultProxy.address);

  const uniswapRouter = await ethers.getContractAt(
    "IUniswapV2Router",
    addresses.mainnet.uniswapRouter
  );

  const signerAddress = await signers[0].getAddress();

  if (process.argv[2] == "mint") {
    const usdcDesired = usdcUnits("10");

    await usdc.connect(signers[0]).approve(vault.address, usdcDesired);
    await vault.connect(signers[0]).mint(usdc.address, usdcDesired, 0);
  }

  let xusdBalance = utils.formatUnits(await xusd.balanceOf(signerAddress), 18);

  const components = xusdBalance.split(".");
  if (components.length == 2) {
    // fix it down to 6 precision
    if (components[1].length > 6) {
      xusdBalance = xusdBalance.substr(
        0,
        xusdBalance.length - (components[1].length - 6)
      );
    }
  }

  console.log("xusd balance of:", xusdBalance);

  // go for a 1:1
  const xusdDesired = xusdUnits(xusdBalance);
  const usdtDesired = usdtUnits(xusdBalance);

  const txOpts = {};
  txOpts.gasLimit = 6500000;

  await xusd
    .connect(signers[0])
    .approve(uniswapRouter.address, xusdDesired, txOpts);
  console.log("Usdt approval", usdt.address);
  await usdt.connect(signers[0]).approve(uniswapRouter.address, 0, txOpts);
  await usdt
    .connect(signers[0])
    .approve(uniswapRouter.address, usdtDesired, txOpts);
  console.log("Usdt approved");

  console.log("Pair address:", uniswapPairXUSD_USDT.address);
  console.log(
    "[pre ]Pair balance is:",
    utils.formatUnits(await uniswapPairXUSD_USDT.balanceOf(signerAddress), 18)
  );

  if (xusdDesired.gt(0)) {
    await uniswapRouter
      .connect(signers[0])
      .addLiquidity(
        xusd.address,
        usdt.address,
        xusdDesired,
        usdtDesired,
        0,
        0,
        signerAddress,
        Date.now() + 30,
        txOpts
      ); // give it 30 seconds
  }

  const liquidityBalance = await uniswapPairXUSD_USDT.balanceOf(signerAddress);
  if (liquidityBalance.eq(0)) {
    console.log("There is zero liquidity balance.");
    return;
  }
  console.log(
    "[addL]Pair balance is:",
    utils.formatUnits(liquidityBalance, 18)
  );

  const rewardRate = await liquidityContract.rewardPerBlock();
  console.log(
    "Reward rate for liquidity is:",
    utils.formatUnits(rewardRate, 18)
  );

  await uniswapPairXUSD_USDT
    .connect(signers[0])
    .approve(liquidityContract.address, liquidityBalance);
  console.log("Depositing...");
  await liquidityContract.connect(signers[0]).deposit(liquidityBalance, txOpts);
  console.log(
    "[depo]Pair balance is:",
    utils.formatUnits(await uniswapPairXUSD_USDT.balanceOf(signerAddress), 18)
  );

  console.log(
    "expected rewards:",
    utils.formatUnits(await liquidityContract.pendingRewards(signerAddress), 18)
  );
  console.log(
    "balance of ogn:",
    utils.formatUnits(await ogn.balanceOf(signerAddress), 18)
  );

  await advanceBlocks(10);

  console.log(
    "expected rewards:",
    utils.formatUnits(await liquidityContract.pendingRewards(signerAddress), 18)
  );

  await liquidityContract.connect(signers[0]).exit(txOpts);
  console.log(
    "[exit]Pair balance is:",
    utils.formatUnits(await uniswapPairXUSD_USDT.balanceOf(signerAddress), 18)
  );
  console.log(
    "exit rewards:",
    utils.formatUnits(await ogn.balanceOf(signerAddress), 18)
  );

  // fund the liquidity contract with 1000 ogn

  // at 0.1 rate we have enough for 10,000 blocks given we fund it with 1000
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
