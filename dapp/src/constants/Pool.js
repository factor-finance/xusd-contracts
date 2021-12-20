/*
 * Holds Liquidity Mining pool information with properties:
 * - name: pool name as displayed in the dapp
 * - coin_info: coins specific info of the both coins
 *   - name: coin name
 *   - icon: coin icon that needs to be present in images
 *   - contract_address: coin contract address
 *   - allowance:[local dev only] allowance of lp_contract to move coin on user's behalf
 * - type: pool type can be one of:
 *   - main -> main type displayed on the top of pool list
 *   - featured -> featured type displayed below the main pools
 *   - past -> past pool displayed on the bottom of the pool list. No longer gives out OGN
 * - lp_contract_type: type of the contract that is generating the LP tokens
 * - pool_deposits: total deposits of LP tokens into the pool
 * - pool_rate: the weekly rate of OGN tokens handed out
 * - current_apy: TODO
 * - rewards_boost: the boost label that shows on pool listing and pool detail. Hide it by setting value to null
 * - reward_per_block: how much reward per block pool gives out
 * - your_weekly_rate: the amount of OGN user is earning a week with currently staked LP tokens
 * - claimable_ogn: the amount of OGN for the user to claim
 * - staked_lp_tokens: amount of LP tokens user has staked in the contract
 * - lp_tokens: user's balance of the LP tokens
 * - lp_token_allowance: allowanc of pool contract to move the lp_tokens on user's behalf
 * - pool_contract_variable_name: variable name of the contract pool initialized in the contracts.js
 * - lp_contract_variable_name: variable name of the lp contract initialized in the contracts.js
 * - contract: pool contract instance
 * - lpContract: liquidity token contract instance
 */
export const pools = [
  {
    name: 'XUSD/USDT',
    coin_one: {
      name: 'XUSD',
      contract_variable_name: 'xusd',
      icon: 'xusd-token-icon.svg',
      pool_details_icon: 'xusd-token-icon.svg',
      // contract_address
      // allowance
    },
    coin_two: {
      name: 'USDT',
      contract_variable_name: 'usdt',
      icon: 'usdt-icon-full.svg',
      pool_details_icon: 'usdt-icon-white.svg',
      // contract_address
      // allowance
    },
    type: 'main',
    style: 'green',
    lp_contract_type: 'uniswap-v2',
    // pool_deposits
    pool_rate: '500000',
    // current_apy
    // pool_contract_address
    // your_weekly_rate
    // claimable_ogn
    rewards_boost: null,
    // reward_per_block
    // staked_lp_tokens
    // lp_tokens
    // lp_token_allowance
    // contract
    // lpContract
    lp_contract_variable_name: 'uniV2XusdUsdt',
    lp_contract_variable_name_ierc20: 'uniV2XusdUsdt_iErc20',
    lp_contract_variable_name_uniswapPair: 'uniV2XusdUsdt_iUniPair',
    pool_contract_variable_name: 'liquidityXusdUsdt',
  },
  {
    name: 'XUSD/DAI',
    coin_one: {
      name: 'XUSD',
      contract_variable_name: 'xusd',
      icon: 'xusd-token-icon.svg',
      pool_details_icon: 'xusd-token-icon.svg',
      // contract_address
      // allowance
    },
    coin_two: {
      name: 'DAI',
      contract_variable_name: 'dai',
      icon: 'dai-icon-full.svg',
      pool_details_icon: 'dai-icon-white.svg',
      // contract_address
      // allowance
    },
    type: 'main',
    style: 'orange',
    lp_contract_type: 'uniswap-v2',
    // pool_deposits
    pool_rate: '500000',
    // current_apy
    // pool_contract_address
    // your_weekly_rate
    // claimable_ogn
    rewards_boost: null,
    // reward_per_block
    // staked_lp_tokens
    // lp_tokens
    // lp_token_allowance
    // contract
    // lpContract
    lp_contract_variable_name: 'uniV2XusdDai',
    lp_contract_variable_name_ierc20: 'uniV2XusdDai_iErc20',
    lp_contract_variable_name_uniswapPair: 'uniV2XusdDai_iUniPair',
    pool_contract_variable_name: 'liquidityXusdDai',
  },
  {
    name: 'XUSD/USDC',
    coin_one: {
      name: 'XUSD',
      contract_variable_name: 'xusd',
      icon: 'xusd-token-icon.svg',
      pool_details_icon: 'xusd-token-icon.svg',
      // contract_address
      // allowance
    },
    coin_two: {
      name: 'USDC',
      contract_variable_name: 'usdc',
      icon: 'usdc-icon-full.svg',
      pool_details_icon: 'usdc-icon-white.svg',
      // contract_address
      // allowance
    },
    type: 'main',
    style: 'blue',
    lp_contract_type: 'uniswap-v2',
    // pool_deposits
    pool_rate: '500000',
    // current_apy
    // pool_contract_address
    // your_weekly_rate
    // claimable_ogn
    rewards_boost: null,
    // reward_per_block
    // staked_lp_tokens
    // lp_tokens
    // lp_token_allowance
    // contract
    // lpContract
    lp_contract_variable_name: 'uniV2XusdUsdc',
    lp_contract_variable_name_ierc20: 'uniV2XusdUsdc_iErc20',
    lp_contract_variable_name_uniswapPair: 'uniV2XusdUsdc_iUniPair',
    pool_contract_variable_name: 'liquidityXusdUsdc',
  },
]
