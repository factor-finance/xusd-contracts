const { parseUnits } = require("ethers").utils;
const { isTest, isLocalhost } = require("../test/helpers");

const deployMocks = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployerAddr, governorAddr } = await getNamedAccounts();

  console.log("Running 000_mock deployment...");
  console.log("Deployer address", deployerAddr);
  console.log("Governor address", governorAddr);

  // Deploy mock coins (assets)
  const assetContracts = [
    "MockUSDT",
    "MockUSDC",
    "MockTUSD",
    "MockDAI",
    "MockNonStandardToken",
    "MockAave",
    "MockWAVAX",
  ];
  for (const contract of assetContracts) {
    await deploy(contract, { from: deployerAddr });
  }

  // Mock Comptroller
  await deploy("MockComptroller", {
    from: deployerAddr,
  });

  // Deploy a mock Vault with additional functions for tests
  await deploy("MockVault", {
    from: governorAddr,
  });

  const dai = await ethers.getContract("MockDAI");
  const usdc = await ethers.getContract("MockUSDC");
  const usdt = await ethers.getContract("MockUSDT");

  // Deploy mock aTokens (Aave)
  // MockAave is the mock lendingPool
  const lendingPool = await ethers.getContract("MockAave");
  await deploy("MockADAI", {
    args: [lendingPool.address, "Mock Aave Dai", "avDAI", dai.address],
    contract: "MockAToken",
    from: deployerAddr,
  });
  lendingPool.addAToken(
    (await ethers.getContract("MockADAI")).address,
    dai.address
  );

  await deploy("MockAUSDC", {
    args: [lendingPool.address, "Mock Aave USDC", "avUSDC", usdc.address],
    contract: "MockAToken",
    from: deployerAddr,
  });
  lendingPool.addAToken(
    (await ethers.getContract("MockAUSDC")).address,
    usdc.address
  );

  await deploy("MockAUSDT", {
    args: [lendingPool.address, "Mock Aave USDT", "avUSDT", usdt.address],
    contract: "MockAToken",
    from: deployerAddr,
  });
  lendingPool.addAToken(
    (await ethers.getContract("MockAUSDT")).address,
    usdt.address
  );

  // Deploy mock chainlink oracle price feeds.
  await deploy("MockChainlinkOracleFeedDAI", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 DAI = 1 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedUSDT", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 USDT = 1 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedTUSD", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 TUSDT = 1 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedUSDC", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 USDC = 1 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedNonStandardToken", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 = 1 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedAVAX", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    args: [parseUnits("1", 8).toString(), 18], // 1 ETH = 4000 USD, 8 digits decimal.
  });
  await deploy("MockChainlinkOracleFeedWAVAX", {
    from: deployerAddr,
    contract: "MockChainlinkOracleFeed",
    // if you set this to something other than 1, uniswap v2 mock breaks
    args: [parseUnits("1", 8).toString(), 18], // 1 WAVAX = 1 USD, 18 digits decimal.
  });

  // Deploy mock Uniswap router
  await deploy("MockPangolinRouter", {
    from: deployerAddr,
  });

  await deploy("MockAAVEToken", {
    from: deployerAddr,
    args: [],
  });

  const wavax = await ethers.getContract("MockWAVAX");
  await deploy("MockAaveIncentivesController", {
    from: deployerAddr,
    args: [wavax.address],
  });

  await deploy("MockNonRebasing", {
    from: deployerAddr,
  });

  await deploy("MockNonRebasingTwo", {
    from: deployerAddr,
    contract: "MockNonRebasing",
  });

  console.log("000_mock deploy done.");

  return true;
};

deployMocks.id = "000_mock";
deployMocks.tags = ["mocks"];
// cannot run bc no funds
deployMocks.skip = () => !isTest && !isLocalhost;

module.exports = deployMocks;
