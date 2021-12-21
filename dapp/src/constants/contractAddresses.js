/* IMPORTANT these are duplicated from `dapp/src/constants/contractAddresses` changes there should
 * also be done here.
 */

const addresses = {}

// Utility addresses
addresses.zero = '0x0000000000000000000000000000000000000000'
addresses.dead = '0x0000000000000000000000000000000000000001'

addresses.mainnet = {}
addresses.mainnet.Binance = '0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9'
/* All the Binance addresses. There is not 1 address that has enough of all of the stablecoins and ether.
 * But all together do. In case new ones are added update them from here:
 * https://snowtrace.io/accounts/label/binance?subcatid=3-0&size=100&start=0&col=2&order=desc
 */
addresses.mainnet.BinanceAll =
  '0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9,0x0455ea966197a69eccf5fc354b6a7896e0fe38f0,0x2d6b7235db3659c1751f342f6c80a49727bb1a1d'

// E-wrapped stablecoins
addresses.mainnet.DAIe = '0xd586e7f844cea2f87f50152665bcbc2c279d8d70'
addresses.mainnet.USDCe = '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
addresses.mainnet.USDTe = '0xc7198437980c041c805a1edcba50c1ce5db95118'

// Native stablecoins
addresses.mainnet.TUSD = '0x1c20e891bab6b1727d14da358fae2984ed9b59eb'
addresses.mainnet.DAI = addresses.mainnet.DAIe
// these are very thin
addresses.mainnet.USDC = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
addresses.mainnet.USDT = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'
addresses.mainnet.USDC = addresses.mainnet.USDCe
addresses.mainnet.USDT = addresses.mainnet.USDTe

// AAVE
addresses.mainnet.Aave = '0x63a72806098bd3d9520cc43356dd78afe5d386d9'
addresses.mainnet.aUSDC = '0x46A51127C3ce23fb7AB1DE06226147F446e4a857'
addresses.mainnet.aUSDT = '0x532E6537FEA298397212F09A61e03311686f548e'
addresses.mainnet.aDAI = '0x47AFa96Cdc9fAb46904A55a6ad4bf6660B53c38a'
// Compound
addresses.mainnet.COMP = ''
addresses.mainnet.cDAI = ''
addresses.mainnet.cUSDC = ''
addresses.mainnet.cUSDT = ''

// Open Oracle
addresses.mainnet.openOracle = ''

// SushiSwap
addresses.mainnet.sushiSwapRouter = ''

// Uniswap v2
addresses.mainnet.uniswapV2Router = ''
addresses.mainnet.uniswapDAI_ETH = ''
addresses.mainnet.uniswapUSDC_ETH = ''
addresses.mainnet.uniswapUSDT_ETH = ''

// Uniswap V3
addresses.mainnet.uniswapV3Router = ''
addresses.mainnet.uniswapV3Quoter = ''
addresses.mainnet.uniswapV3XUSD_USDT = ''
addresses.mainnet.uniswapV3DAI_USDT = ''
addresses.mainnet.uniswapV3USDC_USDT = ''

addresses.mainnet.Flipper = ''

// Chainlink feeds
addresses.mainnet.chainlinkETH_USD = ''
addresses.mainnet.chainlinkDAI_ETH = ''
addresses.mainnet.chainlinkUSDC_ETH = ''
addresses.mainnet.chainlinkUSDT_ETH = ''
addresses.mainnet.chainlinkFAST_GAS = ''

// WETH Token
addresses.mainnet.WETH = ''

// Deployed XUSD contracts
addresses.mainnet.VaultProxy = ''
addresses.mainnet.Vault = ''
addresses.mainnet.XUSDProxy = ''
addresses.mainnet.CompoundStrategyProxy = ''
addresses.mainnet.CompoundStrategy = ''
addresses.mainnet.CurveUSDCStrategyProxy = ''
addresses.mainnet.CurveUSDCStrategy = ''
addresses.mainnet.CurveUSDTStrategyProxy = ''
addresses.mainnet.CurveUSDTStrategy = ''
addresses.mainnet.CurveAddressProvider = ''
addresses.mainnet.CurveXUSDMetaPool = ''
addresses.mainnet.CurveGaugeController = ''
addresses.mainnet.CurveXUSDFactoryGauge = ''

addresses.mainnet.MixOracle = ''
addresses.mainnet.ChainlinkOracle = ''
addresses.mainnet.UniswapOracle = ''
addresses.mainnet.CompensationClaims = ''

/* --- FUJI --- */
addresses.fuji = {}
// Compound
addresses.fuji.cDAI = ''
addresses.fuji.cUSDC = ''
addresses.fuji.cUSDT = ''

module.exports = addresses
