//
// Script to deploy the Single Asset Staking contract.
//
const {
  getAssetAddresses,
  isMainnet,
  isTest,
  isMainnetOrRinkebyOrFork,
} = require("../test/helpers.js");
const { utils } = require("ethers");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

const deployName = "004_single_asset_staking";

const singleAssetStaking = async ({ getNamedAccounts, deployments }) => {
  console.log(`Running ${deployName} deployment...`);

  const { governorAddr, deployerAddr } = await getNamedAccounts();

  const assetAddresses = await getAssetAddresses(deployments);

  const sDeployer = ethers.provider.getSigner(deployerAddr);
  const sGovernor = ethers.provider.getSigner(governorAddr);

  //
  // Deploy contracts.
  //
  await deployWithConfirmation(
    "OGNStakingProxy",
    [],
    "InitializeGovernedUpgradeabilityProxy"
  );
  const dSingleAssetStaking = await deployWithConfirmation(
    "SingleAssetStaking"
  );

  //
  // Initialize
  //

  // Initialize the proxy.
  const cOGNStakingProxy = await ethers.getContract("OGNStakingProxy");
  await withConfirmation(
    cOGNStakingProxy["initialize(address,address,bytes)"](
      dSingleAssetStaking.address,
      deployerAddr,
      []
    )
  );
  log("Initialized OGNStakingProxy");

  // Initialize the SingleAssetStaking contract.
  const cOGNStaking = await ethers.getContractAt(
    "SingleAssetStaking",
    cOGNStakingProxy.address
  );

  const minute = 60;
  const day = 24 * 60 * minute;
  let durations;
  if (isMainnet || isTest) {
    // Staking durations are 90 days, 180 days, 365 days
    durations = [90 * day, 180 * day, 360 * day];
  } else {
    // Rinkeby or localhost or ganacheFork need a shorter stake for testing purposes.
    // Add a very quick vesting rate ideal for testing (10 minutes).
    durations = [90 * day, 4 * minute, 360 * day];
  }
  const rates = [
    utils.parseUnits("0.085", 18),
    utils.parseUnits("0.145", 18),
    utils.parseUnits("0.30", 18),
  ];

  log("OGN Asset address:", assetAddresses.OGN);
  await withConfirmation(
    cOGNStaking
      .connect(sDeployer)
      .initialize(assetAddresses.OGN, durations, rates)
  );
  log("Initialized OGNStaking");

  // the first drop type is currently the test root hash
  // Hash is generated by scripts/staking/airDrop.js
  const dropRootHash = isMainnetOrRinkebyOrFork
    ? process.env.DROP_ROOT_HASH
    : "0xa2ca0464a8390f1f90b2a13aa8e18e8d366ab2d5cbc89cdfec970ad54836685c";

  const dropRootDepth = isMainnetOrRinkebyOrFork
    ? process.env.DROP_ROOT_DEPTH
    : "2";

  // 1 is the first drop type
  await cOGNStaking
    .connect(sDeployer)
    .setAirDropRoot(1, dropRootHash, dropRootDepth);

  //
  // Transfer governance of the proxy to the governor.
  //
  let strategyGovAddr;
  if (isMainnet) {
    // On Mainnet the governor is the TimeLock
    strategyGovAddr = (await ethers.getContract("MinuteTimelock")).address;
  } else {
    strategyGovAddr = governorAddr;
  }

  await withConfirmation(
    cOGNStaking.connect(sDeployer).transferGovernance(strategyGovAddr)
  );
  log(`OGNStaking transferGovernance(${strategyGovAddr} called`);

  // On Mainnet the governance transfer gets executed separately, via the
  // multi-sig wallet. On other networks, this migration script can claim
  // governance by the governor.
  if (!isMainnet) {
    await cOGNStaking.connect(sGovernor).claimGovernance();
    log("Claimed governance for OGNStaking");

    const ogn = await ethers.getContract("MockOGN");
    // Amount to load in for rewards
    // Put in a small amount so that we can hit limits for testing
    const loadAmount = utils.parseUnits("299", 18);
    await ogn.connect(sGovernor).mint(loadAmount);
    await ogn.connect(sGovernor).transfer(cOGNStaking.address, loadAmount);
  }

  // For mainnet we'd want to transfer OGN to the contract to cover any rewards

  console.log(`${deployName} deploy done.`);

  return true;
};

singleAssetStaking.id = deployName;
singleAssetStaking.dependencies = ["core"];

module.exports = singleAssetStaking;
