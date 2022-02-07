const { mintToken } = require("./contracts.js");
const { parseUnits } = require("ethers").utils;

// USDT has its own ABI because of non standard returns
const usdtAbi = require("../test/abi/usdt.json").abi;
const daiAbi = require("../test/abi/erc20.json");
const usdcAbi = require("../test/abi/erc20.json");
const tusdAbi = require("../test/abi/erc20.json");
const wavaxAbi = require("../test/abi/erc20.json");

// By default we use 10 test accounts.
const defaultNumAccounts = 10;

// The first 4 hardhat accounts are reserved for use as the deployer, governor, etc...
const defaultAccountIndex = 4;

// By default, fund each test account with 10k worth of each stable coin.
const defaultFundAmount = "10000";

// By default, mint 1k worth of XUSD for each test account.
const defaultMintAmount = "1000";

// By default, redeem 1k worth of XUSD for each test account.
const defaultRedeemAmount = 1000;

/**
 * Prints test accounts.
 */
async function accounts(taskArguments, hre, privateKeys) {
  const accounts = await hre.ethers.getSigners();
  const roles = ["Deployer", "Governor"];

  let i = 0;
  for (const account of accounts) {
    const role = roles.length > i ? `[${roles[i]}]` : "";
    const address = await account.getAddress();
    console.log(address, privateKeys[i], role);
    if (!address) {
      throw new Error(`No address defined for role ${role}`);
    }
    i++;
  }
}

/**
 * Funds test accounts on local or fork with DAI, USDT, USDC, and TUSD.
 */
async function fund(taskArguments, hre) {
  const addresses = require("../utils/addresses");
  const {
    usdtUnits,
    daiUnits,
    usdcUnits,
    usdcNativeUnits,
    isFork,
    isFujiFork,
    isLocalhost,
    isMainnetFork,
  } = require("../test/helpers");

  if (!isFork && !isLocalhost) {
    throw new Error("Task can only be used on local or fork");
  }

  let accountsToFund;
  let signersToFund;
  if (!process.env.ACCOUNTS_TO_FUND) {
    // No need to fund accounts if no accounts to fund
    return;
  }
  const signers = await hre.ethers.getSigners();
  if (taskArguments.accountsfromenv) {
    if (!isFork) {
      throw new Error("accountsfromenv param only works in fork mode");
    }
    accountsToFund = process.env.ACCOUNTS_TO_FUND.split(",");
  } else {
    const numAccounts = Number(taskArguments.num) || defaultNumAccounts;
    const accountIndex = Number(taskArguments.account) || defaultAccountIndex;

    signersToFund = signers.splice(accountIndex, numAccounts);
    accountsToFund = signersToFund.map((signer) => signer.address);
  }
  let usdt, dai, usdc, usdcNative, tusd, wavax;
  if (isMainnetFork) {
    usdt = await hre.ethers.getContractAt(usdtAbi, addresses.mainnet.USDT);
    dai = await hre.ethers.getContractAt(daiAbi, addresses.mainnet.DAI);
    usdc = await hre.ethers.getContractAt(usdcAbi, addresses.mainnet.USDC);
    usdcNative = await hre.ethers.getContractAt(
      usdcAbi,
      addresses.mainnet.USDC_native
    );
    tusd = await hre.ethers.getContractAt(tusdAbi, addresses.mainnet.TUSD);
    wavax = await hre.ethers.getContractAt(wavaxAbi, addresses.mainnet.WAVAX);
  } else if (isFujiFork) {
    // because we cannot transfer funds, just mind USDT and return
    const mintAmount = defaultMintAmount;
    usdt = await hre.ethers.getContractAt(usdtAbi, addresses.fuji.USDT);
    await Promise.all(
      accountsToFund.map(async (address) => {
        return mintToken(
          {
            address: usdt.address,
            from: address,
            amount: mintAmount,
          },
          hre
        );
      })
    );
    return;
  } else {
    usdt = await hre.ethers.getContract("MockUSDT");
    dai = await hre.ethers.getContract("MockDAI");
    usdc = await hre.ethers.getContract("MockUSDC");
    usdcNative = await hre.ethers.getContract("MockUSDCNative");
    tusd = await hre.ethers.getContract("MockTUSD");
    wavax = await hre.ethers.getContract("MockWAVAX");
  }
  const binanceAddresses = addresses.mainnet.BinanceAll.split(",");

  if (isMainnetFork) {
    await Promise.all(
      binanceAddresses.map(async (binanceAddress) => {
        return hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [binanceAddress],
        });
      })
    );
  }
  let binanceSigners;
  binanceSigners = await Promise.all(
    binanceAddresses.map((binanceAddress) => {
      return hre.ethers.provider.getSigner(binanceAddress);
    })
  );

  // if contract is null return the signer with the most eth
  const findBestSigner = async (contract) => {
    let balances = await Promise.all(
      binanceSigners.map(async (binanceSigner) => {
        if (!contract) {
          return await hre.ethers.provider.getBalance(binanceSigner._address);
        }

        return await contract
          .connect(binanceSigner)
          .balanceOf(binanceSigner._address);
      })
    );

    let largestBalance = balances[0];
    let largestBalanceIndex = 0;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i].gte(largestBalance)) {
        largestBalance = balances[i];
        largestBalanceIndex = i;
      }
    }
    return binanceSigners[largestBalanceIndex];
  };

  const fundAmount = taskArguments.amount || defaultFundAmount;

  console.log(`DAI: ${dai.address}`);
  console.log(`USDC.e: ${usdc.address}`);
  console.log(`USDC: ${usdcNative.address}`);
  console.log(`USDT: ${usdt.address}`);
  console.log(`TUSD: ${tusd.address}`);
  console.log(`WAVAX: ${wavax.address}`);

  const contractDataList = [
    {
      name: "avax",
      contract: null,
      unitsFn: ethers.utils.parseEther,
      forkSigner: isFork ? await findBestSigner(null) : null,
    },
    {
      name: "dai",
      contract: dai,
      unitsFn: daiUnits,
      forkSigner: isFork ? await findBestSigner(dai) : null,
    },
    {
      name: "usdc",
      contract: usdc,
      unitsFn: usdcUnits,
      forkSigner: isFork ? await findBestSigner(usdc) : null,
    },
    {
      name: "usdcNative",
      contract: usdcNative,
      unitsFn: usdcNativeUnits,
      forkSigner: isFork ? await findBestSigner(usdcNative) : null,
    },
    {
      name: "usdt",
      contract: usdt,
      unitsFn: usdtUnits,
      forkSigner: isFork ? await findBestSigner(usdt) : null,
    },
    {
      name: "wavax",
      contract: wavax,
      unitsFn: ethers.utils.parseEther,
      forkSigner: isFork ? await findBestSigner(wavax) : null,
    },
  ];
  for (let i = 0; i < accountsToFund.length; i++) {
    const currentAccount = accountsToFund[i];
    await Promise.all(
      contractDataList.map(async (contractData) => {
        const { contract, unitsFn, forkSigner, name } = contractData;
        const usedFundAmount = contract !== null ? fundAmount : "100";
        if (isFork) {
          // fund avax
          if (!contract) {
            await forkSigner.sendTransaction({
              to: currentAccount,
              from: forkSigner._address,
              value: hre.ethers.utils.parseEther(usedFundAmount),
            });
          } else {
            await contract
              .connect(forkSigner)
              .transfer(currentAccount, unitsFn(usedFundAmount));
          }
        } else {
          if (!contract) {
            const signerWithEth = (await hre.ethers.getSigners())[0];
            await signerWithEth.sendTransaction({
              to: currentAccount,
              value: unitsFn(usedFundAmount),
            });
          }
          await contract
            .connect(signersToFund[i])
            .mint(unitsFn(usedFundAmount));
        }
        console.log(
          `Funded ${currentAccount} with ${usedFundAmount} ${name.toUpperCase()}`
        );
      })
    );
  }
}

/**
 * Mints XUSD using USDT on local or fork.
 */
async function mint(taskArguments, hre) {
  const addresses = require("../utils/addresses");
  const {
    usdtUnits,
    isFork,
    isMainnet,
    isFuji,
    isMainnetFork,
    isFujiFork,
    isLocalhost,
  } = require("../test/helpers");

  if (!isFork && !isLocalhost && !isFuji) {
    throw new Error("Task can only be used on local, fork, or testnet");
  }

  const xusdProxy = await ethers.getContract("XUSDProxy");
  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);

  const vaultProxy = await ethers.getContract("VaultProxy");
  const vault = await ethers.getContractAt("IVault", vaultProxy.address);

  let coin;
  if (isMainnet || isMainnetFork) {
    coin = await hre.ethers.getContractAt(usdcAbi, addresses.mainnet.USDC);
  } else if (isFuji || isFujiFork) {
    coin = await hre.ethers.getContractAt(usdtAbi, addresses.fuji.USDT);
  } else {
    coin = await hre.ethers.getContract("MockUSDC");
  }

  const numAccounts = Number(taskArguments.num) || defaultNumAccounts;
  const accountIndex =
    Number(taskArguments.index) > -1
      ? Number(taskArguments.index)
      : defaultAccountIndex;
  const mintAmount = taskArguments.amount || defaultMintAmount;

  const signers = await hre.ethers.getSigners();
  for (let i = accountIndex; i < accountIndex + numAccounts; i++) {
    const signer = signers[i];
    const address = signer.address;
    console.log(
      `Minting ${mintAmount} XUSD for account ${i} at address ${address}`
    );

    // Ensure the account has sufficient USDT balance to cover the mint.
    const coinBalance = await coin.balanceOf(address);
    if (coinBalance.lt(parseUnits(mintAmount, await coin.decimals()))) {
      throw new Error(
        `Account balance insufficient to mint the requested amount`
      );
    }

    if (isFork) {
      // for some reason we need to call impersonateAccount even on default list of signers
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [signer.address],
      });
    }

    // Reset approval before requesting a fresh one, or non first approve calls will fail
    await coin
      .connect(signer)
      .approve(vault.address, "0x0", { gasLimit: 270000 });
    await coin
      .connect(signer)
      .approve(vault.address, usdtUnits(mintAmount), { gasLimit: 470000 });

    // Mint.
    await vault
      .connect(signer)
      .mint(coin.address, usdtUnits(mintAmount), 0, { gasLimit: 8000000 });

    // Show new account's balance.
    const xusdBalance = await xusd.balanceOf(address);
    console.log(
      "New XUSD balance=",
      hre.ethers.utils.formatUnits(xusdBalance, 18)
    );
  }
}

/**
 * Redeems XUSD on local or fork.
 */
async function redeem(taskArguments, hre) {
  const addresses = require("../utils/addresses");
  const {
    xusdUnits,
    xusdUnitsFormat,
    daiUnitsFormat,
    usdcUnitsFormat,
    usdtUnitsFormat,
    isFork,
    isLocalhost,
  } = require("../test/helpers");

  if (!isFork && !isLocalhost) {
    throw new Error("Task can only be used on local or fork");
  }

  const xusdProxy = await ethers.getContract("XUSDProxy");
  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);

  const vaultProxy = await ethers.getContract("VaultProxy");
  const vault = await ethers.getContractAt("IVault", vaultProxy.address);

  let dai, usdc, usdt;
  if (isFork) {
    dai = await hre.ethers.getContractAt(usdtAbi, addresses.mainnet.DAI);
    usdc = await hre.ethers.getContractAt(usdtAbi, addresses.mainnet.USDC);
    usdt = await hre.ethers.getContractAt(usdtAbi, addresses.mainnet.USDT);
  } else {
    dai = await hre.ethers.getContract("MockDAI");
    usdc = await hre.ethers.getContract("MockUSDC");
    usdt = await hre.ethers.getContract("MockUSDT");
  }

  const numAccounts = Number(taskArguments.num) || defaultNumAccounts;
  const accountIndex = Number(taskArguments.index) || defaultAccountIndex;
  const redeemAmount = taskArguments.amount || defaultRedeemAmount;

  const signers = await hre.ethers.getSigners();
  for (let i = accountIndex; i < accountIndex + numAccounts; i++) {
    const signer = signers[i];
    const address = signer.address;
    console.log(
      `Redeeming ${redeemAmount} XUSD for account ${i} at address ${address}`
    );

    // Show the current balances.
    let xusdBalance = await xusd.balanceOf(address);
    let daiBalance = await dai.balanceOf(address);
    let usdcBalance = await usdc.balanceOf(address);
    let usdtBalance = await usdt.balanceOf(address);
    console.log("XUSD balance=", xusdUnitsFormat(xusdBalance, 18));
    console.log("DAI balance=", daiUnitsFormat(daiBalance, 18));
    console.log("USDC balance=", usdcUnitsFormat(usdcBalance, 6));
    console.log("USDT balance=", usdtUnitsFormat(usdtBalance, 6));

    // Redeem.
    await vault
      .connect(signer)
      .redeem(xusdUnits(redeemAmount), 0, { gasLimit: 2000000 });

    // Show the new balances.
    xusdBalance = await xusd.balanceOf(address);
    daiBalance = await dai.balanceOf(address);
    usdcBalance = await usdc.balanceOf(address);
    usdtBalance = await usdt.balanceOf(address);
    console.log("New XUSD balance=", xusdUnitsFormat(xusdBalance, 18));
    console.log("New DAI balance=", daiUnitsFormat(daiBalance, 18));
    console.log("New USDC balance=", usdcUnitsFormat(usdcBalance, 18));
    console.log("New USDT balance=", usdtUnitsFormat(usdtBalance, 18));
  }
}

// Sends XUSD to a destination address.
async function transfer(taskArguments) {
  const {
    xusdUnits,
    xusdUnitsFormat,
    isFork,
    isLocalHost,
  } = require("../test/helpers");

  if (!isFork && !isLocalHost) {
    throw new Error("Task can only be used on local or fork");
  }

  const xusdProxy = await ethers.getContract("XUSDProxy");
  const xusd = await ethers.getContractAt("XUSD", xusdProxy.address);

  const index = Number(taskArguments.index);
  const amount = taskArguments.amount;
  const to = taskArguments.to;

  const signers = await hre.ethers.getSigners();
  const signer = signers[index];

  // Print balances prior to the transfer
  console.log("\nXUSD balances prior transfer");
  console.log(
    `${signer.address}: ${xusdUnitsFormat(
      await xusd.balanceOf(signer.address)
    )} XUSD`
  );
  console.log(`${to}: ${xusdUnitsFormat(await xusd.balanceOf(to))} XUSD`);

  // Send XUSD.
  console.log(
    `\nTransferring ${amount} XUSD from ${signer.address} to ${to}...`
  );
  await xusd.connect(signer).transfer(to, xusdUnits(amount));

  // Print balances after to the transfer
  console.log("\nXUSD balances after transfer");
  console.log(
    `${signer.address}: ${xusdUnitsFormat(
      await xusd.balanceOf(signer.address)
    )} XUSD`
  );
  console.log(`${to}: ${xusdUnitsFormat(await xusd.balanceOf(to))} XUSD`);
}

module.exports = {
  accounts,
  fund,
  mint,
  redeem,
  transfer,
};
