const env = require("dotenv").config();
const path = require("path");
var Tx = require("ethereumjs-tx").Transaction;
const Web3 = require("web3");
const fs = require("fs");
const network = process.env.LOCAL_TESTNET;

// ACCOUNT CONFIGURATIONS
const account = process.env.ACCOUNT_ID;
const pkey = process.env.PRIVATE_KEY;
const pkeybuffer = Buffer.from(pkey, "hex");

// WEB3 CONFIGURATIONS
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const bytecode = fs.readFileSync(
    path.resolve(
        __dirname,
        "../build/contracts_DyDxSoloMargin_sol_DyDxSoloMargin.bin"
    )
);
const abi = JSON.parse(
    fs.readFileSync(
        path.resolve(
            __dirname,
            "../build/contracts_DyDxSoloMargin_sol_DyDxSoloMargin.abi"
        )
    )
);
const amountToDeploywithContract = web3.utils.toWei("10", "ether");

const deployContract = async () => {
    await web3.eth.getTransactionCount(account, (err, txCount) => {
        const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(5000000),
            gasPrice: web3.utils.toHex(20000000000),
            data: "0x" + bytecode,
            value: web3.utils.toHex(amountToDeploywithContract),
        };

        const tx = new Tx(txObject, { chain: "mainnet" });
        tx.sign(pkeybuffer);

        const serializedTx = tx.serialize();
        const raw = "0x" + serializedTx.toString("hex");

        web3.eth
            .sendSignedTransaction(raw, (err, txHash) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Contract successfully Deployed");
                    console.log("Transaction Hash:", txHash);
                }
            })
            .on("receipt", (result) => {
                console.log("Contract Address:", result.contractAddress);
            });
    });
};

deployContract();
