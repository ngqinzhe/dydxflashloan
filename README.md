# Flashloan Demo
Flashloan from dydx > AAVE because flashloan fee for dydx is 2 wei while flashloan fee for AAVE is 0.09%. 

Not production ready code, use at own risk. 

### Install npm packages
```
npm install
```


### Compiling solidity contracts
```
solcjs --bin --abi --include-path node_modules/ --base-path . ./contracts/DyDxSoloMargin.sol -o ./build --optimize
```

### Place account information in .env file
Set your infura_key, accountId and private key in the .env file. You can generate test accountId and private_key from running ganache locally. 


### Starting up ganache for testing on mainnet
```
source .env
ganache-cli --fork https://mainnet.infura.io/v3/$INFURA_KEY --networkId 999
```

### Testing contract 
Edit source code in testContractClass.js and use node to run code
```
node src/testContractClass.js
```
