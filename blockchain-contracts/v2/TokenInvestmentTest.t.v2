// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {TokenInvestment} from "../../src/TokenInvestment.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] -= amount;
        _balances[recipient] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);

        return true;
    }
}

contract MockRegistry {
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

    function isSupportedToken(address token) external view returns (bool) {
        return supportedTokens[token];
    }
}

contract MockProject {
    enum State {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    State public state = State.Active;
    bool public isFlexibleFundingValue;

    constructor(bool _isFlexibleFunding) {
        isFlexibleFundingValue = _isFlexibleFunding;
    }

    function setState(uint8 _state) external {
        state = State(_state);
    }

    function getIsFlexibleFunding() external view returns (bool) {
        return isFlexibleFundingValue;
    }

    function getProjectState() external view returns (uint8) {
        return uint8(state);
    }
}

contract TokenInvestmentTest is Test {
    TokenInvestment public implementation;
    TokenInvestment public tokenInvestment;
    ERC1967Proxy public proxy;

    address public owner;
    address public registry;
    address public project;
    address public investor1;
    address public investor2;

    MockERC20 public token;
    MockProject public mockProject;

    event TokenInvested(address indexed project, address indexed token, address indexed investor, uint256 amount);
    event TokenRefunded(address indexed project, address indexed token, address indexed investor, uint256 amount);

    function setUp() public {
        owner = address(this);
        registry = makeAddr("registry");
        project = makeAddr("project");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Create mock registry
        MockRegistry mockRegistry = new MockRegistry();
        mockRegistry.registerProject(project);
        mockRegistry.addSupportedToken(address(0x1)); // Add dummy token
        registry = address(mockRegistry);

        // Create mock project
        mockProject = new MockProject(false); // all-or-nothing funding
        project = address(mockProject);
        MockRegistry(registry).registerProject(project);

        // Create test token
        token = new MockERC20("Test Token", "TEST");

        // Deploy implementation
        implementation = new TokenInvestment();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(TokenInvestment.initialize.selector, owner, registry);

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        tokenInvestment = TokenInvestment(address(proxy));

        // Mint tokens for investors
        token.mint(investor1, 100 ether);
        token.mint(investor2, 100 ether);

        // Approve token spending
        vm.prank(investor1);
        token.approve(address(tokenInvestment), 100 ether);
        vm.prank(investor2);
        token.approve(address(tokenInvestment), 100 ether);

        // Register token in mock registry
        MockRegistry(registry).addSupportedToken(address(token));
    }

    function testInitialization() public view {
        assertEq(tokenInvestment.getPlatformRegistry(), registry, "Wrong registry address");
        assertTrue(tokenInvestment.hasRole(tokenInvestment.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(tokenInvestment.hasRole(tokenInvestment.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");
    }

    function testInvestWithToken() public {
        uint256 investAmount = 10 ether;

        vm.prank(investor1);
        vm.expectEmit(true, true, true, true);
        emit TokenInvested(project, address(token), investor1, investAmount);

        tokenInvestment.investWithToken(project, address(token), investAmount);

        // Check investment was recorded
        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor1),
            investAmount,
            "Investment not recorded"
        );

        // Check project total
        assertEq(
            tokenInvestment.getProjectTokenTotal(project, address(token)), investAmount, "Project total not updated"
        );

        // Check token balance
        assertEq(token.balanceOf(address(tokenInvestment)), investAmount, "Contract token balance incorrect");
    }

    function testMultipleTokenInvestments() public {
        // First investment
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), 5 ether);

        // Second investment from same investor
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), 5 ether);

        // Investment from another investor
        vm.prank(investor2);
        tokenInvestment.investWithToken(project, address(token), 10 ether);

        // Check individual investments
        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor1),
            10 ether,
            "Investor1 investment incorrect"
        );
        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor2),
            10 ether,
            "Investor2 investment incorrect"
        );

        // Check project total
        assertEq(tokenInvestment.getProjectTokenTotal(project, address(token)), 20 ether, "Project total incorrect");

        // Check contract token balance
        assertEq(token.balanceOf(address(tokenInvestment)), 20 ether, "Contract token balance incorrect");
    }

    function testInvestInInvalidProject() public {
        address invalidProject = makeAddr("invalidProject");

        vm.prank(investor1);
        vm.expectRevert("Invalid project");
        tokenInvestment.investWithToken(invalidProject, address(token), 10 ether);
    }

    function testInvestWithUnsupportedToken() public {
        address unsupportedToken = makeAddr("unsupportedToken");

        vm.prank(investor1);
        vm.expectRevert("Unsupported token");
        tokenInvestment.investWithToken(project, unsupportedToken, 10 ether);
    }

    function testClaimRefundForFailedProject() public {
        // Invest
        uint256 investAmount = 10 ether;
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), investAmount);

        // Set project to Failed state
        mockProject.setState(2); // Failed

        // Claim refund
        uint256 balanceBefore = token.balanceOf(investor1);

        vm.prank(investor1);
        vm.expectEmit(true, true, true, true);
        emit TokenRefunded(project, address(token), investor1, investAmount);

        tokenInvestment.claimTokenRefund(project, address(token));

        // Check investment record cleared
        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor1),
            0,
            "Investment should be cleared after refund"
        );

        // Check token balance
        assertEq(token.balanceOf(investor1), balanceBefore + investAmount, "Investor should receive full refund");
    }

    function testNoRefundForActiveProject() public {
        // Invest
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), 10 ether);

        // Project in Active state (default)

        // Try to claim refund
        vm.prank(investor1);
        vm.expectRevert("Refunds not available");
        tokenInvestment.claimTokenRefund(project, address(token));
    }

    function testNoRefundForFlexibleFunding() public {
        // Create flexible funding project
        MockProject flexibleProject = new MockProject(true); // flexible funding
        address flexibleProjectAddr = address(flexibleProject);

        // Register project
        MockRegistry(registry).registerProject(flexibleProjectAddr);

        // Invest
        vm.prank(investor1);
        tokenInvestment.investWithToken(flexibleProjectAddr, address(token), 10 ether);

        // Set project to Failed state
        flexibleProject.setState(2); // Failed

        // Try to claim refund
        vm.prank(investor1);
        vm.expectRevert("No refunds for flexible funding");
        tokenInvestment.claimTokenRefund(flexibleProjectAddr, address(token));
    }

    function testClaimRefundForCancelledProject() public {
        // Create a mock project first
        mockProject = new MockProject(false); // all-or-nothing funding
        project = address(mockProject);

        // Make sure to register the project in the mock registry
        MockRegistry(registry).registerProject(project);

        // Invest
        uint256 investAmount = 10 ether;
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), investAmount);

        // Set project to Cancelled state
        mockProject.setState(3); // Cancelled

        // Claim refund
        uint256 balanceBefore = token.balanceOf(investor1);

        vm.prank(investor1);
        tokenInvestment.claimTokenRefund(project, address(token));

        // Check token balance
        assertEq(
            token.balanceOf(investor1),
            balanceBefore + investAmount,
            "Investor should receive full refund after cancellation"
        );
    }

    function testUpdatePlatformRegistry() public {
        address newRegistry = makeAddr("newRegistry");

        tokenInvestment.updatePlatformRegistry(newRegistry);

        assertEq(tokenInvestment.getPlatformRegistry(), newRegistry, "Registry not updated");
    }

    function testUpgrade() public {
        // Invest with token
        vm.prank(investor1);
        tokenInvestment.investWithToken(project, address(token), 10 ether);

        // Deploy new implementation
        TokenInvestment newImplementation = new TokenInvestment();

        // Upgrade
        tokenInvestment.upgradeToAndCall(address(newImplementation), "");

        // Verify state preserved
        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor1),
            10 ether,
            "Investment record should be preserved"
        );

        // Verify functionality after upgrade
        vm.prank(investor2);
        tokenInvestment.investWithToken(project, address(token), 20 ether);

        assertEq(
            tokenInvestment.getTokenInvestment(project, address(token), investor2),
            20 ether,
            "New investment should work after upgrade"
        );
    }
}
