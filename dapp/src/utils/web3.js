const networkInfo = {
  43114: 'Mainnet',
  43113: 'Fuji',
  43112: 'Localhost',
}

export function isCorrectNetwork(chainId) {
  if (process.env.NODE_ENV === 'production') {
    return chainId === 43114
  } else {
    return chainId === 43113
  }
}

export async function switchEthereumChain() {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x1' }],
  })
}

export function getEtherscanHost(web3React) {
  const chainIdToEtherscan = {
    43114: 'https://snowtrace.io',
    43113: 'https://testnet.snowtrace.io',
  }

  if (chainIdToEtherscan[web3React.chainId]) {
    return chainIdToEtherscan[web3React.chainId]
  } else {
    // by default just return mainNet url
    return chainIdToEtherscan[1]
  }
}

export function shortenAddress(address) {
  if (!address || address.length < 10) {
    return address
  }

  return `${address.substring(0, 5)}...${address.substring(address.length - 5)}`
}

export function networkIdToName(chainId) {
  return networkInfo[chainId]
}

export function truncateAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function trackXUSDInMetaMask(xusdAddress) {
  web3.currentProvider.sendAsync(
    {
      method: 'metamask_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: xusdAddress,
          symbol: 'XUSD',
          decimals: 18,
          image: 'https://xusd.fi/images/xusd-token-icon.svg',
        },
      },
    },
    console.log
  )
}

/* status of token wallets and XUSD:
 * https://docs.google.com/spreadsheets/d/1bunkxBxfkAVz9C14vAFH8CZ53rImDNHTXp94AOEjpq0/edit#gid=1608902436
 */
export function providersNotAutoDetectingXUSD() {
  return ['metamask', 'trust', 'alphawallet', 'mist', 'parity']
}

export function providerName() {
  if (!process.browser) {
    return null
  }

  const { ethereum = {}, web3 = {} } = window

  if (ethereum.isMetaMask) {
    return 'metamask'
  } else if (ethereum.isImToken) {
    return 'imtoken'
  } else if (typeof window.__CIPHER__ !== 'undefined') {
    return 'cipher'
  } else if (!web3.currentProvider) {
    return null
  } else if (web3.currentProvider.isToshi) {
    return 'coinbase'
  } else if (web3.currentProvider.isTrust) {
    return 'trust'
  } else if (web3.currentProvider.isGoWallet) {
    return 'gowallet'
  } else if (web3.currentProvider.isAlphaWallet) {
    return 'alphawallet'
  } else if (web3.currentProvider.isStatus) {
    return 'status'
  } else if (web3.currentProvider.constructor.name === 'EthereumProvider') {
    return 'mist'
  } else if (web3.currentProvider.constructor.name === 'Web3FrameProvider') {
    return 'parity'
  } else if (
    web3.currentProvider.host &&
    web3.currentProvider.host.indexOf('infura') !== -1
  ) {
    return 'infura'
  } else if (
    web3.currentProvider.host &&
    web3.currentProvider.host.indexOf('localhost') !== -1
  ) {
    return 'localhost'
  }

  return 'unknown'
}
