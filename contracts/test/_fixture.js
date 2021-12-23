const hre = require("hardhat");

const addresses = require("../utils/addresses");
const fundAccounts = require("../utils/funding");
const { getAssetAddresses, daiUnits, isFork } = require("./helpers");
const { utils } = require("ethers");

const { loadFixture, getOracleAddresses } = require("./helpers");

const daiAbi = require("./abi/dai.json").abi;
const usdtAbi = require("./abi/usdt.json").abi;
const usdcAbi = require("./abi/erc20.json");
const tusdAbi = require("../test/abi/erc20.json");

async function defaultFixture() {
  await deployments.fixture();

  const { governorAddr } = await getNamedAccounts();

  const xusdProxy = await ethers.getContract("XUSDProxy");
  const vaultProxy = await ethers.getContract("VaultProxy");

  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);
  const vault = await ethers.getContractAt("IVault", vaultProxy.address);
  const governorContract = await ethers.getContract("Governor");

  const aaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const aaveStrategy = await ethers.getContractAt(
    "AaveStrategy",
    aaveStrategyProxy.address
  );
  const aaveIncentivesController = await ethers.getContract(
    "MockAaveIncentivesController"
  );

  const oracleRouter = await ethers.getContract("OracleRouter");

  let usdt,
    dai,
    tusd,
    usdc,
    nonStandardToken,
    adai,
    aave,
    aaveToken,
    wavax,
    mockNonRebasing,
    mockNonRebasingTwo;

  let chainlinkOracleFeedDAI,
    chainlinkOracleFeedUSDT,
    chainlinkOracleFeedUSDC,
    chainlinkOracleFeedAVAX,
    chainlinkOracleFeedWAVAX,
    aaveAddressProvider,
    flipper;

  if (isFork) {
    usdt = await ethers.getContractAt(usdtAbi, addresses.mainnet.USDT);
    dai = await ethers.getContractAt(daiAbi, addresses.mainnet.DAI);
    usdc = await ethers.getContractAt(usdcAbi, addresses.mainnet.USDC);
    tusd = await ethers.getContractAt(tusdAbi, addresses.mainnet.TUSD);
    wavax = await ethers.getContractAt(tusdAbi, addresses.mainnet.WAVAX);
    aaveAddressProvider = await ethers.getContractAt(
      "ILendingPoolAddressesProvider",
      addresses.mainnet.AAVE_ADDRESS_PROVIDER
    );
  } else {
    usdt = await ethers.getContract("MockUSDT");
    dai = await ethers.getContract("MockDAI");
    usdc = await ethers.getContract("MockUSDC");
    tusd = await ethers.getContract("MockTUSD");
    wavax = await ethers.getContract("MockWAVAX");
    nonStandardToken = await ethers.getContract("MockNonStandardToken");

    adai = await ethers.getContract("MockADAI");
    aaveToken = await ethers.getContract("MockAAVEToken");
    aave = await ethers.getContract("MockAave");
    // currently in test the mockAave is itself the address provder
    aaveAddressProvider = await ethers.getContractAt(
      "ILendingPoolAddressesProvider",
      aave.address
    );

    chainlinkOracleFeedDAI = await ethers.getContract(
      "MockChainlinkOracleFeedDAI"
    );
    chainlinkOracleFeedUSDT = await ethers.getContract(
      "MockChainlinkOracleFeedUSDT"
    );
    chainlinkOracleFeedUSDC = await ethers.getContract(
      "MockChainlinkOracleFeedUSDC"
    );
    chainlinkOracleFeedAVAX = await ethers.getContract(
      "MockChainlinkOracleFeedAVAX"
    );
    chainlinkOracleFeedWAVAX = await ethers.getContract(
      "MockChainlinkOracleFeedWAVAX"
    );

    // Mock contracts for testing rebase opt out
    mockNonRebasing = await ethers.getContract("MockNonRebasing");
    await mockNonRebasing.setXUSD(xusd.address);
    mockNonRebasingTwo = await ethers.getContract("MockNonRebasingTwo");
    await mockNonRebasingTwo.setXUSD(xusd.address);

    flipper = await ethers.getContract("Flipper");
  }
  const assetAddresses = await getAssetAddresses(deployments);
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  // Add TUSD in fixture, it is disabled by default in deployment
  await vault.connect(sGovernor).supportAsset(assetAddresses.TUSD);

  // Enable capital movement
  await vault.connect(sGovernor).unpauseCapital();

  const signers = await hre.ethers.getSigners();
  const governor = signers[1];
  const strategist = signers[0];
  const adjuster = signers[0];
  const matt = signers[4];
  const josh = signers[5];
  const anna = signers[6];

  await fundAccounts();

  // Matt and Josh each have $100 XUSD
  for (const user of [matt, josh]) {
    await dai.connect(user).approve(vault.address, daiUnits("100"));
    await vault.connect(user).mint(dai.address, daiUnits("100"), 0);
  }

  return {
    // Accounts
    matt,
    josh,
    anna,
    governor,
    strategist,
    adjuster,
    // Contracts
    xusd,
    vault,
    mockNonRebasing,
    mockNonRebasingTwo,
    // Oracle
    chainlinkOracleFeedDAI,
    chainlinkOracleFeedUSDT,
    chainlinkOracleFeedUSDC,
    chainlinkOracleFeedAVAX,
    chainlinkOracleFeedWAVAX,
    governorContract,
    oracleRouter,
    // Assets
    usdt,
    dai,
    usdc,
    tusd,
    nonStandardToken,
    wavax,
    // aTokens,
    adai,

    aaveStrategy,
    aaveToken,
    aaveAddressProvider,
    aaveIncentivesController,
    aave,
    flipper,
  };
}

/**
 * Configure the MockVault contract by initializing it and setting supported
 * assets and then upgrade the Vault implementation via VaultProxy.
 */
async function mockVaultFixture() {
  const fixture = await loadFixture(defaultFixture);

  const { governorAddr } = await getNamedAccounts();
  const sGovernor = ethers.provider.getSigner(governorAddr);

  // Initialize and configure MockVault
  const cMockVault = await ethers.getContract("MockVault");

  // There is no need to initialize and setup the mock vault because the
  // proxy itself is already setup and the proxy is the one with the storage

  // Upgrade Vault to MockVault via proxy
  const cVaultProxy = await ethers.getContract("VaultProxy");
  await cVaultProxy.connect(sGovernor).upgradeTo(cMockVault.address);

  fixture.mockVault = await ethers.getContractAt(
    "MockVault",
    cVaultProxy.address
  );

  return fixture;
}

/**
 * Configure a Vault with only the Aave strategy.
 */
async function aaveVaultFixture() {
  const fixture = await loadFixture(defaultFixture);

  const { governorAddr } = await getNamedAccounts();
  const sGovernor = await ethers.provider.getSigner(governorAddr);
  // Add Aave which only supports DAI
  await fixture.vault
    .connect(sGovernor)
    .approveStrategy(fixture.aaveStrategy.address);
  // Add direct allocation of DAI, USDC, USDT to Aave
  await fixture.vault
    .connect(sGovernor)
    .setAssetDefaultStrategy(fixture.dai.address, fixture.aaveStrategy.address);
  await fixture.vault
    .connect(sGovernor)
    .setAssetDefaultStrategy(
      fixture.usdc.address,
      fixture.aaveStrategy.address
    );
  await fixture.vault
    .connect(sGovernor)
    .setAssetDefaultStrategy(
      fixture.usdt.address,
      fixture.aaveStrategy.address
    );
  return fixture;
}

/**
 * Configure a Vault with two strategies
 */
async function multiStrategyVaultFixture() {
  const fixture = await aaveVaultFixture();
  const assetAddresses = await getAssetAddresses(deployments);
  const { deploy } = deployments;

  const { governorAddr } = await getNamedAccounts();
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  await deploy("StrategyTwo", {
    from: governorAddr,
    contract: "AaveStrategy",
  });

  const cStrategyTwo = await ethers.getContract("StrategyTwo");
  // Initialize the second strategy with DAI and USDC
  const initFunctionName =
    "initialize(address,address,address,address[],address[],address)";
  await cStrategyTwo.connect(sGovernor)[initFunctionName](
    // eslint-disable-line
    assetAddresses.AAVE_ADDRESS_PROVIDER,
    fixture.vault.address,
    assetAddresses.WAVAX,
    [assetAddresses.DAI, assetAddresses.USDC],
    [assetAddresses.avDAI, assetAddresses.avUSDC],
    assetAddresses.AAVE_INCENTIVES_CONTROLLER
  );
  // Add second strategy to Vault
  await fixture.vault.connect(sGovernor).approveStrategy(cStrategyTwo.address);
  // DAI to second strategy
  await fixture.vault
    .connect(sGovernor)
    .setAssetDefaultStrategy(fixture.dai.address, cStrategyTwo.address);

  // Set up third strategy
  await deploy("StrategyThree", {
    from: governorAddr,
    contract: "AaveStrategy",
  });
  const cStrategyThree = await ethers.getContract("StrategyThree");
  // Initialize the third strategy with only DAI
  await cStrategyThree.connect(sGovernor)[initFunctionName](
    // eslint-disable-line
    assetAddresses.AAVE_ADDRESS_PROVIDER,
    fixture.vault.address,
    assetAddresses.WAVAX,
    [assetAddresses.DAI],
    [assetAddresses.avDAI],
    assetAddresses.AAVE_INCENTIVES_CONTROLLER
  );

  fixture.strategyTwo = cStrategyTwo;
  fixture.strategyThree = cStrategyThree;
  return fixture;
}

/**
 * Configure a hacked Vault
 */
async function hackedVaultFixture() {
  const fixture = await loadFixture(defaultFixture);
  const assetAddresses = await getAssetAddresses(deployments);
  const { deploy } = deployments;
  const { vault, oracleRouter } = fixture;
  const { governorAddr } = await getNamedAccounts();
  const sGovernor = await ethers.provider.getSigner(governorAddr);
  const oracleAddresses = await getOracleAddresses(hre.deployments);

  await deploy("MockEvilDAI", {
    from: governorAddr,
    args: [vault.address, assetAddresses.DAI],
  });

  const evilDAI = await ethers.getContract("MockEvilDAI");

  await oracleRouter.setFeed(
    evilDAI.address,
    oracleAddresses.chainlink.DAI_USD
  );
  await fixture.vault.connect(sGovernor).supportAsset(evilDAI.address);

  fixture.evilDAI = evilDAI;

  return fixture;
}

/**
 * Configure a reborn hack attack
 */
async function rebornFixture() {
  const fixture = await loadFixture(defaultFixture);
  const assetAddresses = await getAssetAddresses(deployments);
  const { deploy } = deployments;
  const { governorAddr } = await getNamedAccounts();
  const { vault } = fixture;

  await deploy("Sanctum", {
    from: governorAddr,
    args: [assetAddresses.DAI, vault.address],
  });

  const sanctum = await ethers.getContract("Sanctum");

  const encodedCallbackAddress = utils.defaultAbiCoder
    .encode(["address"], [sanctum.address])
    .slice(2);
  const initCode = (await ethers.getContractFactory("Reborner")).bytecode;
  const deployCode = `${initCode}${encodedCallbackAddress}`;

  await sanctum.deploy(12345, deployCode);
  const rebornAddress = await sanctum.computeAddress(12345, deployCode);
  const reborner = await ethers.getContractAt("Reborner", rebornAddress);

  const rebornAttack = async (shouldAttack = true, targetMethod = null) => {
    await sanctum.setShouldAttack(shouldAttack);
    if (targetMethod) await sanctum.setTargetMethod(targetMethod);
    await sanctum.setXUSDAddress(fixture.xusd.address);
    await sanctum.deploy(12345, deployCode);
  };

  fixture.reborner = reborner;
  fixture.rebornAttack = rebornAttack;

  return fixture;
}

module.exports = {
  defaultFixture,
  mockVaultFixture,
  aaveVaultFixture,
  multiStrategyVaultFixture,
  hackedVaultFixture,
  rebornFixture,
};
