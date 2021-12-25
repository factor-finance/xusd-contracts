const hre = require("hardhat");

const {
  getAssetAddresses,
  getOracleAddresses,
  isMainnet,
  isFork,
} = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

/**
 * Deploy AAVE Strategy which only supports DAI.
 * Deploys a proxy, the actual strategy, initializes the proxy and initializes
 * the strategy.
 */
const deployAaveStrategy = async () => {
  const assetAddresses = await getAssetAddresses(hre.deployments);
  const { deployerAddr, governorAddr } = await getNamedAccounts();
  // Signers
  const sDeployer = await ethers.provider.getSigner(deployerAddr);
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  const cVaultProxy = await ethers.getContract("VaultProxy");

  const dAaveStrategyProxy = await deployWithConfirmation(
    "AaveStrategyProxy",
    [],
    "InitializeGovernedUpgradeabilityProxy"
  );
  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const dAaveStrategy = await deployWithConfirmation("AaveStrategy");
  const cAaveStrategy = await ethers.getContractAt(
    "AaveStrategy",
    dAaveStrategyProxy.address
  );
  await withConfirmation(
    cAaveStrategyProxy["initialize(address,address,bytes)"](
      dAaveStrategy.address,
      deployerAddr,
      []
    )
  );

  const cAaveIncentivesController = await ethers.getContract(
    "MockAaveIncentivesController"
  );

  log("Initialized AaveStrategyProxy");
  const initFunctionName =
    "initialize(address,address,address,address[],address[],address)";
  await withConfirmation(
    cAaveStrategy
      .connect(sDeployer)
      [initFunctionName](
        assetAddresses.AAVE_ADDRESS_PROVIDER,
        cVaultProxy.address,
        assetAddresses.WAVAX,
        [assetAddresses.DAI, assetAddresses.USDT, assetAddresses.USDC],
        [assetAddresses.avDAI, assetAddresses.avUSDT, assetAddresses.avUSDC],
        cAaveIncentivesController.address
      )
  );
  log("Initialized AaveStrategy");
  await withConfirmation(
    cAaveStrategy.connect(sDeployer).transferGovernance(governorAddr)
  );
  log(`AaveStrategy transferGovernance(${governorAddr} called`);

  // On Mainnet the governance transfer gets executed separately, via the
  // multi-sig wallet. On other networks, this migration script can claim
  // governance by the governor.
  if (!isMainnet) {
    await withConfirmation(
      cAaveStrategy
        .connect(sGovernor) // Claim governance with governor
        .claimGovernance()
    );
    log("Claimed governance for AaveStrategy");
  }

  return cAaveStrategy;
};

/**
 * Configure Vault by adding supported assets and Strategies.
 */
const configureVault = async () => {
  const assetAddresses = await getAssetAddresses(deployments);
  const { governorAddr, strategistAddr } = await getNamedAccounts();
  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  await ethers.getContractAt(
    "VaultInitializer",
    (
      await ethers.getContract("VaultProxy")
    ).address
  );
  const cVault = await ethers.getContractAt(
    "VaultAdmin",
    (
      await ethers.getContract("VaultProxy")
    ).address
  );
  // Set up supported assets for Vault
  await withConfirmation(
    cVault.connect(sGovernor).supportAsset(assetAddresses.DAI)
  );
  log("Added DAI asset to Vault");
  await withConfirmation(
    cVault.connect(sGovernor).supportAsset(assetAddresses.USDT)
  );
  log("Added USDT asset to Vault");
  await withConfirmation(
    cVault.connect(sGovernor).supportAsset(assetAddresses.USDC)
  );
  log("Added USDC asset to Vault");
  // Unpause deposits
  await withConfirmation(cVault.connect(sGovernor).unpauseCapital());
  log("Unpaused deposits on Vault");
  // Set Strategist address.
  await withConfirmation(
    cVault.connect(sGovernor).setStrategistAddr(strategistAddr)
  );
};

/**
 * Deploy the OracleRouter and initialise it with Chainlink sources.
 */
const deployOracles = async () => {
  const { deployerAddr } = await getNamedAccounts();
  // Signers
  const sDeployer = await ethers.provider.getSigner(deployerAddr);

  // TODO: Change this to intelligently decide which router contract to deploy?
  const oracleContract = isMainnet ? "OracleRouter" : "OracleRouterDev";
  await deployWithConfirmation("OracleRouter", [], oracleContract);
  const oracleRouter = await ethers.getContract("OracleRouter");

  // Register feeds
  // Not needed in production
  const oracleAddresses = await getOracleAddresses(deployments);
  const assetAddresses = await getAssetAddresses(deployments);
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(assetAddresses.DAI, oracleAddresses.chainlink.DAI_USD)
  );
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(assetAddresses.USDC, oracleAddresses.chainlink.USDC_USD)
  );
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(assetAddresses.USDT, oracleAddresses.chainlink.USDT_USD)
  );
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(assetAddresses.TUSD, oracleAddresses.chainlink.TUSD_USD)
  );
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(assetAddresses.WAVAX, oracleAddresses.chainlink.AVAX_USD)
  );
  withConfirmation(
    oracleRouter
      .connect(sDeployer)
      .setFeed(
        assetAddresses.NonStandardToken,
        oracleAddresses.chainlink.NonStandardToken_USD
      )
  );
};

//
// Deploys a new governor contract on Mainnet
//

const deployGovernor = async () => {
  console.log("Running governor deployment...");
  const { guardianAddr } = await hre.getNamedAccounts();
  if (!guardianAddr) {
    throw new Error("No guardian address defined.");
  }
  // Deploy a new governor contract.
  // The governor's admin is the guardian account (e.g. the multi-sig).
  // Set a min delay of 60sec for executing proposals.
  await deployWithConfirmation("Governor", [guardianAddr, 60]);

  console.log("Governonr deploy done.");
  return true;
};

/**
 * Deploy the core contracts (Vault and XUSD).
 *
 */
const deployCore = async () => {
  const { governorAddr } = await hre.getNamedAccounts();
  console.log(await hre.getNamedAccounts());

  const assetAddresses = await getAssetAddresses(deployments);
  log(`Using asset addresses: ${JSON.stringify(assetAddresses, null, 2)}`);

  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  // Proxies
  await deployWithConfirmation("XUSDProxy");
  await deployWithConfirmation("VaultProxy");

  // Main contracts
  const dXUSD = await deployWithConfirmation("XUSD");
  const dVault = await deployWithConfirmation("Vault");
  const dVaultCore = await deployWithConfirmation("VaultCore");
  const dVaultAdmin = await deployWithConfirmation("VaultAdmin");

  await deployGovernor();

  // Get contract instances
  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  const cXUSD = await ethers.getContractAt("XUSD", cXUSDProxy.address);
  const cOracleRouter = await ethers.getContract("OracleRouter");
  const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

  await withConfirmation(
    cXUSDProxy["initialize(address,address,bytes)"](
      dXUSD.address,
      governorAddr,
      []
    )
  );
  log("Initialized XUSDProxy");

  // Need to call the initializer on the Vault then upgraded it to the actual
  // VaultCore implementation
  await withConfirmation(
    cVaultProxy["initialize(address,address,bytes)"](
      dVault.address,
      governorAddr,
      []
    )
  );
  log("Initialized VaultProxy");

  await withConfirmation(
    cVault
      .connect(sGovernor)
      .initialize(cOracleRouter.address, cXUSDProxy.address)
  );
  log("Initialized Vault");

  await withConfirmation(
    cVaultProxy.connect(sGovernor).upgradeTo(dVaultCore.address)
  );
  log("Upgraded VaultCore implementation");

  await withConfirmation(
    cVault.connect(sGovernor).setAdminImpl(dVaultAdmin.address)
  );
  log("Initialized VaultAdmin implementation");

  // Initialize XUSD
  await withConfirmation(
    cXUSD.connect(sGovernor).initialize("XUSD.fi", "XUSD", cVaultProxy.address)
  );

  log("Initialized XUSD");
};

// Deploy the Flipper trading contract
const deployFlipper = async () => {
  const assetAddresses = await getAssetAddresses(deployments);
  const { governorAddr } = await hre.getNamedAccounts();
  const sGovernor = await ethers.provider.getSigner(governorAddr);
  const xusd = await ethers.getContract("XUSDProxy");

  await deployWithConfirmation("Flipper", [
    assetAddresses.DAI,
    xusd.address,
    assetAddresses.USDC,
    assetAddresses.USDT,
  ]);
  const flipper = await ethers.getContract("Flipper");
  await withConfirmation(flipper.transferGovernance(governorAddr));
  await withConfirmation(flipper.connect(sGovernor).claimGovernance());
};

const main = async () => {
  console.log("Running 001_core deployment...");
  // assumes you have a guardian deployed
  await deployOracles();
  await deployCore();
  await deployAaveStrategy();
  await configureVault();
  await deployFlipper();
  console.log("001_core deploy done.");
  return true;
};

main.id = "001_core";
main.dependencies = ["mocks"];
// main.skip = () => isFork;

module.exports = main;
