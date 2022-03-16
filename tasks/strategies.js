const addresses = require("../utils/addresses");
const fetch = require("node-fetch");

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
  const { isMainnet, isMainnetFork } = require("../test/helpers.js");

  if (!isMainnet && !isMainnetFork) {
    throw new Error("ahProofUpdate task requires mainnet or mainnet fork");
  }

  const { strategistAddr } = await getNamedAccounts();
  const sStrategist = hre.ethers.provider.getSigner(strategistAddr);

  const ah = await hre.ethers.getContract("AlphaHomoraStrategy");

  const avaxProof = await ahProofFetch(PROOF_AVAX_URL, ah.address);
  await ah
    .connect(sStrategist)
    .setProofAndAmount(
      addresses.mainnet.WAVAX,
      avaxProof.proof,
      avaxProof.amount
    );

  const alphaProof = await ahProofFetch(PROOF_ALPHA_URL, ah.address);
  await ah
    .connect(sStrategist)
    .setProofAndAmount(
      addresses.mainnet.ALPHAe,
      alphaProof.proof,
      alphaProof.amount
    );
}

module.exports = {
  ahProofUpdate,
};
