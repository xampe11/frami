// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {TokenInvestment} from "../../src/TokenInvestment.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TestToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Must have minter role");
        _mint(to, amount);
    }

    function pause() public {
        require(hasRole(PAUSER_ROLE, msg.sender), "Must have pauser role");
        _pause();
    }

    function unpause() public {
        require(hasRole(PAUSER_ROLE, msg.sender), "Must have pauser role");
        _unpause();
    }
}

contract MockPlatformRegistry {
    mapping(address => bool) public registeredProjects;
    mapping(address => bool) public supportedTokens;

    function registerProject(address project) external {
        registeredProjects[project] = true;
    }

    function addSupportedToken(address token) external {
        supportedTokens[token] = true;
    }

    function isProjectRegistered(address project) external view returns (bool) {
        return registeredProjects[project];
    }
}

contract MockProject {
    bool public isFlexibleFunding;
    uint8 public state = 0; // 0 = Active, 1 = Successful, 2 = Failed, 3 = Cancelled
    mapping(address => uint256) public investments;

    constructor(bool _isFlexibleFunding) {
        isFlexibleFunding = _isFlexibleFunding;
    }

    function setState(uint8 _state) external {
        state = _state;
    }

    function setInvestment(address investor, uint256 amount) external {
        investments[investor] = amount;
    }

    function invest() external payable {}
}

contract TokenInvestmentTest is Test {
    TokenInvestment public tokenInvestment;
    MockPlatformRegistry public registry;
    MockProject public project;
    TestToken public token;

    address public owner;
    address public investor;

    event TokenInvested(address indexed project, address indexed token, address indexed investor, uint256 amount);
    event TokenRefunded(address indexed project, address indexed token, address indexed investor, uint256 amount);

    function setUp() public {
        owner = address(this);
        investor = makeAddr("investor");

        // Create mock registry
        registry = new MockPlatformRegistry();

        // Create token investment contract
        tokenInvestment = new TokenInvestment(address(registry));

        // Create mock project (all-or-nothing)
        project = new MockProject(false);

        // Register project in registry
        registry.registerProject(address(project));

        // Create mock ERC20 token
        token = new TestToken("Test Token", "TEST");

        // Add token to supported tokens
        registry.addSupportedToken(address(token));

        // Mint tokens for investor
        token.mint(investor, 100 ether);

        // Approve token spending
        vm.prank(investor);
        token.approve(address(tokenInvestment), 100 ether);
    }

    function testInvestWithToken() public {
        uint256 investAmount = 10 ether;

        vm.prank(investor);
        vm.expectEmit(true, true, true, true);
        emit TokenInvested(address(project), address(token), investor, investAmount);

        tokenInvestment.investWithToken(address(project), address(token), investAmount);

        // Check investment was recorded
        assertEq(
            tokenInvestment.tokenInvestments(address(project), address(token), investor),
            investAmount,
            "Investment not recorded"
        );

        // Check project total
        assertEq(
            tokenInvestment.projectTokenTotals(address(project), address(token)),
            investAmount,
            "Project total not updated"
        );

        // Check token transfer
        assertEq(token.balanceOf(address(tokenInvestment)), investAmount, "Tokens not transferred");
        assertEq(token.balanceOf(investor), 90 ether, "Investor balance not updated");
    }

    function testInvestWithUnsupportedToken() public {
        // Create unsupported token
        TestToken unsupportedToken = new TestToken("Unsupported", "UNS");

        // Mint tokens for investor
        unsupportedToken.mint(investor, 100 ether);

        // Approve token spending
        vm.prank(investor);
        unsupportedToken.approve(address(tokenInvestment), 100 ether);

        // Try to invest
        vm.prank(investor);
        vm.expectRevert("Unsupported token");

        tokenInvestment.investWithToken(address(project), address(unsupportedToken), 10 ether);
    }

    function testInvestWithInvalidProject() public {
        // Create unregistered project
        MockProject unregisteredProject = new MockProject(false);

        // Try to invest
        vm.prank(investor);
        vm.expectRevert("Invalid project");

        tokenInvestment.investWithToken(address(unregisteredProject), address(token), 10 ether);
    }

    function testClaimTokenRefund() public {
        uint256 investAmount = 10 ether;

        // Invest in project
        vm.prank(investor);
        tokenInvestment.investWithToken(address(project), address(token), investAmount);

        // Set project to failed state
        project.setState(2); // Failed

        // Claim refund
        vm.prank(investor);
        vm.expectEmit(true, true, true, true);
        emit TokenRefunded(address(project), address(token), investor, investAmount);

        tokenInvestment.claimTokenRefund(address(project), address(token));

        // Check investment was reset
        assertEq(
            tokenInvestment.tokenInvestments(address(project), address(token), investor), 0, "Investment not reset"
        );

        // Check token transfer
        assertEq(token.balanceOf(address(tokenInvestment)), 0, "Tokens not refunded");
        assertEq(token.balanceOf(investor), 100 ether, "Investor balance not restored");
    }

    function testClaimTokenRefundFlexibleFunding() public {
        // Create flexible funding project
        MockProject flexibleProject = new MockProject(true);
        registry.registerProject(address(flexibleProject));

        // Invest in project
        uint256 investAmount = 10 ether;
        vm.prank(investor);
        tokenInvestment.investWithToken(address(flexibleProject), address(token), investAmount);

        // Set project to failed state
        flexibleProject.setState(2); // Failed

        // Try to claim refund
        vm.prank(investor);
        vm.expectRevert("No refunds for flexible funding");

        tokenInvestment.claimTokenRefund(address(flexibleProject), address(token));
    }

    function testClaimTokenRefundProjectActive() public {
        // Invest in project
        uint256 investAmount = 10 ether;
        vm.prank(investor);
        tokenInvestment.investWithToken(address(project), address(token), investAmount);

        // Project still active
        project.setState(0); // Active

        // Try to claim refund
        vm.prank(investor);
        vm.expectRevert("Refunds not available");

        tokenInvestment.claimTokenRefund(address(project), address(token));
    }

    function testGetTokenInvestment() public {
        uint256 investAmount = 10 ether;

        // Invest in project
        vm.prank(investor);
        tokenInvestment.investWithToken(address(project), address(token), investAmount);

        // Get investment amount
        uint256 amount = tokenInvestment.getTokenInvestment(address(project), address(token), investor);

        assertEq(amount, investAmount, "Investment amount mismatch");
    }

    function testGetProjectTokenTotal() public {
        uint256 investAmount1 = 10 ether;
        uint256 investAmount2 = 5 ether;
        address investor2 = makeAddr("investor2");

        // Mint tokens for second investor
        token.mint(investor2, 100 ether);

        // Approve token spending
        vm.prank(investor2);
        token.approve(address(tokenInvestment), 100 ether);

        // Invest from both investors
        vm.prank(investor);
        tokenInvestment.investWithToken(address(project), address(token), investAmount1);

        vm.prank(investor2);
        tokenInvestment.investWithToken(address(project), address(token), investAmount2);

        // Get project total
        uint256 total = tokenInvestment.getProjectTokenTotal(address(project), address(token));

        assertEq(total, investAmount1 + investAmount2, "Project total mismatch");
    }
}
