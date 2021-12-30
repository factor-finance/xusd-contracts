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
addresses.mainnet.DAIe = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70";
addresses.mainnet.USDCe = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664";
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
  "0x51D7180edA2260cc4F6e4EebB82FEF5c3c2B8300";
addresses.mainnet.chainlinkUSDC_USD =
  "0xf096872672f44d6eba71458d74fe67f9a77a23b9";
addresses.mainnet.chainlinkUSDT_USD =
  "0xebe676ee90fe1112671f19b6b7459bc678b67e8a";
addresses.mainnet.chainlinkTUSD_USD =
  "0xebe676ee90fe1112671f19b6b7459bc678b67e8a";

// WAVAX Token
addresses.mainnet.WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

// XUSD contracts and tools
addresses.mainnet.Deployer = "0x17BAd8cbCDeC350958dF0Bfe01E284dd8Fec3fcD";
// Mainnet contracts are governed by the Governor contract (which derives off Timelock).
addresses.mainnet.Governor = "0x20E0c5F61124D184101a0A8d9afaeA69F5dAB907";
addresses.mainnet.Guardian = "0x17BAd8cbCDeC350958dF0Bfe01E284dd8Fec3fcD"; // ERC 20 owner multisig.
addresses.mainnet.Strategist = addresses.mainnet.Guardian; // FIXME: separation!
addresses.mainnet.VaultProxy = "__VaultProxy";
addresses.mainnet.Vault = "__Vault";
addresses.mainnet.XUSDProxy = "__XUSDProxy";
addresses.mainnet.XUSD = "__XUSD";
addresses.mainnet.MixOracle = "__Mixoracle";

/* --- FUJI --- */
addresses.fuji = {};
// XUSD contracts and tools
addresses.fuji.Deployer = "0x3cECEAe65A70d7f5b7D579Ba25093A37A47706B3";
// Fuji contracts are governed by the Governor contract (which derives off Timelock).
addresses.fuji.Guardian = "0x3cECEAe65A70d7f5b7D579Ba25093A37A47706B3"; // ERC 20 owner multisig.
addresses.fuji.Governor = "0xE93407D0100dc7660cCD45BF65b0D35F7dFE3FAb";
addresses.fuji.Strategist = addresses.fuji.Guardian; // FIXME: separation!
addresses.fuji.VaultProxy = "0x45eFA8D5edE29adf67D86BB2B953a96081359B0F";
addresses.fuji.Vault = "0xF8fE0307104945D0d00D0d94893c2b889EAB67F3";
addresses.fuji.XUSDProxy = "0x66B0Ced1ae158871cd9aCCB2F55e355c1A636025";
addresses.fuji.XUSD = "0x45Fd456E2E5E2B59cceE0052745025F562928cEA";

addresses.fuji.chainlinkAVAX_USD = "0x5498bb86bc934c8d34fda08e81d444153d0d06ad";
addresses.fuji.chainlinkUSDT_USD = "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad";

addresses.fuji.WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
addresses.fuji.USDT = "0x02823f9B469960Bb3b1de0B3746D4b95B7E35543"; // mintable
addresses.fuji.DAI = "0x51BC2DfB9D12d9dB50C855A5330fBA0faF761D15";
addresses.fuji.USDC = "0x3a9fc2533eafd09bc5c36a7d6fdd0c664c81d659";
addresses.mainnet.avUSDT = "0x5f049c41aF3856cBc171F61FB04D58C1e7445f5F";
addresses.mainnet.avDAI = "0x5f049c41aF3856cBc171F61FB04D58C1e7445f5F"; // hack
addresses.mainnet.avUSDC = "0x5f049c41aF3856cBc171F61FB04D58C1e7445f5F"; // hack
addresses.fuji.AAVE_INCENTIVES_CONTROLLER =
  "0xa1EF206fb9a8D8186157FC817fCddcC47727ED55";
addresses.fuji.AAVE_ADDRESS_PROVIDER =
  "0x7fdC1FdF79BE3309bf82f4abdAD9f111A6590C0f";
addresses.fuji.AAVE_DATA_PROVIDER =
  "0x0668EDE013c1c475724523409b8B6bE633469585";

module.exports = addresses;
