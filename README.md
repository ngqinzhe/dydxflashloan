
### compilation of solidity contract
```
solcjs --bin --abi --include-path node_modules/ --base-path . ./contracts/DyDxSoloMargin.sol -o ./build --optimize
```


### starting up ganache
```
source .env
ganache-cli --fork https://mainnet.infura.io/v3/$INFURA_KEY --networkId 999
```