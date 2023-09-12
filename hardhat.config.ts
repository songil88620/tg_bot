// require("@nomiclabs/hardhat-waffle");
 
 
 

const privateKey = '8aea8c16838363f62f44717536e7e4fb2c353eb7cd75f0dbd42f6b0802c29f2b'
  
 
module.exports = {
  defaultNetwork: "testnet",
  networks: { 
    hardhat: {}, 
    testnet: {
      url: "https://rpc.sepolia.org/",
      chainId: 11155111,
      gasPrice: 20000000000,
      accounts: [privateKey],
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [privateKey],
    },
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  allowUnlimitedContractSize: true,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
  etherscan: {
    apiKey: "EIAAN4XVMZYMPFXZMYAV291AQP2UUMI6AZ",
  }   
};
