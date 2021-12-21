/* IMPORTANT these are duplicated in `dapp/src/constants/contractAddresses` changes here should
 * also be done there.
 */

const addresses = {};

// Utility addresses
addresses.zero = "0x0000000000000000000000000000000000000000";
addresses.dead = "0x0000000000000000000000000000000000000001";

addresses.mainnet = {};

addresses.mainnet.Binance = "0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9";
/* All the Binance addresses. There is not 1 address that has enough of all of the stablecoins and ether.
 * But all together do. In case new ones are added update them from here:
 * https://snowtrace.io/accounts/label/binance?subcatid=3-0&size=100&start=0&col=2&order=desc
 */
addresses.mainnet.BinanceAll =
  "0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9,0x0455ea966197a69eccf5fc354b6a7896e0fe38f0,0x2d6b7235db3659c1751f342f6c80a49727bb1a1d";

// Native stablecoins
addresses.mainnet.DAIe = "0xd586e7f844cea2f87f50152665bcbc2c279d8d70";
addresses.mainnet.USDCe = "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664";
addresses.mainnet.USDTe = "0xc7198437980c041c805a1edcba50c1ce5db95118";

// Native stablecoins
addresses.mainnet.TUSD = "0x1c20e891bab6b1727d14da358fae2984ed9b59eb";
addresses.mainnet.DAI = addresses.mainnet.DAIe;
// these are very thin, so...
addresses.mainnet.USDC = "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e";
addresses.mainnet.USDT = "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7";
// REDEFINE
addresses.mainnet.USDC = addresses.mainnet.USDCe;
addresses.mainnet.USDT = addresses.mainnet.USDTe;

// AAVE
addresses.mainnet.AAVE_ADDRESS_PROVIDER =
  "0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f"; // v2
// technially wrapped ether version
addresses.mainnet.Aave = "0x63a72806098bd3d9520cc43356dd78afe5d386d9"; // v1-v2
addresses.mainnet.aTUSD = "--"; // Todo: use v2
addresses.mainnet.aUSDT = "--"; // Todo: use v2
addresses.mainnet.aDAI = ""; // v2
addresses.mainnet.aUSDC = "--"; // Todo: use v2
addresses.mainnet.STKAAVE = ""; // v1-v2
addresses.mainnet.AAVE_INCENTIVES_CONTROLLER =
  "0x01D83Fe6A10D2f2B7AF17034343746188272cAc9"; // v2

// Compound
addresses.mainnet.COMP = "";
addresses.mainnet.cDAI = "";
addresses.mainnet.cUSDC = "";
addresses.mainnet.cUSDT = "";
// Curve
addresses.mainnet.CRV = "";
addresses.mainnet.CRVMinter = "";
addresses.mainnet.ThreePool = "";
addresses.mainnet.ThreePoolToken = "";
addresses.mainnet.ThreePoolGauge = "";
// CVX
addresses.mainnet.CVX = "";
addresses.mainnet.CRVRewardsPool = "";
addresses.mainnet.CVXBooster = "";
// Open Oracle
addresses.mainnet.openOracle = "";
// OGN
addresses.mainnet.OGN = "";

// Uniswap router
addresses.mainnet.uniswapRouter = "";
addresses.mainnet.uniswapV3Router =
  "0xe592427a0aece92de3edee1f18e0157c05861564";
// Chainlink feeds
// Source https://docs.chain.link/docs/avalanche-price-feeds/
addresses.mainnet.chainlinkETH_USD =
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
addresses.mainnet.chainlinkDAI_USD =
  "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
addresses.mainnet.chainlinkUSDC_USD =
  "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
addresses.mainnet.chainlinkUSDT_USD =
  "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
addresses.mainnet.chainlinkCOMP_USD =
  "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5";
addresses.mainnet.chainlinkAAVE_USD =
  "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9";
addresses.mainnet.chainlinkCRV_USD =
  "0xcd627aa160a6fa45eb793d19ef54f5062f20f33f";
addresses.mainnet.chainlinkOGN_ETH =
  "0x2c881B6f3f6B5ff6C975813F87A4dad0b241C15b";
// DEPRECATED Chainlink
addresses.mainnet.chainlinkDAI_ETH =
  "0x773616E4d11A78F511299002da57A0a94577F1f4";
addresses.mainnet.chainlinkUSDC_ETH =
  "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";
addresses.mainnet.chainlinkUSDT_ETH =
  "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46";

// WETH Token
addresses.mainnet.WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
// Deployed XUSD contracts
addresses.mainnet.Guardian = "0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899"; // ERC 20 owner multisig.
addresses.mainnet.VaultProxy = "0x277e80f3E14E7fB3fc40A9d6184088e0241034bD";
addresses.mainnet.Vault = "0xf251Cb9129fdb7e9Ca5cad097dE3eA70caB9d8F9";
addresses.mainnet.XUSDProxy = "0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86";
addresses.mainnet.XUSD = "0xB72b3f5523851C2EB0cA14137803CA4ac7295f3F";
addresses.mainnet.CompoundStrategyProxy =
  "0x12115A32a19e4994C2BA4A5437C22CEf5ABb59C3";
addresses.mainnet.CompoundStrategy =
  "0xFaf23Bd848126521064184282e8AD344490BA6f0";
addresses.mainnet.CurveUSDCStrategyProxy =
  "0x67023c56548BA15aD3542E65493311F19aDFdd6d";
addresses.mainnet.CurveUSDCStrategy =
  "0x96E89b021E4D72b680BB0400fF504eB5f4A24327";
addresses.mainnet.CurveUSDTStrategyProxy =
  "0xe40e09cD6725E542001FcB900d9dfeA447B529C0";
addresses.mainnet.CurveUSDTStrategy =
  "0x75Bc09f72db1663Ed35925B89De2b5212b9b6Cb3";

addresses.mainnet.MixOracle = "0x4d4f5e7a1FE57F5cEB38BfcE8653EFFa5e584458";
addresses.mainnet.UniswapOracle = "0xc15169Bad17e676b3BaDb699DEe327423cE6178e";
addresses.mainnet.CompensationClaims =
  "0x9C94df9d594BA1eb94430C006c269C314B1A8281";
addresses.mainnet.Flipper = "0xcecaD69d7D4Ed6D52eFcFA028aF8732F27e08F70";

/* --- FUJI --- */
addresses.fuji = {};

addresses.fuji.OGN = "0xA115e16ef6e217f7a327a57031F75cE0487AaDb8";

// Compound
addresses.fuji.cDAI = "0x6d7f0754ffeb405d23c51ce938289d4835be3b14";
addresses.fuji.cUSDC = "0x5b281a6dda0b271e91ae35de655ad301c976edb1";
addresses.fuji.cUSDT = "0x2fb298bdbef468638ad6653ff8376575ea41e768";

module.exports = addresses;
