const env = require('dotenv').config()
const path = require('path')
var Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const fs = require('fs');
const network = process.env.KOVAN_TESTNET + process.env.INFURA_KEY;

// ACCOUNT CONFIGURATIONS
const account = process.env.ACCOUNT_ID;
const pkey = process.env.PRIVATE_KEY;
const pkeybuffer = Buffer.from(pkey, 'hex');
const kovanWETHAddress = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
const contractAddress = "0xF628E8548BF4319BEE7B70B17bdEC0fE4D85F052";

// WEB3 CONFIGURATIONS WITH CONTRACT
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const bytecode = fs.readFileSync(path.resolve(__dirname, '../build/contracts_DyDxSoloMargin_sol_DyDxSoloMargin.bin'));
const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/contracts_DyDxSoloMargin_sol_DyDxSoloMargin.abi')));
var contract = new web3.eth.Contract(abi, contractAddress);

const getWETHBalance = () => {
    contract.methods.getWETHBalance().call({from: account}, (err, result) => {
        if (err) console.log(err);
        else console.log("WETH Balance:", web3.utils.fromWei(result));
    })
}

const getETHBalance = () => {
    contract.methods.getETHBalance().call({from: account}, (err, result) => {
        if (err) console.log(err);
        else console.log("ETH Balance:", web3.utils.fromWei(result));
    })
}

const withdrawETH = async () => {
    const tx = contract.methods.withdrawETH(account);

    const options = {
        to : tx._parent._address,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({from: account}),
    };

    const signed = await web3.eth.accounts.signTransaction(options, pkey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
        .on('receipt', (result) => {
            console.log("Successfully withdrew all ETH. Tx Hash:", result.transactionHash);
        });
}

const withdrawWETH = async () => {
    const tx = contract.methods.withdrawToken(kovanWETHAddress);

    const options = {
        to : tx._parent._address,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({from: account}),
    };

    const signed = await web3.eth.accounts.signTransaction(options, pkey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
        .on('receipt', (result) => {
            console.log("Successfully withdrew remaining WETH. TxHash:", result.transactionHash);
        });
}

const fundContract = async (value) => {
    const amountToDeploywithContract = web3.utils.toWei(value, 'ether');

    await web3.eth.getTransactionCount(account, (err, txCount) => {

        const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(6721975),
            gasPrice: web3.utils.toHex(20000000000),
            from: account,
            to: contractAddress,
            value: web3.utils.toHex(amountToDeploywithContract)
        }
    
        const tx = new Tx(txObject, {chain: "kovan"});
        tx.sign(pkeybuffer);
    
        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex')
    
        web3.eth.sendSignedTransaction(raw, (err, txHash) => {
            if (err) {
                console.error(err);
            } else {
                console.log("Contract successfully funded with:", web3.utils.fromWei(amountToDeploywithContract));
                console.log("Transaction Hash:", txHash);
            }
        })
    })
}

const convertWETH = async (value) => {
    const amount = web3.utils.toWei(value, 'ether');
    const tx = contract.methods.getWETH(amount);

    const options = {
        to : tx._parent._address,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({from: account}),
    };

    const signed = await web3.eth.accounts.signTransaction(options, pkey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
        .on('receipt', (result) => {
            console.log("Successfully wrapped all Ether. Tx Hash:", result.transactionHash);
        });
}

const flashloan = async (value) => {
    const amount = web3.utils.toWei(value, 'ether');
    const tx = contract.methods.initiateFlashLoan(kovanWETHAddress, amount);
    console.log("failed zero")
    const options = {
        to : tx._parent._address,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({from: account}),
    };
    console.log("ended first");

    const signed = await web3.eth.accounts.signTransaction(options, pkey);
    console.log("ended second");
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
        .on('receipt', (result) => {
            console.log("Successfully initiated flash loan from Dy/Dx. Tx Hash:", result.transactionHash);
        });
        console.log("ended last");
}


/** METHODS
 * getWETHBalance()
 * getETHBalance()
 * withdrawETH()
 * withdrawWETH()
 * fundContract(value)
 * convertWETH(value)
 * flashloan(value)
 */

flashloan('10')