# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

Deploy with a local node:
```
$ npx hardhat node
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
...

$ npx hardhat run scripts/deploy.js --network localhost
KBMarket contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
NFT contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```