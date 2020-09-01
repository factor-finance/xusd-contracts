module.exports = {
  compilers: {
    solc: {
      version: "0.5.11",
      parser: "solcjs",
    },
  },
  networks: {
    buidlerevm: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    ganache: {
      host: "127.0.0.1",
      port: 7546,
      network_id: "*",
    },
  },
};
