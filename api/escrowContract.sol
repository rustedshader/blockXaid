// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Escrow {
    address public buyer;
    address payable public seller;
    address payable public arbiter;
    bool private isDeliveredFromBuyer;
    bool private isDeliveredFromSeller;
    uint private amount;

    mapping(address => uint) public pseudoBalances;

    event EscrowInitiated(
        address indexed buyer,
        address indexed seller,
        address indexed arbiter,
        uint timestamp
    );

    event AmountDeposited(
        address indexed from,
        uint amount,
        uint timestamp
    );

    event DeliveryConfirmed(
        address indexed confirmedBy,
        bool isBuyerConfirmed,
        bool isSellerConfirmed,
        uint timestamp
    );

    event AmountTransferred(
        address indexed from,
        address indexed to,
        uint amount,
        uint timestamp
    );

    event BalanceAdded(
        address indexed user,
        uint amount,
        uint newBalance,
        uint timestamp
    );

    constructor(address _buyer, address payable _seller, address payable _arbiter) {
        require(_buyer != address(0) && _seller != address(0) && _arbiter != address(0), "Invalid address");
        require(_buyer != _seller && _buyer != _arbiter && _seller != _arbiter, "Addresses must be different");
        
        buyer = _buyer;
        pseudoBalances[buyer] = 1000000;
        seller = _seller;
        arbiter = _arbiter;

        emit EscrowInitiated(buyer, seller, arbiter, block.timestamp);
    }

    function depositAmount(uint amt) public {
        require(msg.sender == buyer, "Not Authorized");
        require(amt > 0, "Amount Sending is not Valid");
        require(pseudoBalances[buyer] >= amt, "Insufficient balance");

        pseudoBalances[buyer] -= amt;
        pseudoBalances[arbiter] += amt;
        amount = amt;

        emit AmountDeposited(msg.sender, amt, block.timestamp);
        emit AmountTransferred(buyer, arbiter, amt, block.timestamp);
    }

    function deliveryConfirmed() public {
        require(msg.sender == buyer || msg.sender == seller, "Only buyer or seller can confirm delivery");
        
        if (msg.sender == seller) {
            isDeliveredFromSeller = true;
        }
        if (msg.sender == buyer) {
            isDeliveredFromBuyer = true;
        }

        emit DeliveryConfirmed(
            msg.sender,
            isDeliveredFromBuyer,
            isDeliveredFromSeller,
            block.timestamp
        );

        if (isDeliveredFromBuyer && isDeliveredFromSeller) {
            require(pseudoBalances[arbiter] >= amount, "Insufficient arbiter balance");
            
            pseudoBalances[arbiter] -= amount;
            pseudoBalances[seller] += amount;

            emit AmountTransferred(arbiter, seller, amount, block.timestamp);
        }
    }

    function addPseudoBalance(address user, uint amt) public {
        require(user != address(0), "Invalid address");
        require(amt > 0, "Amount must be greater than 0");

        pseudoBalances[user] += amt;

        emit BalanceAdded(
            user,
            amt,
            pseudoBalances[user],
            block.timestamp
        );
    }

    function getPseudoBalance(address user) public view returns (uint) {
        return pseudoBalances[user];
    }

    function getDeliveryStatus() public view returns (bool buyerConfirmed, bool sellerConfirmed) {
        return (isDeliveredFromBuyer, isDeliveredFromSeller);
    }

    function getEscrowAmount() public view returns (uint) {
        return amount;
    }
}