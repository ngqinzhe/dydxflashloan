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
const contractAddress = "0x9492AAe0411eE07641339040488BB2e681efa734";

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

const getWETHBalance = () => {
    contract.methods.getWETHBalance().call({ from: account }, (err, result) => {
        if (err) console.log(err);
        else console.log("WETH Balance:", web3.utils.fromWei(result));
    });
};

const getETHBalance = () => {
    contract.methods.getETHBalance().call({ from: account }, (err, result) => {
        if (err) console.log(err);
        else console.log("ETH Balance:", web3.utils.fromWei(result));
    });
};

const withdrawETH = async () => {
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

const withdrawWETH = async () => {
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

const fundContract = async (value) => {
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

const convertETHtoWETH = async (value) => {
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

const flashloan = async (value) => {
    // send a transaction to approve the input token with input amount
    // after approve transaction, send a transaction to swap
    const tx = contract.methods.initiateFlashLoan(
        WETH,
        web3.utils.toWei(value, "ether")
    );
    console.log("gas error");
    const options = {
        to: tx._parent._address,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({ from: account }),
    };
    console.log("accounts eror");
    const signed = await web3.eth.accounts.signTransaction(options, pkey);
    console.log("send tx error");
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
    console.log("ended last");
};

const convertWETHtoETH = async () => {
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

const getTokenBalance = async (token) => {
    contract.methods
        .getTokenBalance(token)
        .call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else console.log(`${token} balance:`, result / 1000000);
        });
};

const uniswapPath = async (addressPath, amountIn, amountOutMin) => {
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

const generatePath = async (path) => {
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

const getOwnerBalance = async () => {
    contract.methods
        .getOwnerBalance()
        .call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else console.log(`Account Balance: ${web3.utils.fromWei(result)}`);
        });
};

const getPath = async () => {
    contract.methods.getPath().call({ from: account }, (err, result) => {
        if (err) console.log(err);
        else {
            console.log("PATH result:", result);
        }
    });
}
/** METHODS => values are all in strings, ether format
 * getWETHBalance()
 * getETHBalance()
 * withdrawETH()
 * withdrawWETH()
 * fundContract(value)
 * convertWETH(value)
 * flashloan(value)
 * convertWETHtoETH(value)
 */

const main = async () => {
    const path = [WETH, DAI, USDT, WETH];
    //await uniswapPath(path, "20000", "0");
    // for (let i = 1; i < path.length; ++i) {
    //     await generatePath(path[i]);
    // }
    await flashloan('10');
    //await getOwnerBalance();
    //await getPath();
};

main();
