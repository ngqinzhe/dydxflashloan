const env = require("dotenv").config();
const path = require("path");
var Tx = require("ethereumjs-tx").Transaction;
const Web3 = require("web3");
const fs = require("fs");
const axios = require("axios");
const network = process.env.LOCAL_TESTNET;
const OneInchAPI = require("./OneInchAPI");

// TOKEN ADDRESSES

const UNISWAPTOKEN = {
    YAM: "0x0aacfbec6a24756c20d41914f2caba817c0d8521",
    yCRV: "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8",
    XRT: "0x37d404a072056eda0cd10cb714d35552329f8500",
    RWS: "0x08ad83d779bdf2bbe1ad9cc0f78aa0d24ab97802",
    $BASED: "0x68a118ef45063051eac49c7e647ce5ace48a68a5",
    sUSD: "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
    XFI: "0x5befbb272290dd5b8521d4a938f6c4757742c430",
    XSP: "0x9b06d48e0529ecf05905ff52dd426ebec0ea3011",
    REVV: "0x557b933a7c2c45672b610f8954a3deb39a51a8ca",
    LCX: "0x037a54aab062628c9bbae1fdb1583c195585fe41",
    yyCRV: "0x199ddb4bdf09f699d2cf9ca10212bd5e3b570ac2",
    zHEGIC: "0x837010619aeb2ae24141605afc8f66577f6fb2e7",
    HEGIC: "0x584bc13c7d411c00c01a62e8019472de68768430",
    FRM: "0xe5caef4af8780e59df925470b050fb23c43ca68c",
    FRMX: "0xf6832ea221ebfdc2363729721a146e6745354b14",
    BADGER: "0x3472a5a71965499acd81997a54bba8d852c6e53d",
    XAMP: "0xf911a7ec46a2c6fa49193212fe4a2a9b95851c27",
    TOB: "0x7777770f8a6632ff043c8833310e245eba9209e6",
    WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    SEAL: "0x33c2da7fd5b125e629b3950f3c38d7f721d7b30d",
    SUSHI: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
    LINK: "0x514910771af9ca656af840dff83e8264ecf986ca",
    KNC: "0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202",
    KP3R: "0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44",
};




// ACCOUNT CONFIGURATIONS
const account = process.env.ACCOUNT_ID;
const pkey = process.env.PRIVATE_KEY;
const pkeybuffer = Buffer.from(pkey, "hex");
const contractAddress = "0x081D4e3ccc9701943BeD686b9EE0a9aA42C3Bd70";

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
        contract.methods
            .getWETHBalance()
            .call({ from: account }, (err, result) => {
                if (err) console.log(err);
                else console.log("WETH Balance:", web3.utils.fromWei(result));
            });
    };

    static getETHBalance = () => {
        contract.methods
            .getETHBalance()
            .call({ from: account }, (err, result) => {
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
        const tx = contract.methods.withdrawToken(TOKEN["WETH"]);

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
            TOKEN["WETH"],
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
                console.log("Injected path. TxHash:", result.transactionHash);
            });
    };

    static getOwnerBalance = async () => {
        contract.methods
            .getOwnerBalance()
            .call({ from: account }, (err, result) => {
                if (err) console.log(err);
                else
                    console.log(
                        `Account Balance: ${web3.utils.fromWei(result)}`
                    );
            });
    };

    static getPath = async () => {
        contract.methods.getPath().call({ from: account }, (err, result) => {
            if (err) console.log(err);
            else {
                console.log("PATH result:", result);
            }
        });
    };
}


const main = async () => {
    

    const allPaths = [
        swappath1,
        swappath2,
        swappath3,
        swappath4,
        swappath8,
        swappath9,
    ];

    const swappath10 = [TOKEN["WETH"], TOKEN["WBTC"], TOKEN["USDT"], TOKEN["WETH"]];
    const pathName = {
        0: "WETH -> YAM -> yCRV -> WETH",
        1: "WETH -> $BASED -> sUSD -> WETH",
        2: "WETH -> XFI -> XSP -> WETH",
        3: "WETH -> REVV -> LCX -> WETH",
        4: "WETH -> BADGER -> WBTC -> WETH",
        5: "WETH -> XAMP -> TOB -> WETH",
        6: "WETH -> USDT -> WBTC -> WETH",
    };
    
    while (true) {
        fetchRoute(swappath10, 10 * 1e18).then(res => {
            console.log(`${pathName[6]}:`, res);
        })
        await sleep(15000);
    }
    
};


const contractTest = async () => {
    const path = [TOKEN["WETH"], TOKEN["USDT"], TOKEN["WBTC"], TOKEN["WETH"]];
    await TestContractClass.flashloan('10');
}

main();
