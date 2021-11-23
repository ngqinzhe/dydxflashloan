pragma solidity ^0.8;

interface IWETH {
    function withdraw(uint256 amount) external;

    function deposit() external payable;
}
