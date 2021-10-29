// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
pragma experimental ABIEncoderV2;

import "../interfaces/DydxFlashloanBase.sol";
import "../interfaces/ICallee.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DyDxSoloMargin is ICallee, DydxFlashloanBase {
  address private constant SOLO = 0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE;
  uint256 contractETHBalance;

  // ERC20 TOKENS ADDRESSES
  address public WETH = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
  address public SAI = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;
  address public USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address public DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public OWNER;
  mapping(address => uint) public currencies;

  modifier onlyOwner() {
    require(msg.sender == OWNER, "caller is not the owner!");
    _;
  }

  event Log(string message, uint val);
  event Deposit(string message, address sender, uint _value);
  struct MyCustomData {
    address token;
    uint repayAmount;
  }

  constructor() payable {
    currencies[WETH] = 1;
    currencies[SAI] = 2;
    currencies[USDC] = 3;   
    currencies[DAI] = 4;
    OWNER = msg.sender;
    getWETH(msg.value);
    // _getWeth(msg.value);
    // _approveWeth(msg.value);
  }

  // allow contract to receive ETH
  receive() external payable {}

  function initiateFlashLoan(address _token, uint _amount) external payable {
    ISoloMargin solo = ISoloMargin(SOLO);

    // Get marketId from token address
    /*
    0	WETH
    1	SAI
    2	USDC
    3	DAI
    */
    uint marketId = _getMarketIdFromTokenAddress(SOLO, _token);

    // Calculate repay amount (_amount + (2 wei))
    uint repayAmount = _getRepaymentAmountInternal(_amount);
    IERC20(_token).approve(SOLO, repayAmount);

    /*
    1. Withdraw
    2. Call callFunction()
    3. Deposit back
    */

    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

    operations[0] = _getWithdrawAction(marketId, _amount);
    operations[1] = _getCallAction(
      abi.encode(MyCustomData({token: _token, repayAmount: repayAmount}))
    );
    operations[2] = _getDepositAction(marketId, repayAmount);

    Account.Info[] memory accountInfos = new Account.Info[](1);
    accountInfos[0] = _getAccountInfo();

    solo.operate(accountInfos, operations);
  }

  function callFunction(
    address sender,
    Account.Info memory account,
    bytes memory data
  ) public override {
    require(msg.sender == SOLO, "!solo");
    require(sender == address(this), "!this contract");

    MyCustomData memory mcd = abi.decode(data, (MyCustomData));
    uint repayAmount = mcd.repayAmount;

    uint bal = IERC20(mcd.token).balanceOf(address(this));
    require(bal >= repayAmount, "bal < repay");

    // ARBITRAGE LOGIC HERE ...


    // More code here...
    emit Log("bal", bal);
    emit Log("repay", repayAmount);
    emit Log("bal - repay", bal - repayAmount);
  }

  // get weth function
  function getWETH(uint256 amount) public payable {
    (bool success, ) = WETH.call{value: amount}("");
    require(success, "failed to wrap ether");
  }

  function getETHBalance() public view returns(uint256) {
    return address(this).balance;
  }

  // withdraw weth from contact
  function withdrawToken(address _tokenAddress) public payable onlyOwner {
    uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
    IERC20(_tokenAddress).transfer(OWNER, balance);
  }

  // withdraw ether from contract
  function withdrawETH(address payable account) public payable onlyOwner{
    account.transfer(address(this).balance);
  }

  function getWETHBalance() public view onlyOwner returns(uint) {
    return IERC20(WETH).balanceOf(address(this));
  }
}
// Solo margin contract mainnet - 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e
// payable proxy - 0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76

// https://etherscan.io/tx/0xda79adea5cdd8cb069feb43952ea0fc510e4b6df4a270edc8130d8118d19e3f4
