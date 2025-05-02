// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Project contract interface
interface IProject {
    function invest() external payable;
    function isFlexibleFunding() external view returns (bool);
    function state() external view returns (uint8);
    function investments(address) external view returns (uint256);
}

// Platform registry interface
interface IPlatformRegistry {
    function isProjectRegistered(address) external view returns (bool);
    function supportedTokens(address) external view returns (bool);
}

contract TokenInvestment is Ownable, ReentrancyGuard {
    // Platform registry
    address public platformRegistry;

    // Token investments tracking
    mapping(address => mapping(address => mapping(address => uint256))) public tokenInvestments;
    // project -> token -> total investment
    mapping(address => mapping(address => uint256)) public projectTokenTotals;

    // Events
    event TokenInvested(address indexed project, address indexed token, address indexed investor, uint256 amount);
    event TokenRefunded(address indexed project, address indexed token, address indexed investor, uint256 amount);

    constructor(address _platformRegistry) Ownable(msg.sender) ReentrancyGuard() {
        platformRegistry = _platformRegistry;
    }

    // Invest with ERC20 tokens
    function investWithToken(address _project, address _token, uint256 _amount) external nonReentrant {
        // Ensure project is registered
        require(IPlatformRegistry(platformRegistry).isProjectRegistered(_project), "Invalid project");
        require(IPlatformRegistry(platformRegistry).supportedTokens(_token), "Unsupported token");

        // Transfer tokens to this contract
        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        // Update investment records
        tokenInvestments[_project][_token][msg.sender] += _amount;
        projectTokenTotals[_project][_token] += _amount;

        emit TokenInvested(_project, _token, msg.sender, _amount);
    }

    // Claim token refund
    function claimTokenRefund(address _project, address _token) external nonReentrant {
        IProject project = IProject(_project);

        // Ensure project has failed and refunds are available
        require(project.state() == 2, "Refunds not available"); // State.Failed = 2
        require(!project.isFlexibleFunding(), "No refunds for flexible funding");

        uint256 refundAmount = tokenInvestments[_project][_token][msg.sender];
        require(refundAmount > 0, "No funds to refund");

        // Reset investor's contribution
        tokenInvestments[_project][_token][msg.sender] = 0;

        // Return tokens
        IERC20 token = IERC20(_token);
        require(token.transfer(msg.sender, refundAmount), "Token transfer failed");

        emit TokenRefunded(_project, _token, msg.sender, refundAmount);
    }

    // Get token investment amount
    function getTokenInvestment(address _project, address _token, address _investor) external view returns (uint256) {
        return tokenInvestments[_project][_token][_investor];
    }

    // Get total token investment for a project
    function getProjectTokenTotal(address _project, address _token) external view returns (uint256) {
        return projectTokenTotals[_project][_token];
    }
}
