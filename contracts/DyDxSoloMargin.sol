// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
pragma experimental ABIEncoderV2;

import "../interfaces/DydxFlashloanBase.sol";
import "../interfaces/ICallee.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/IOneSplit.sol";

contract DyDxSoloMargin is ICallee, DydxFlashloanBase {
    // ROUTER ADDRESSES
    address private constant SOLO = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;
    address private constant UNISWAP_V2_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    // 1INCH config
    address private constant ONE_SPLIT_ADDRESS =
        0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E;
    uint256 PARTS = 10;
    uint256 FLAGS = 0;

    // ERC20 TOKENS ADDRESSES
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant SAI = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    // ERC20 PATH GENERATED
    address[] private swapPath;
    bool pathInserted;

    // OWNER ADDRESS
    address public OWNER;

    modifier onlyOwner() {
        require(msg.sender == OWNER, "caller is not the owner!");
        _;
    }

    event Log(string message, uint256 val);
    event Deposit(string message, address sender, uint256 _value);

    struct MyCustomData {
        address token;
        uint256 repayAmount;
    }

    constructor() payable {
        pathInserted = false;
        OWNER = msg.sender;
        getWETH(msg.value);
    }

    // allow contract to receive ETH
    receive() external payable {}

    function initiateFlashLoan(address _token, uint256 _amount)
        external
        payable
    {
        ISoloMargin solo = ISoloMargin(SOLO);
        uint256 marketId = _getMarketIdFromTokenAddress(SOLO, _token);

        // Calculate repay amount (_amount + (2 wei))
        uint256 repayAmount = _getRepaymentAmountInternal(_amount);
        IERC20(_token).approve(SOLO, repayAmount);

        Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

        operations[0] = _getWithdrawAction(marketId, _amount);
        operations[1] = _getCallAction(
            abi.encode(
                MyCustomData({ token: _token, repayAmount: repayAmount })
            )
        );
        operations[2] = _getDepositAction(marketId, repayAmount);

        Account.Info[] memory accountInfos = new Account.Info[](1);
        accountInfos[0] = _getAccountInfo();

        solo.operate(accountInfos, operations);
    }

    // SOLO CONTRACT WILL CALL THIS FUNCTION
    function callFunction(
        address sender,
        Account.Info memory account,
        bytes memory data
    ) public override {
        require(msg.sender == SOLO, "!solo");
        require(sender == address(this), "!this contract");

        MyCustomData memory mcd = abi.decode(data, (MyCustomData));
        uint256 repayAmount = mcd.repayAmount;

        uint256 bal = IERC20(mcd.token).balanceOf(address(this));
        require(bal >= repayAmount, "bal < repay");

        // ARBITRAGE LOGIC HERE ...
        uint256 tradeAmount = repayAmount;
        uint256 receivedAmount = UniswapSwap(swapPath, tradeAmount, 0);
        getWETH(receivedAmount);
        require(
            IERC20(WETH).balanceOf(address(this)) >= repayAmount,
            "Not enough WETH to repay loan after swaps"
        );
    }

    function UniswapSwap(
        address[] memory myPath,
        uint256 amountIn,
        uint256 amountOutMin
    ) public payable returns (uint256) {
        // prevent front running
        require(
            IERC20(myPath[0]).approve(UNISWAP_V2_ROUTER, 0),
            "front-running approval failed"
        );
        require(
            IERC20(myPath[0]).approve(UNISWAP_V2_ROUTER, amountIn),
            "approval failed"
        );

        // SWAP OF TOKENS
        uint256[] memory output = IUniswapV2Router02(UNISWAP_V2_ROUTER)
            .swapExactTokensForETH(
                amountIn,
                amountOutMin,
                myPath,
                address(this),
                block.timestamp
            );
        // require(
        //     output[output.length - 1] > amountIn,
        //     "Not a profitable arbitrage"
        // );
        return output[output.length - 1];
    }
    
    // get weth function
    function getWETH(uint256 amount) public payable {
        IWETH(WETH).deposit{ value: amount }();
    }

    function getETHBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // withdraw weth from contact
    function withdrawToken(address _tokenAddress) public payable onlyOwner {
        uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
        IERC20(_tokenAddress).transfer(OWNER, balance);
    }

    // withdraw ether from contract
    function withdrawETH(address payable account) public payable onlyOwner {
        account.transfer(address(this).balance);
    }

    function getWETHBalance() public view returns (uint256) {
        return IERC20(WETH).balanceOf(address(this));
    }

    function _convertWETHtoETH(uint256 amount) public payable onlyOwner {
        IWETH(WETH).withdraw(amount);
    }

    function convertWETHtoETH() public payable onlyOwner {
        uint256 balance = IERC20(WETH).balanceOf(address(this));
        _convertWETHtoETH(balance);
    }

    function getTokenBalance(address _token)
        public
        view
        onlyOwner
        returns (uint256)
    {
        return IERC20(_token).balanceOf(address(this));
    }

    // trading path
    function generatePath(address[] memory tokenAddressPath)
        external
        onlyOwner
    {
        swapPath = tokenAddressPath;
        pathInserted = true;
    }

    function getPath() external view onlyOwner returns (bool) {
        return pathInserted;
    }
}
// SOLO margin contract mainnet - 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e
// SOLO margin contract kovan testnet - 0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE
// payable proxy - 0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76
// https://etherscan.io/tx/0xda79adea5cdd8cb069feb43952ea0fc510e4b6df4a270edc8130d8118d19e3f4
