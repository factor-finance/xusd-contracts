// curl https://us-central1-alpha-perp.cloudfunctions.net/ahv2_avax_claim_info_avax?address=${AHV2_STRAT_ADDRESS} > avax_claim_info.json
// curl https://us-central1-alpha-perp.cloudfunctions.net/ahv2_avax_claim_info_alpha?address=${AHV2_STRAT_ADDRESS} > alpha_claim_info.json

async function ahProofUpdate(taskArguments, hre) {
  if (hre.network.name !== "localhost") {
    throw new Error("Only mint rando ERC20s on testnet!");
  }

  const { address, from, amount } = taskArguments;
  const sFrom = hre.ethers.provider.getSigner(from);

  const mintable = await hre.ethers.getContractAt("MintableERC20", address);
  const decimals = await mintable.decimals();

  await mintable.connect(sFrom).mint(parseUnits(amount.toString(), decimals));
  console.log(`Minted ${amount} x 10^${decimals} of ${address} to ${from}`);
}
