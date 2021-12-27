/* IMPORTANT these are duplicated in `dapp/src/constants/contractAddresses` changes here should
 * also be done there.
 */

const addresses = {};

// Utility addresses
addresses.zero = "0x0000000000000000000000000000000000000000";
addresses.dead = "0x0000000000000000000000000000000000000001";

addresses.mainnet = {};

addresses.mainnet.Binance = "0xf851cbb9940f8baebd1d0eaf259335c108e9e893";
/* All the whale  addresses. There is not 1 address that has enough of all of the stablecoins and ether.
 * But all together do. In case new ones are added update them from here:
 * https://snowtrace.io/accounts/label/binance?subcatid=3-0&size=100&start=0&col=2&order=desc
 */
addresses.mainnet.BinanceAll =
  "0xf851cbb9940f8baebd1d0eaf259335c108e9e893,0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9,0x0455ea966197a69eccf5fc354b6a7896e0fe38f0,0x2d6b7235db3659c1751f342f6c80a49727bb1a1d";

// Native stablecoins
addresses.mainnet.DAIe = "0xd586e7f844cea2f87f50152665bcbc2c279d8d70";
addresses.mainnet.USDCe = "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664";
addresses.mainnet.USDTe = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118";

// Native stablecoins
addresses.mainnet.TUSD = "0x1c20e891bab6b1727d14da358fae2984ed9b59eb";
addresses.mainnet.USDC_native = "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e";
addresses.mainnet.USDT_native = "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7";
// REDEFINE
addresses.mainnet.DAI = addresses.mainnet.DAIe;
addresses.mainnet.USDC = addresses.mainnet.USDCe;
addresses.mainnet.USDT = addresses.mainnet.USDTe;

// AAVE https://docs.aave.com/developers/deployed-contracts/avalanche-market
addresses.mainnet.AAVE_ADDRESS_PROVIDER =
  "0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f";
// technially wrapped ether version
addresses.mainnet.Aave = "0x63a72806098bd3d9520cc43356dd78afe5d386d9";
addresses.mainnet.avUSDT = "0x532E6537FEA298397212F09A61e03311686f548e";
addresses.mainnet.avDAI = "0x47AFa96Cdc9fAb46904A55a6ad4bf6660B53c38a"; // *: 6 decimals
addresses.mainnet.avUSDC = "0x46A51127C3ce23fb7AB1DE06226147F446e4a857"; // *: 6 decimals
addresses.mainnet.AAVE_INCENTIVES_CONTROLLER =
  "0x01D83Fe6A10D2f2B7AF17034343746188272cAc9";

// Chainlink feeds
// Source https://data.chain.link/avalanche/mainnet
addresses.mainnet.chainlinkAVAX_USD =
  "0x0a77230d17318075983913bc2145db16c7366156";
addresses.mainnet.chainlinkDAI_USD =
  "0x51d7180eda2260cc4f6e4eebb82fef5c3c2b8300";
addresses.mainnet.chainlinkUSDC_USD =
  "0xf096872672f44d6eba71458d74fe67f9a77a23b9";
addresses.mainnet.chainlinkUSDT_USD =
  "0xebe676ee90fe1112671f19b6b7459bc678b67e8a";

// WAVAX Token
addresses.mainnet.WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
// Deployed XUSD contracts
addresses.mainnet.Guardian = "0x17BAd8cbCDeC350958dF0Bfe01E284dd8Fec3fcD"; // ERC 20 owner multisig.
addresses.mainnet.VaultProxy = "__VaultProxy";
addresses.mainnet.Vault = "__Vault";
addresses.mainnet.XUSDProxy = "__XUSDProxy";
addresses.mainnet.XUSD = "__XUSD";

addresses.mainnet.MixOracle = "__Mixoracle";
addresses.mainnet.UniswapOracle = "__UniswapOracle";
addresses.mainnet.CompensationClaims = "__CompensationClaims";
addresses.mainnet.Flipper = "__Flipper";

/* --- FUJI --- */
addresses.fuji = {};

module.exports = addresses;
