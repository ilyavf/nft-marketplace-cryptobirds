require("@nomiclabs/hardhat-waffle")
const fs = require('fs')

const projectId = fs.readFileSync('./.project-id.txt', {
  encoding: 'utf8',
  flag: 'r'
})
const keyData = fs.readFileSync('./.p-key.txt', {
  encoding: 'utf8',
  flag: 'r'
})

module.exports = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337 // standard for local
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
      accounts: [keyData]
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
      accounts: [keyData]
    }
  }
}
