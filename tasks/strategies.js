const addresses = require("../utils/addresses");
const fetch = require("node-fetch");
const { parseUnits } = require("ethers").utils;

const PROOF_BASE_HOST = "https://us-central1-alpha-perp.cloudfunctions.net";
const PROOF_AVAX_URL = `${PROOF_BASE_HOST}/ahv2_avax_claim_info_avax`;
const PROOF_ALPHA_URL = `${PROOF_BASE_HOST}/ahv2_avax_claim_info_alpha`;

async function ahProofFetch(baseUrl, address) {
  const url = `${baseUrl}?address=${address}`;
  const r = await fetch(url);
  const json = await r.json();
  return json;
}

async function ahProofUpdate(taskArguments, hre) {
  const { isMainnet, isMainnetFork, isFork } = require("../test/helpers.js");

  if (!isMainnet && !isMainnetFork) {
    throw new Error("ahProofUpdate task requires mainnet or mainnet fork");
  }

  const { strategistAddr } = await getNamedAccounts();
  const sStrategist = hre.ethers.provider.getSigner(strategistAddr);

  const ahProxy = await hre.ethers.getContract("AlphaHomoraStrategyProxy");
  const ah = await hre.ethers.getContractAt(
    "AlphaHomoraStrategy",
    ahProxy.address
  );

  const currentAvaxProof = await ah.getProofAndAmount(addresses.mainnet.WAVAX);
  const currentAlphaProof = await ah.getProofAndAmount(
    addresses.mainnet.ALPHAe
  );

  const avaxProofJson = await ahProofFetch(PROOF_AVAX_URL, ahProxy.address);
  const alphaProofJson = await ahProofFetch(PROOF_ALPHA_URL, ahProxy.address);

  const avaxProof = [avaxProofJson.proof, parseUnits(avaxProofJson.amount, 18)];
  const alphaProof = [
    alphaProofJson.proof,
    parseUnits(alphaProofJson.amount, 18),
  ];

  if (isFork) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [strategistAddr],
    });
  }

  if (JSON.stringify(currentAvaxProof) != JSON.stringify(avaxProof)) {
    await ah
      .connect(sStrategist)
      .setProofAndAmount(addresses.mainnet.WAVAX, avaxProof[0], avaxProof[1]);
  } else {
    console.log("No update required for WAVAX");
  }

  if (JSON.stringify(currentAlphaProof) != JSON.stringify(alphaProof)) {
    await ah
      .connect(sStrategist)
      .setProofAndAmount(
        addresses.mainnet.ALPHAe,
        alphaProof[0],
        alphaProof[1]
      );
  } else {
    console.log("No update required for ALPHAe");
  }
}

module.exports = {
  ahProofUpdate,
};
