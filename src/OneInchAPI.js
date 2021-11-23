const axios = require("axios");

class OneInchAPI {
    static URL = "https://api.1inch.exchange/v3.0/1/quote";
    static PROTOCOL = {
        SHIBASWAP: "SHIBAISWAP",
        DODO_V2: "DODO_V2",
        CURVE_V2: "CURVE_V2",
        SUSHI: "SUSHI",
        KYBER: "KYBER",
        UNISWAP_V2: "UNISWAP_V2",
        BALANCER_V2: "BALANCER_V2",
        ZRX: "ZRX",
        ONE_INCH_LP: "ONE_INCH_LP",
        ONE_INCH_LIMIT_ORDER: "ONE_INCH_LIMIT_ORDER",
    };

    static TOKEN = {
        YAM: {
            address: "0x0AaCfbeC6a24756c20D41914F2caba817C0d8521",
            symbol: "YAM"},
        yCRV: {
            address: "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8",
            symbol: "yCRV"
        },
        XRT: {
            address: "0x37D404A072056EDA0Cd10Cb714D35552329F8500",
            symbol: "XRT"
        },
        RWS: {
            address: "0x08AD83D779BDf2BBE1ad9cc0f78aa0D24AB97802",
            symbol: "RWS"
        },
        $BASED: {
            address: "0x68A118Ef45063051Eac49c7e647CE5Ace48a68a5",
            symbol: "$BASED"
        },
        sUSD: {
            address: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
            symbol: "sUSD"
        },
        XFI: {
            address: "0x5BEfBB272290dD5b8521D4a938f6c4757742c430",
            symbol: "XFI"
        },
        XSP: {
            address: "0x9b06D48E0529ecF05905fF52DD426ebEc0EA3011",
            symbol: "XSP"
        },
        REVV: {
            address: "0x557B933a7C2c45672B610F8954A3deB39a51A8Ca",
            symbol: "REVV"
        },
        LCX: {
            address: "0x037A54AaB062628C9Bbae1FDB1583c195585fe41",
            symbol: "LCX"
        },
        yyCRV: {
            address: "0x199ddb4BDF09f699d2Cf9CA10212Bd5E3B570aC2",
            symbol: "yyCRV"
        },
        zHEGIC: {
            address: "0x837010619aeb2AE24141605aFC8f66577f6fb2e7",
            symbol: "zHEGIC"
        },
        HEGIC: {
            address: "0x584bC13c7D411c00c01A62e8019472dE68768430",
            symbol: "HEGIC"
        },
        FRM: {
            address: "0xE5CAeF4Af8780E59Df925470b050Fb23C43CA68C",
            symbol: "FRM"
        },
        FRMX: {
            address: "0xf6832EA221ebFDc2363729721A146E6745354b14",
            symbol: "FRMX"
        },
        BADGER: {
            address: "0x3472A5A71965499acd81997a54BBA8D852C6E53d",
            symbol: "BADGER"
        },
        XAMP: {
            address: "0xf911a7ec46a2c6fa49193212fe4a2a9B95851c27",
            symbol: "XAMP"
        },
        TOB: {
            address: "0x7777770f8A6632ff043c8833310e245EBa9209E6",
            symbol: "TOB"
        },
        WETH: {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH"
        },
        DAI: {
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            symbol: "DAI"
        },
        USDT: {
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            symbol: "USDT"
        },
        USDC: {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            symbol: "USDC"
        },
        WBTC: {
            address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
            symbol: "WBTC"
        },
        SEAL: {
            address: "0x33c2DA7Fd5B125E629B3950f3c38d7f721D7B30D",
            symbol: "SEAL"
        },
        SUSHI: {
            address: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
            symbol: "SUSHI"
        },
        LINK: {
            address: "0x514910771af9ca656af840dff83e8264ecf986ca",
            symbol: "LINK"
        },
        KNC: {
            address: "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202",
            symbol: "KNC"
        },
        KP3R: {
            address: "0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44",
            symbol: "KP3R"
        },
        MKR: {
            address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
            symbol: "MKR"
        },
        OMG: {
            address: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
            symbol: "OMG"
        },
        ETH: {
            address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            symbol: "ETH"
        },
    };
    static swappath1 = [this.TOKEN.WETH, this.TOKEN.YAM, this.TOKEN.yCRV, this.TOKEN.WETH];
    static swappath2 = [this.TOKEN.WETH, this.TOKEN.$BASED, this.TOKEN.sUSD, this.TOKEN.WETH];
    static swappath3 = [this.TOKEN.WETH, this.TOKEN.XFI, this.TOKEN.XSP, this.TOKEN.WETH];
    static swappath4 = [this.TOKEN.WETH, this.TOKEN.REVV, this.TOKEN.LCX, this.TOKEN.WETH];
    static swappath5 = [this.TOKEN.WETH, this.TOKEN.BADGER, this.TOKEN.WBTC, this.TOKEN.WETH];
    static swappath6 = [this.TOKEN.WETH, this.TOKEN.XAMP, this.TOKEN.TOB, this.TOKEN.WETH];


    static sleep = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    static getQuote = async (fromTokenAddress, toTokenAddress, amount, protocol) => {
        const parameters = {
            fromTokenAddress,
            toTokenAddress,
            amount,
            protocols: protocol
        }
        
        const result = await axios.get(this.URL, {params: parameters});
        const {toTokenAmount, estimatedGas, protocols} = result.data;
        return {toTokenAmount, estimatedGas, protocols};
    };

    static getRoute = async (tokenPath, amount, protocols) => {
        const object1 = await this.getQuote(tokenPath[0].address, tokenPath[1].address, amount, protocols);
        const object2 = await this.getQuote(tokenPath[1].address, tokenPath[2].address, object1.toTokenAmount, protocols);
        const object3 = await this.getQuote(tokenPath[2].address, tokenPath[3].address, object2.toTokenAmount, protocols);
        const object4 = await this.getQuote(tokenPath[3].address, tokenPath[4].address, object3.toTokenAmount, protocols);
        console.log(`${tokenPath[0].symbol} -> ${tokenPath[1].symbol} -> ${tokenPath[2].symbol} -> ${tokenPath[3].symbol} for ${object4.toTokenAmount / 1e18} ${tokenPath[0].symbol}`);
        return object4.toTokenAmount / 1e18;
    }

    static crossDEXswap = async (tokenPath, amount, dex1, dex2) => {
        const token2object = await this.getQuote(tokenPath[0].address, tokenPath[1].address, amount, dex1);
        const token1object = await this.getQuote(tokenPath[1].address, tokenPath[0].address, token2object.toTokenAmount, dex2);
    
        console.log(`SWAPPED ${amount / 1e18} ${tokenPath[0].symbol} -> ${tokenPath[1].symbol} on ${dex1}, SWAPPED ${tokenPath[1].symbol} -> ${tokenPath[0].symbol} on ${dex2} for ${token1object.toTokenAmount / 1e18}`)
        return token1object.toTokenAmount / 1e18;
    }
}


const main = async (amount) => {

    const token = OneInchAPI.TOKEN;
    const exchange = OneInchAPI.PROTOCOL;
    const pathTest = [token.WETH, token.WBTC]
    while (true) {
        const result = await OneInchAPI.crossDEXswap(pathTest, amount, exchange.UNISWAP_V2, exchange.CURVE_V2);
        if (result > amount / 1e18) {
            console.log("Arbitrage Found");
            break;
        }
        await OneInchAPI.sleep(1000);
    }
}



main(10e18);

module.exports = OneInchAPI;