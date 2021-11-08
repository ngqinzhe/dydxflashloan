const env = require("dotenv").config();
const path = require("path");
var Tx = require("ethereumjs-tx").Transaction;
const Web3 = require("web3");
const fs = require("fs");
const network = process.env.LOCAL_TESTNET;

// TOKEN ADDRESSES
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

// ACCOUNT CONFIGURATIONS
const account = process.env.ACCOUNT_ID;
const pkey = process.env.PRIVATE_KEY;
const pkeybuffer = Buffer.from(pkey, "hex");
const contractAddress = "0x1851f147824594F36dDf8a625B9c88073D161d50";

// WEB3 CONFIGURATIONS WITH CONTRACT
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
var contract = new web3.eth.Contract(abi, contractAddress);

class TestContractClass {
    static getWETHBalance = () => {
        contract.methods.getWETHBalance().call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else console.log("WETH Balance:", web3.utils.fromWei(result));
        });
    };

    static getETHBalance = () => {
        contract.methods.getETHBalance().call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else console.log("ETH Balance:", web3.utils.fromWei(result));
        });
    };

    static withdrawETH = async () => {
        const tx = contract.methods.withdrawETH(account);

        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };

        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Successfully withdrew all ETH. Tx Hash:",
                    result.transactionHash
                );
            });
    };

    static withdrawWETH = async () => {
        const tx = contract.methods.withdrawToken(WETH);

        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };

        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Successfully withdrew remaining WETH. TxHash:",
                    result.transactionHash
                );
            });
    };

    static fundContract = async (value) => {
        const amountToDeploywithContract = web3.utils.toWei(value, "ether");

        await web3.eth.getTransactionCount(account, (err, txCount) => {
            const txObject = {
                nonce: web3.utils.toHex(txCount),
                gasLimit: web3.utils.toHex(6721975),
                gasPrice: web3.utils.toHex(20000000000),
                from: account,
                to: contractAddress,
                value: web3.utils.toHex(amountToDeploywithContract),
            };

            const tx = new Tx(txObject, { chain: "kovan" });
            tx.sign(pkeybuffer);

            const serializedTx = tx.serialize();
            const raw = "0x" + serializedTx.toString("hex");

            web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(
                        "Contract successfully funded with:",
                        web3.utils.fromWei(amountToDeploywithContract)
                    );
                    console.log("Transaction Hash:", txHash);
                }
            });
        });
    };

    static convertETHtoWETH = async (value) => {
        const amount = web3.utils.toWei(value, "ether");
        const tx = contract.methods.getWETH(amount);

        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };

        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Successfully wrapped all Ether. Tx Hash:",
                    result.transactionHash
                );
            });
    };

    static flashloan = async (value) => {
        // send a transaction to approve the input token with input amount
        // after approve transaction, send a transaction to swap
        const tx = contract.methods.initiateFlashLoan(
            WETH,
            web3.utils.toWei(value, "ether")
        );
        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };
        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Successfully initiated flash loan from Dy/Dx for " +
                        value +
                        " WETH. Tx Hash:",
                    result.transactionHash
                );
            });
    };

    static convertWETHtoETH = async () => {
        const tx = contract.methods.convertWETHtoETH();

        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };

        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Successfully unwrapped all Wrapped Ether. Tx Hash:",
                    result.transactionHash
                );
            });
    };

    static getTokenBalance = async (token) => {
        contract.methods
            .getTokenBalance(token)
            .call({ from: account }, (err, result) => {
                if (err) console.log(err);
                else console.log(`${token} balance:`, result / 1000000);
            });
    };

    static uniswapPath = async (addressPath, amountIn, amountOutMin) => {
        const tx = contract.methods.UniswapPath(
            addressPath,
            amountIn,
            amountOutMin
        );
        console.log("gas error");
        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };
        console.log("sign error");
        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    `Successfully swapped ${addressPath} Tx Hash:`,
                    result.transactionHash
                );
            });
    };

    static generatePath = async (path) => {
        const tx = contract.methods.generatePath(path);

        const options = {
            to: tx._parent._address,
            data: tx.encodeABI(),
            gas: await tx.estimateGas({ from: account }),
        };

        const signed = await web3.eth.accounts.signTransaction(options, pkey);
        await web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("receipt", (result) => {
                console.log(
                    "Injected path. TxHash:",
                    result.transactionHash
                );
            });
    };

    static getOwnerBalance = async () => {
        contract.methods
            .getOwnerBalance()
            .call({ from: account }, (err, result) => {
                if (err) console.log(err);
                else console.log(`Account Balance: ${web3.utils.fromWei(result)}`);
            });
    };

    static getPath = async () => {
        contract.methods.getPath().call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else {
                console.log("PATH result:", result);
            }
        });
    }
}

const main = async () => {
    const path = [WETH, DAI, WBTC, WETH];
    await TestContractClass.getWETHBalance();

}
main();