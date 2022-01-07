const hre = require("hardhat");
const chai = require("chai");
const { parseUnits, formatUnits } = require("ethers").utils;
const BigNumber = require("ethers").BigNumber;
const { createFixtureLoader } = require("ethereum-waffle");

const addresses = require("../utils/addresses");

chai.Assertion.addMethod("approxEqual", function (expected, message) {
  const actual = this._obj;
  chai.expect(actual, message).gte(expected.mul("99999").div("100000"));
  chai.expect(actual, message).lte(expected.mul("100001").div("100000"));
});

chai.Assertion.addMethod(
  "approxBalanceOf",
  async function (expected, contract, message) {
    var user = this._obj;
    var address = user.address || user.getAddress(); // supports contracts too
    const actual = await contract.balanceOf(address);
    expected = parseUnits(expected, await decimalsFor(contract));
    chai.expect(actual).to.approxEqual(expected, message);
  }
);

chai.Assertion.addMethod(
  "balanceOf",
  async function (expected, contract, message) {
    var user = this._obj;
    var address = user.address || user.getAddress(); // supports contracts too
    const actual = await contract.balanceOf(address);
    expected = parseUnits(expected, await decimalsFor(contract));
    chai.expect(actual).to.equal(expected, message);
  }
);

const DECIMAL_CACHE = {};
async function decimalsFor(contract) {
  if (DECIMAL_CACHE[contract.address] != undefined) {
    return DECIMAL_CACHE[contract.address];
  }
  let decimals = await contract.decimals();
  if (decimals.toNumber) {
    decimals = decimals.toNumber();
  }
  DECIMAL_CACHE[contract.address] = decimals;
  return decimals;
}

async function units(amount, contract) {
  return parseUnits(amount, await decimalsFor(contract));
}

function xusdUnits(amount) {
  return parseUnits(amount, 18);
}

function xusdUnitsFormat(amount) {
  return formatUnits(amount, 18);
}

function usdtUnits(amount) {
  return parseUnits(amount, 6);
}

function usdtUnitsFormat(amount) {
  return formatUnits(amount, 6);
}

function usdcUnits(amount) {
  return parseUnits(amount, 6);
}

function usdcUnitsFormat(amount) {
  return formatUnits(amount, 6);
}

function tusdUnits(amount) {
  return parseUnits(amount, 18);
}

function daiUnits(amount) {
  return parseUnits(amount, 18);
}

function daiUnitsFormat(amount) {
  return formatUnits(amount, 18);
}

function avaxUnits(amount) {
  return parseUnits(amount, 18);
}

function oracleUnits(amount) {
  return parseUnits(amount, 6);
}

async function expectApproxSupply(contract, expected, message) {
  const balance = await contract.totalSupply();
  // shortcuts the 0 case, since that's neither gt or lt
  if (balance.eq(expected)) {
    return;
  }
  chai.expect(balance, message).gt(expected.mul("999").div("1000"));
  chai.expect(balance, message).lt(expected.mul("1001").div("1000"));
}

async function humanBalance(user, contract) {
  let address = user.address || user.getAddress(); // supports contracts too
  const balance = await contract.balanceOf(address);
  const decimals = await decimalsFor(contract);
  const divisor = BigNumber.from("10").pow(decimals);
  return parseFloat(balance.div(divisor).toString()).toFixed(2);
}

const isFork = process.env.FORK === "mainnet" || process.env.FORK === "fuji";
const isLocalhost = !isFork && hre.network.name === "localhost";

const isFuji = hre.network.name === "fuji-prod";
const isFujiFork =
  hre.network.name === "localhost" && process.env.FORK === "fuji";
const isMainnet = hre.network.name === "mainnet-prod";
const isMainnetFork =
  hre.network.name === "localhost" && process.env.FORK === "mainnet";

const isTest = process.env.IS_TEST === "true";
const isSmokeTest = process.env.SMOKE_TEST === "true";

const isMainnetOrFork = isMainnet || isFork;
const isMainnetOrFujiOrFork = isMainnetOrFork || isFuji;

// Fixture loader that is compatible with Ganache
const loadFixture = createFixtureLoader(
  [
    hre.ethers.provider.getSigner(0),
    hre.ethers.provider.getSigner(1),
    hre.ethers.provider.getSigner(2),
    hre.ethers.provider.getSigner(3),
    hre.ethers.provider.getSigner(4),
    hre.ethers.provider.getSigner(5),
    hre.ethers.provider.getSigner(6),
    hre.ethers.provider.getSigner(7),
    hre.ethers.provider.getSigner(8),
    hre.ethers.provider.getSigner(9),
  ],
  hre.ethers.provider
);

const advanceTime = async (seconds) => {
  await hre.ethers.provider.send("evm_increaseTime", [seconds]);
  await hre.ethers.provider.send("evm_mine");
};

const getBlockTimestamp = async () => {
  return (await hre.ethers.provider.getBlock("latest")).timestamp;
};

const advanceBlocks = async (numBlocks) => {
  for (let i = 0; i < numBlocks; i++) {
    await hre.ethers.provider.send("evm_mine");
  }
};

const getOracleAddress = async (deployments) => {
  return (await deployments.get("OracleRouter")).address;
};

/**
 * Sets the price in USD the mix oracle will return for a specific token.
 * This first sets the ETH price in USD, then token price in ETH
 *
 * @param {string} tokenSymbol: "DAI", USDC", etc...
 * @param {number} usdPrice: price of the token in USD.
 * @returns {Promise<void>}
 */
const setOracleTokenPriceUsd = async (tokenSymbol, usdPrice) => {
  if (isMainnet || isFuji) {
    throw new Error(
      `setOracleTokenPriceUsd not supported on network ${hre.network.name}`
    );
  }
  // Set the chainlink token price in USD, with 8 decimals.
  const tokenFeed = await ethers.getContract(
    "MockChainlinkOracleFeed" + tokenSymbol
  );
  await tokenFeed.setDecimals(8);
  await tokenFeed.setPrice(parseUnits(usdPrice, 8));
};

const getOracleAddresses = async (deployments) => {
  if (isMainnet || isMainnetFork) {
    // On mainnet or fork, return mainnet addresses.
    return {
      chainlink: {
        AVAX_USD: addresses.mainnet.chainlinkAVAX_USD,
        DAI_USD: addresses.mainnet.chainlinkDAI_USD,
        USDC_USD: addresses.mainnet.chainlinkUSDC_USD,
        USDT_USD: addresses.mainnet.chainlinkUSDT_USD,
      },
    };
  } else if (isFuji || isFujiFork) {
    return {
      AVAX_USD: addresses.fuji.chainlinkAVAX_USD,
      // for stablecoins, only USDT/USD is available, so it it for all: https://docs.chain.link/docs/avalanche-price-feeds/#Avalanche%20Testnet
      USDT_USD: addresses.fuji.chainlinkUSDT_USD,
      DAI_USD: addresses.fuji.chainlinkUSDT_USD,
      USDC_USD: addresses.fuji.chainlinkUSDT_USD,
    };
  } else {
    // On other environments, return mock feeds.
    return {
      chainlink: {
        AVAX_USD: (await deployments.get("MockChainlinkOracleFeedAVAX"))
          .address,
        WAVAX_USD: (await deployments.get("MockChainlinkOracleFeedWAVAX"))
          .address,
        DAI_USD: (await deployments.get("MockChainlinkOracleFeedDAI")).address,
        USDC_USD: (await deployments.get("MockChainlinkOracleFeedUSDC"))
          .address,
        USDT_USD: (await deployments.get("MockChainlinkOracleFeedUSDT"))
          .address,
        TUSD_USD: (await deployments.get("MockChainlinkOracleFeedTUSD"))
          .address,
        NonStandardToken_USD: (
          await deployments.get("MockChainlinkOracleFeedNonStandardToken")
        ).address,
      },
    };
  }
};

const getAssetAddresses = async (deployments) => {
  if (isMainnet || isMainnetFork) {
    console.log("Using mainnet addresses.");
    return {
      USDT: addresses.mainnet.USDT,
      USDC: addresses.mainnet.USDC,
      DAI: addresses.mainnet.DAI,
      TUSD: addresses.mainnet.TUSD,
      WAVAX: addresses.mainnet.WAVAX,
      avDAI: addresses.mainnet.avDAI,
      avUSDC: addresses.mainnet.avUSDC,
      avUSDT: addresses.mainnet.avUSDT,
      AAVE: addresses.mainnet.Aave,
      AAVE_ADDRESS_PROVIDER: addresses.mainnet.AAVE_ADDRESS_PROVIDER,
      AAVE_INCENTIVES_CONTROLLER: addresses.mainnet.AAVE_INCENTIVES_CONTROLLER,
    };
  } else if (isFuji || isFujiFork) {
    console.log("Using fuji addresses.");
    return {
      USDT: addresses.fuji.USDT,
      DAI: addresses.fuji.DAI,
      USDC: addresses.fuji.USDC,
      WAVAX: addresses.fuji.WAVAX,
      avDAI: addresses.fuji.avDAI,
      avUSDC: addresses.fuji.avUSDC,
      avUSDT: addresses.fuji.avUSDT,
      AAVE: addresses.fuji.Aave,
      AAVE_ADDRESS_PROVIDER: addresses.fuji.AAVE_ADDRESS_PROVIDER,
      AAVE_INCENTIVES_CONTROLLER: addresses.fuji.AAVE_INCENTIVES_CONTROLLER,
    };
  } else {
    console.log("Using mock addresses.");
    return {
      USDT: (await deployments.get("MockUSDT")).address,
      USDC: (await deployments.get("MockUSDC")).address,
      DAI: (await deployments.get("MockDAI")).address,
      TUSD: (await deployments.get("MockTUSD")).address,
      NonStandardToken: (await deployments.get("MockNonStandardToken")).address,
      WAVAX: (await deployments.get("MockWAVAX")).address,
      avDAI: (await deployments.get("MockADAI")).address,
      avUSDC: (await deployments.get("MockAUSDC")).address,
      avUSDT: (await deployments.get("MockAUSDT")).address,
      AAVE: (await deployments.get("MockAave")).address,
      AAVE_ADDRESS_PROVIDER: (await deployments.get("MockAave")).address,
      AAVE_INCENTIVES_CONTROLLER: (
        await deployments.get("MockAaveIncentivesController")
      ).address,
    };
  }
};

/**
 * Is first parameter's BigNumber value inside expected tolerance
 * @param {BigNumber} bigNumber: The BigNumber whose value is being inspected
 * @param {BigNumber} bigNumberExpected: Expected value of the first BigNumber
 * @param {Float} tolerance: Tolerance expressed in percentages. E.g. 0.05 equals 5%
 *
 * @returns {boolean}
 */
function isWithinTolerance(bigNumber, bigNumberExpected, tolerance) {
  const bgTolerance = bigNumberExpected
    .mul(tolerance * 1000)
    .div(BigNumber.from(1000));
  const lowestAllowed = bigNumberExpected.sub(bgTolerance);
  const highestAllowed = bigNumberExpected.add(bgTolerance);

  return bigNumber.gte(lowestAllowed) && bigNumber.lte(highestAllowed);
}

async function governorArgs({ contract, signature, args = [] }) {
  const method = signature.split("(")[0];
  const tx = await contract.populateTransaction[method](...args);
  const data = "0x" + tx.data.slice(10);
  return [tx.to, signature, data];
}

async function proposeArgs(governorArgsArray) {
  const targets = [],
    sigs = [],
    datas = [];
  for (const g of governorArgsArray) {
    const [t, s, d] = await governorArgs(g);
    targets.push(t);
    sigs.push(s);
    datas.push(d);
  }
  return [targets, sigs, datas];
}

async function propose(fixture, governorArgsArray, description) {
  const { governorContract, governor } = fixture;
  const lastProposalId = await governorContract.proposalCount();
  await governorContract
    .connect(governor)
    .propose(...(await proposeArgs(governorArgsArray)), description);
  const proposalId = await governorContract.proposalCount();
  chai.expect(proposalId).not.to.be.equal(lastProposalId);
  return proposalId;
}

async function proposeAndExecute(fixture, governorArgsArray, description) {
  const { governorContract, governor } = fixture;
  const proposalId = await propose(fixture, governorArgsArray, description);
  await governorContract.connect(governor).queue(proposalId);
  // go forward 3 days
  await advanceTime(3 * 24 * 60 * 60);
  await governorContract.connect(governor).execute(proposalId);
}

module.exports = {
  xusdUnits,
  usdtUnits,
  usdcUnits,
  tusdUnits,
  daiUnits,
  avaxUnits,
  oracleUnits,
  units,
  daiUnitsFormat,
  xusdUnitsFormat,
  usdcUnitsFormat,
  usdtUnitsFormat,
  humanBalance,
  expectApproxSupply,
  advanceTime,
  getBlockTimestamp,
  isMainnet,
  isFuji,
  isFujiFork,
  isFork,
  isTest,
  isSmokeTest,
  isLocalhost,
  isMainnetOrFork,
  isMainnetFork,
  isMainnetOrFujiOrFork,
  loadFixture,
  getOracleAddress,
  setOracleTokenPriceUsd,
  getOracleAddresses,
  getAssetAddresses,
  governorArgs,
  proposeArgs,
  propose,
  proposeAndExecute,
  advanceBlocks,
  isWithinTolerance,
};
