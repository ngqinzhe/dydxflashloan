### Flashloan contract demo
Flashloan from dydx > AAVE because flashloan fee for dydx is 2 wei while flashloan fee for AAVE is 0.09%. 

Not production ready code, use at own risk. 




### compilation of solidity contract
```
solcjs --bin --abi --include-path node_modules/ --base-path . ./contracts/DyDxSoloMargin.sol -o ./build --optimize
```


### starting up ganache for testing
```
source .env
ganache-cli --fork https://mainnet.infura.io/v3/$INFURA_KEY --networkId 999
```
