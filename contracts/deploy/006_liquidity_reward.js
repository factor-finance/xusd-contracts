//
// Deploy new Liquidity Reward contract
//
const {
  getAssetAddresses,
  isMainnet,
  isRinkeby,
  isFork,
  isMainnetOrRinkebyOrFork,
} = require("../test/helpers.js");
const addresses = require("../utils/addresses.js");
const { utils } = require("ethers");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

const deployName = "006_liquidity_reward";

const liquidityReward = async ({ getNamedAccounts, deployments }) => {
  console.log(`Running ${deployName} deployment...`);

  const { governorAddr, deployerAddr } = await getNamedAccounts();

  const assetAddresses = await getAssetAddresses(deployments);

  for (const stablecoin of ["USDT", "USDC", "DAI"]) {
    if (!isMainnetOrRinkebyOrFork) {
      // Mock Uniswap pair for XUSD -> USDT is dependent on XUSD being deployed
      const cXUSDProxy = await ethers.getContract("XUSDProxy");

      const reserve100XUSD = utils.parseUnits("100", 18);
      const reserve100STABLECOIN = utils.parseUnits(
        "100",
        stablecoin === "DAI" ? 18 : 6
      );

      await deployWithConfirmation(
        `MockUniswapPairXUSD_${stablecoin}`,
        [
          cXUSDProxy.address,
          assetAddresses[stablecoin],
          reserve100XUSD,
          reserve100STABLECOIN,
        ],
        "MockMintableUniswapPair"
      );
    }

    const UniswapXUSD_STABLECOIN =
      isMainnet || isFork
        ? addresses.mainnet[`uniswapXUSD_${stablecoin}`]
        : (await ethers.getContract(`MockUniswapPairXUSD_${stablecoin}`))
            .address;

    const sDeployer = ethers.provider.getSigner(deployerAddr);
    const sGovernor = ethers.provider.getSigner(governorAddr);

    //
    // Deploy
    //

    // Deploy the liquidity reward proxy.
    await deployWithConfirmation(
      `LiquidityRewardXUSD_${stablecoin}Proxy`,
      [],
      "InitializeGovernedUpgradeabilityProxy"
    );

    // Deploy the liquidityReward.
    const dLiquidityReward = await deployWithConfirmation("LiquidityReward");

    //
    // Initialize
    //

    // Initialize the proxy.
    const cLiquidityRewardXUSD_STABLECOINProxy = await ethers.getContract(
      `LiquidityRewardXUSD_${stablecoin}Proxy`
    );
    await withConfirmation(
      cLiquidityRewardXUSD_STABLECOINProxy["initialize(address,address,bytes)"](
        dLiquidityReward.address,
        deployerAddr,
        []
      )
    );
    log(`Initialized LiquidityRewardProxy for ${stablecoin}`);

    // Initialize the LiquidityReward
    const cLiquidityRewardXUSD_STABLECOIN = await ethers.getContractAt(
      "LiquidityReward",
      cLiquidityRewardXUSD_STABLECOINProxy.address
    );
    log(`OGN Asset address: ${assetAddresses.OGN}`);
    await withConfirmation(
      cLiquidityRewardXUSD_STABLECOIN
        .connect(sDeployer)
        .initialize(assetAddresses.OGN, UniswapXUSD_STABLECOIN)
    );
    log(`Initialized LiquidRewardStrategy for ${stablecoin}`);

    await withConfirmation(
      cLiquidityRewardXUSD_STABLECOIN
        .connect(sDeployer)
        .transferGovernance(governorAddr)
    );
    log(
      `LiquidReward transferGovernance(${governorAddr} called for ${stablecoin}`
    );

    // On Mainnet the governance transfer gets executed separately, via the
    // multi-sig wallet. On other networks, this migration script can claim
    // governance by the governor.
    if (!isMainnetOrRinkebyOrFork) {
      await cLiquidityRewardXUSD_STABLECOIN
        .connect(sGovernor)
        .claimGovernance();
      log(`Claimed governance for LiquidityReward for ${stablecoin}`);
    }

    // Fund the liquidity contract with OGN to be used as reward.
    //  - For testing this can be done automatically by this script.
    //  - For Mainnet we manually transfer OGN to the contract and then start the campaign.
    // The Reward rate should start out as:
    //      18,000,000 OGN (<- totalRewards passed in)
    //       ÷ 6,500 blocks per day
    //       ÷ 180 days in the campaign
    //       ⨉ 40% weight for the XUSD/OGN pool
    //        = 6.153846153846154 OGN per block
    // Remember to transfer in:
    //     18,000,000 * 40% = 7,200,000
    //
    //  So starting the campaign would look like:
    //  await cLiquidityRewardXUSD_USDT
    //    .connect(sGovernor).startCampaign(
    //        utils.parseUnits("6.153846153846154", 18),
    //        0, 6500 * 180);
    //
    if (!isMainnetOrRinkebyOrFork) {
      const ogn = await ethers.getContract("MockOGN");
      const loadAmount = utils.parseUnits("7200000", 18);
      const rate = utils.parseUnits("6.1538461538", 18);
      await ogn.connect(sGovernor).mint(loadAmount);
      await ogn
        .connect(sGovernor)
        .transfer(cLiquidityRewardXUSD_STABLECOIN.address, loadAmount);

      await cLiquidityRewardXUSD_STABLECOIN
        .connect(sGovernor)
        .startCampaign(rate, 0, 6500 * 180);
    }
  }

  console.log(`${deployName} deployment done.`);
  return true;
};

liquidityReward.id = deployName;
liquidityReward.dependencies = ["core"];

// Liquidity mining will get deployed to Rinkeby and Mainnet at a later date.
liquidityReward.skip = () => isMainnet || isRinkeby || isFork;

module.exports = liquidityReward;
