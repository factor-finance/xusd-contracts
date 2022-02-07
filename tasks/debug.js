const { utils } = require("ethers");
const { formatUnits } = utils;

const erc20Abi = require("../test/abi/erc20.json");
const addresses = require("../utils/addresses");

/**
 * Prints information about deployed contracts and their config.
 */
async function debug(taskArguments, hre) {
  //
  const chainId = await hre.getChainId();
  let networkName;
  if (chainId == 43113) {
    networkName = "fuji";
  } else if (chainId == 43114) {
    networkName = "mainnet";
  }
  console.log(`Network: ${networkName}`);
  // Get all contracts to operate on.
  const vaultProxy = await hre.ethers.getContract("VaultProxy");
  const xusdProxy = await hre.ethers.getContract("XUSDProxy");
  const aaveProxy = await hre.ethers.getContract("AaveStrategyProxy");
  const curveUsdcStrategyProxy = await hre.ethers.getContract(
    "CurveUsdcStrategyProxy"
  );
  const vault = await hre.ethers.getContractAt("IVault", vaultProxy.address);
  const cVault = await hre.ethers.getContract("Vault");
  const vaultAdmin = await hre.ethers.getContract("VaultAdmin");
  const vaultCore = await hre.ethers.getContract("VaultCore");
  const xusd = await hre.ethers.getContractAt("XUSD", xusdProxy.address);
  const cXusd = await hre.ethers.getContract("XUSD");
  const aaveStrategy = await hre.ethers.getContractAt(
    "AaveStrategy",
    aaveProxy.address
  );
  const cAaveStrategy = await hre.ethers.getContract("AaveStrategy");
  const curveUsdcStrategy = await hre.ethers.getContractAt(
    "CurveUsdcStrategy",
    curveUsdcStrategyProxy.address
  );
  const cCurveUsdcStrategy = await hre.ethers.getContract("CurveUsdcStrategy");
  const oracleRouter = await hre.ethers.getContract("OracleRouter");

  const governor = await hre.ethers.getContract("Governor");

  //
  // Addresses
  //
  console.log("\nContract addresses");
  console.log("====================");
  console.log(`XUSD proxy:              ${xusdProxy.address}`);
  console.log(`XUSD impl:               ${await xusdProxy.implementation()}`);
  console.log(`XUSD:                    ${cXusd.address}`);
  console.log(`Vault proxy:             ${vaultProxy.address}`);
  console.log(`Vault impl:              ${await vaultProxy.implementation()}`);
  console.log(`Vault:                   ${cVault.address}`);
  console.log(`VaultCore:               ${vaultCore.address}`);
  console.log(`VaultAdmin:              ${vaultAdmin.address}`);
  console.log(`OracleRouter:            ${oracleRouter.address}`);
  console.log(`AaveStrategy proxy:      ${aaveProxy.address}`);
  console.log(`AaveStrategy impl:       ${await aaveProxy.implementation()}`);
  console.log(`AaveStrategy:            ${cAaveStrategy.address}`);
  console.log(`CurveUsdcStrategy proxy: ${curveUsdcStrategyProxy.address}`);
  console.log(`CurveUsdcStrategy impl:  ${await curveUsdcStrategyProxy.implementation()}`);
  console.log(`CurveUsdcStrategy:       ${cCurveUsdcStrategy.address}`);
  console.log(`Governor:                ${governor.address}`);

  //
  // Governor
  //
  const govAdmin = await governor.admin();
  const govPendingAdmin = await governor.pendingAdmin();
  const govDelay = await governor.delay();
  const govPropCount = await governor.proposalCount();
  console.log("\nGovernor");
  console.log("====================");
  console.log("Admin:           ", govAdmin);
  console.log("PendingAdmin:    ", govPendingAdmin);
  console.log("Delay (seconds): ", govDelay.toString());
  console.log("ProposalCount:   ", govPropCount.toString());

  //
  // Governance
  //

  // Read the current governor address on all the contracts.
  const xusdGovernorAddr = await xusd.governor();
  const vaultGovernorAddr = await vault.governor();
  const aaveStrategyGovernorAddr = await aaveStrategy.governor();
  const curveUsdcStrategyGovernorAddr = await curveUsdcStrategy.governor();

  console.log("\nGovernor addresses");
  console.log("====================");
  console.log("XUSD:              ", xusdGovernorAddr);
  console.log("Vault:             ", vaultGovernorAddr);
  console.log("AaveStrategy:      ", aaveStrategyGovernorAddr);
  console.log("CurveUsdcStrategy: ", curveUsdcStrategyGovernorAddr);
  //
  // XUSD
  //
  const name = await xusd.name();
  const decimals = await xusd.decimals();
  const symbol = await xusd.symbol();
  const totalSupply = await xusd.totalSupply();
  const vaultAddress = await xusd.vaultAddress();
  const nonRebasingSupply = await xusd.nonRebasingSupply();
  const rebasingSupply = totalSupply.sub(nonRebasingSupply);
  const rebasingCreditsPerToken = await xusd.rebasingCreditsPerToken();
  const rebasingCredits = await xusd.rebasingCredits();

  console.log("\nXUSD");
  console.log("=======");
  console.log(`name:                    ${name}`);
  console.log(`symbol:                  ${symbol}`);
  console.log(`decimals:                ${decimals}`);
  console.log(`totalSupply:             ${formatUnits(totalSupply, 18)}`);
  console.log(`vaultAddress:            ${vaultAddress}`);
  console.log(`nonRebasingSupply:       ${formatUnits(nonRebasingSupply, 18)}`);
  console.log(`rebasingSupply:          ${formatUnits(rebasingSupply, 18)}`);
  console.log(`rebasingCreditsPerToken: ${rebasingCreditsPerToken}`);
  console.log(`rebasingCredits:         ${rebasingCredits}`);

  //
  // Oracle
  //
  console.log("\nOracle");
  console.log("========");
  const priceDAI = await oracleRouter.price(addresses[networkName].DAI);
  const priceUSDC = await oracleRouter.price(addresses[networkName].USDC);
  const priceUSDCnative = await oracleRouter.price(
    addresses[networkName].USDC_native
  );
  const priceUSDT = await oracleRouter.price(addresses[networkName].USDT);
  console.log(`DAI.e price :   ${formatUnits(priceDAI, 8)} USD`);
  console.log(`USDC.e price:   ${formatUnits(priceUSDC, 8)} USD`);
  console.log(`USDC price:     ${formatUnits(priceUSDCnative, 8)} USD`);
  console.log(`USDT.e price:   ${formatUnits(priceUSDT, 8)} USD`);

  //
  // Vault
  //
  const rebasePaused = await vault.rebasePaused();
  const capitalPaused = await vault.capitalPaused();
  const redeemFeeBps = Number(await vault.redeemFeeBps());
  const trusteeFeeBps = Number(await vault.trusteeFeeBps());
  const vaultBuffer = Number(
    formatUnits((await vault.vaultBuffer()).toString(), 18)
  );
  const autoAllocateThreshold = await vault.autoAllocateThreshold();
  const rebaseThreshold = await vault.rebaseThreshold();
  const maxSupplyDiff = await vault.maxSupplyDiff();
  const uniswapAddr = await vault.uniswapAddr();
  const strategyCount = await vault.getStrategyCount();
  const assetCount = await vault.getAssetCount();
  const strategistAddress = await vault.strategistAddr();
  const trusteeAddress = await vault.trusteeAddress();
  const priceProvider = await vault.priceProvider();

  console.log("\nVault Settings");
  console.log("================");
  console.log("rebasePaused:\t\t\t", rebasePaused);
  console.log("capitalPaused:\t\t\t", capitalPaused);
  console.log(`redeemFeeBps:\t\t\t ${redeemFeeBps} (${redeemFeeBps / 100}%)`);
  console.log(
    `trusteeFeeBps:\t\t\t ${trusteeFeeBps} (${trusteeFeeBps / 100}%)`
  );
  console.log(`vaultBuffer:\t\t\t ${vaultBuffer} (${vaultBuffer * 100}%)`);
  console.log(
    "autoAllocateThreshold (USD):\t",
    formatUnits(autoAllocateThreshold.toString(), 18)
  );
  console.log(
    "rebaseThreshold (USD):\t\t",
    formatUnits(rebaseThreshold.toString(), 18)
  );

  console.log(
    `maxSupplyDiff:\t\t\t ${formatUnits(maxSupplyDiff.toString(), 16)}%`
  );

  console.log("Price provider address:\t\t", priceProvider);
  console.log("Uniswap address:\t\t", uniswapAddr);
  console.log("Strategy count:\t\t\t", Number(strategyCount));
  console.log("Asset count:\t\t\t", Number(assetCount));
  console.log("Strategist address:\t\t", strategistAddress);
  console.log("Trustee address:\t\t", trusteeAddress);

  const assets = [
    {
      symbol: "DAI.e",
      address: addresses[networkName].DAI,
      decimals: 18,
    },
    {
      symbol: "USDC.e",
      address: addresses[networkName].USDC,
      decimals: 6,
    },
    {
      symbol: "USDT.e",
      address: addresses[networkName].USDT,
      decimals: 6,
    },
    {
      symbol: "USDC",
      address: addresses[networkName].USDC_native,
      decimals: 6,
    },
  ];

  const totalValue = await vault.totalValue();
  const balances = {};
  for (const asset of assets) {
    const balance = await vault["checkBalance(address)"](asset.address);
    balances[asset.symbol] = formatUnits(balance.toString(), asset.decimals);
  }

  console.log("\nVault balances");
  console.log("================");
  console.log(
    `totalValue (USD):\t $${Number(
      formatUnits(totalValue.toString(), 18)
    ).toFixed(2)}`
  );
  for (const [symbol, balance] of Object.entries(balances)) {
    console.log(`  ${symbol}:\t\t ${Number(balance).toFixed(2)}`);
  }

  console.log("\nVault buffer balances");
  console.log("================");

  const vaultBufferBalances = {};
  for (const asset of assets) {
    vaultBufferBalances[asset.symbol] =
      (await (
        await hre.ethers.getContractAt(erc20Abi, asset.address)
      ).balanceOf(vault.address)) /
      (1 * 10 ** asset.decimals);
  }
  for (const [symbol, balance] of Object.entries(vaultBufferBalances)) {
    console.log(`${symbol}:\t\t\t ${balance}`);
  }

  console.log("\nStrategies balances");
  console.log("=====================");
  let balance, balanceRaw, asset;
  //
  // Aave Strategy
  //
  await Promise.all(
    assets.slice(0, 3).map(async (asset) => {
      balanceRaw = await aaveStrategy.checkBalance(asset.address);
      balance = formatUnits(balanceRaw.toString(), asset.decimals);
      console.log(`Aave ${asset.symbol}:\t\t balance=${balance}`);
    })
  );

  //
  // Curve USDC/USDC.e Strategy
  // Supports all USDC.e and USDC
  //
  let usdcAssets = [assets[1], assets[3]];
  for (asset of usdcAssets) {
    balanceRaw = await curveUsdcStrategy.checkBalance(asset.address);
    balance = formatUnits(balanceRaw.toString(), asset.decimals);
    console.log(`Curve ${asset.symbol}:\t\t balance=${balance}`);
  }

  //
  // Strategies settings
  //

  console.log("\nDefault strategies");
  console.log("============================");
  for (const asset of assets) {
    console.log(
      asset.symbol,
      `\t${await vault.assetDefaultStrategies(asset.address)}`
    );
  }

  console.log("\nAave strategy settings");
  console.log("============================");
  console.log("vaultAddress:\t\t\t", await aaveStrategy.vaultAddress());
  console.log("platformAddress:\t\t", await aaveStrategy.platformAddress());
  console.log(
    "rewardTokenAddress:\t\t",
    await aaveStrategy.rewardTokenAddress()
  );
  console.log(
    "rewardLiquidationThreshold:\t",
    (await aaveStrategy.rewardLiquidationThreshold()).toString()
  );
  for (const asset of assets) {
    console.log(
      `supportsAsset(${asset.symbol}):\t\t`,
      await aaveStrategy.supportsAsset(asset.address)
    );
  }

  console.log("\nCurve USDC/USDC.e strategy settings");
  console.log("==============================");
  console.log("vaultAddress:\t\t\t", await curveUsdcStrategy.vaultAddress());
  console.log(
    "platformAddress:\t\t",
    await curveUsdcStrategy.platformAddress()
  );
  console.log(
    "rewardTokenAddress:\t\t",
    await curveUsdcStrategy.rewardTokenAddress()
  );
  console.log(
    "rewardLiquidationThreshold:\t",
    (await curveUsdcStrategy.rewardLiquidationThreshold()).toString()
  );

  for (const asset of assets) {
    console.log(
      `supportsAsset(${asset.symbol}):\t\t`,
      await curveUsdcStrategy.supportsAsset(asset.address)
    );
  }
}

async function printHashes() {
  console.log(utils.keccak256(utils.toUtf8Bytes("XUSD.governor")), [
    "XUSD.governor",
  ]);
  console.log(utils.keccak256(utils.toUtf8Bytes("XUSD.pending.governor")), [
    "XUSD.pending.governor",
  ]);
  console.log(utils.keccak256(utils.toUtf8Bytes("XUSD.reentry.status")), [
    "XUSD.reentry.status",
  ]);
  console.log(
    utils.keccak256(utils.toUtf8Bytes("XUSD.vault.governor.admin.impl")),
    ["XUSD.vault.governor.admin.impl"]
  );
}

module.exports = {
  debug,
  printHashes,
};
