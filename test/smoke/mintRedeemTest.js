const { fund, mint } = require("../../tasks/account");
const {
  usdcUnits,
  xusdUnits,
  xusdUnitsFormat,
  isWithinTolerance,
} = require("../helpers");
const addresses = require("../../utils/addresses");
const erc20Abi = require("../abi/erc20.json");

let utils, BigNumber, usdt, dai, usdc, usdcNative, xusd, vault, signer, signer2;

async function fundAccount4(hre) {
  await fund(
    {
      num: 1,
      amount: "3000",
    },
    hre
  );
}

const getUsdtBalance = async () => {
  return await usdt.connect(signer).balanceOf(signer.address);
};

const getDaiBalance = async () => {
  return await dai.connect(signer).balanceOf(signer.address);
};

const getUsdcBalance = async () => {
  return await usdc.connect(signer).balanceOf(signer.address);
};

const getUsdcNativeBalance = async () => {
  return await usdcNative.connect(signer).balanceOf(signer.address);
};

const getXusdBalance = async (signer) => {
  return await xusd.connect(signer).balanceOf(signer.address);
};

const assertExpectedXusd = (bigNumber, bigNumberExpected, tolerance = 0.03) => {
  if (!isWithinTolerance(bigNumber, bigNumberExpected, 0.03)) {
    throw new Error(
      `Unexpected XUSD value. Expected ${xusdUnitsFormat(
        bigNumberExpected
      )} with the tolerance of ${tolerance}. Received: ${xusdUnitsFormat(
        bigNumber
      )}`
    );
  }
};

const assertExpectedStablecoins = (
  usdtBn,
  daiBn,
  usdcBn,
  usdcNativeBn,
  unitsExpected,
  tolerance = 0.03
) => {
  // adjust decimals of all stablecoins to 18 so they are easier to compare
  const adjustedUsdt = usdtBn.mul(BigNumber.from("1000000000000"));
  const adjustedUsdc = usdcBn.mul(BigNumber.from("1000000000000"));
  const adjustedUsdcNative = usdcNativeBn.mul(BigNumber.from("1000000000000"));
  const allStablecoins = adjustedUsdt
    .add(adjustedUsdc)
    .add(daiBn)
    .add(adjustedUsdcNative);
  const stableCoinsExpected = utils.parseUnits(unitsExpected, 18);

  if (!isWithinTolerance(allStablecoins, stableCoinsExpected, 0.03)) {
    throw new Error(
      `Unexpected value. Expected to receive total stablecoin units ${xusdUnitsFormat(
        stableCoinsExpected
      )} with the tolerance of ${tolerance}. Received: ${xusdUnitsFormat(
        allStablecoins
      )}`
    );
  }
};

async function setup(hre) {
  utils = hre.ethers.utils;
  BigNumber = hre.ethers.BigNumber;
  const xusdProxy = await hre.ethers.getContract("XUSDProxy");
  xusd = await hre.ethers.getContractAt("XUSD", xusdProxy.address);
  usdt = await hre.ethers.getContractAt(erc20Abi, addresses.mainnet.USDT);
  dai = await hre.ethers.getContractAt(erc20Abi, addresses.mainnet.DAI);
  usdc = await hre.ethers.getContractAt(erc20Abi, addresses.mainnet.USDC);
  usdcNative = await hre.ethers.getContractAt(
    erc20Abi,
    addresses.mainnet.USDC_native
  );
  const vaultProxy = await hre.ethers.getContract("VaultProxy");
  vault = await ethers.getContractAt("IVault", vaultProxy.address);
  signer = (await hre.ethers.getSigners())[4];
  signer2 = (await hre.ethers.getSigners())[5];
  await fundAccount4(hre);
}

async function beforeDeploy(hre) {
  // fund stablecoins to the 4th account in signers
  await setup(hre);

  const usdcBeforeMint = await getUsdcBalance();
  const xusdBeforeMint = await getXusdBalance(signer);
  const usdcToMint = "1100";
  await mint(
    {
      num: 1,
      amount: usdcToMint,
    },
    hre
  );

  const usdcAfterMint = await getUsdcBalance();
  const xusdAfterMint = await getXusdBalance(signer);

  const expectedUsdc = usdcBeforeMint.sub(usdcUnits(usdcToMint));
  if (!usdcAfterMint.eq(expectedUsdc)) {
    throw new Error(
      `Incorrect usdc value. Got ${usdcAfterMint.toString()} expected: ${expectedUsdc.toString()}`
    );
  }

  const expectedXusd = xusdBeforeMint.add(xusdUnits(usdcToMint));
  assertExpectedXusd(xusdAfterMint, expectedXusd);

  return {
    xusdBeforeMint,
    xusdAfterMint,
  };
}

const testMint = async (hre, beforeDeployData) => {
  const xusdBeforeMint = await getXusdBalance(signer);
  await mint(
    {
      num: 1,
      amount: "500",
    },
    hre
  );

  const xusdAfterMint = await getXusdBalance(signer);

  if (!beforeDeployData.xusdAfterMint.eq(xusdBeforeMint)) {
    throw new Error(
      `Deploy changed the amount of xusd in user's account from ${xusdUnitsFormat(
        beforeDeployData.xusdAfterMint
      )} to ${xusdUnitsFormat(xusdBeforeMint)}`
    );
  }

  return xusdAfterMint;
};

const testRedeem = async (xusdAfterMint) => {
  const usdtBeforeRedeem = await getUsdtBalance();
  const daiBeforeRedeem = await getDaiBalance();
  const usdcBeforeRedeem = await getUsdcBalance();
  const usdcNativeBeforeRedeem = await getUsdcNativeBalance();

  const unitsToRedeem = "800";
  const xusdToRedeem = xusdUnits(unitsToRedeem);
  await vault.connect(signer).redeem(xusdToRedeem, xusdUnits("770"));

  const xusdAfterRedeem = await getXusdBalance(signer);
  const usdtAfterRedeem = await getUsdtBalance();
  const daiAfterRedeem = await getDaiBalance();
  const usdcAfterRedeem = await getUsdcBalance();
  const usdcNativeAfterRedeem = await getUsdcNativeBalance();

  const expectedXusd = xusdAfterMint.sub(xusdToRedeem);
  assertExpectedXusd(xusdAfterRedeem, expectedXusd, 0.0);

  assertExpectedStablecoins(
    usdtAfterRedeem.sub(usdtBeforeRedeem),
    daiAfterRedeem.sub(daiBeforeRedeem),
    usdcAfterRedeem.sub(usdcBeforeRedeem),
    usdcNativeAfterRedeem.sub(usdcNativeBeforeRedeem),
    "800"
  );
};

const testTransfer = async () => {
  const xusdSenderBeforeSend = await getXusdBalance(signer);
  const xusdReceiverBeforeSend = await getXusdBalance(signer2);
  const xusdToTransfer = "245.5";

  await xusd
    .connect(signer)
    .transfer(signer2.address, xusdUnits(xusdToTransfer));

  const xusdSenderAfterSend = await getXusdBalance(signer);
  const xusdReceiverAfterSend = await getXusdBalance(signer2);

  assertExpectedXusd(
    xusdSenderAfterSend,
    xusdSenderBeforeSend.sub(xusdUnits(xusdToTransfer)),
    0.0
  );
  assertExpectedXusd(
    xusdReceiverAfterSend,
    xusdReceiverBeforeSend.add(xusdUnits(xusdToTransfer)),
    0.0
  );
};

async function afterDeploy(hre, beforeDeployData) {
  const xusdAfterMint = await testMint(hre, beforeDeployData);
  await testRedeem(xusdAfterMint);
  await testTransfer();
}

module.exports = {
  beforeDeploy,
  afterDeploy,
};
