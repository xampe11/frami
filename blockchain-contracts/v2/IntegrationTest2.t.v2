// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";
import {ProjectFactory} from "../../src/ProjectFactory.sol";
import {ProjectNFT} from "../../src/ProjectNFT.sol";

// Mock ERC20 for testing
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

contract IntegrationTest is Test {
    // Proxies
    ERC1967Proxy public registryProxy;
    ERC1967Proxy public oracleProxy;
    ERC1967Proxy public factoryProxy;
    ERC1967Proxy public tokenInvestmentProxy;
    ERC1967Proxy public nftProxy;

    // Implementation contracts (wrapped proxies)
    PlatformRegistry public registry;
    VerificationOracle public oracle;
    ProjectFactory public factory;
    TokenInvestment public tokenInvestment;
    ProjectNFT public nft;

    // Implementation addresses
    address public registryImpl;
    address public oracleImpl;
    address public factoryImpl;
    address public projectImpl;
    address public tokenInvestmentImpl;
    address public nftImpl;

    // Test accounts
    address public owner;
    address public treasury;
    address public verifier;
    address public creator;
    address public investor1;
    address public investor2;

    // Created project
    address public projectAddress;
    Project public project;

    // Test token
    MockERC20 public token;

    function setUp() public {
        // Setup accounts
        owner = address(this);
        treasury = makeAddr("treasury");
        verifier = makeAddr("verifier");
        creator = makeAddr("creator");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Fund accounts
        vm.deal(creator, 5 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);

        // Deploy implementations
        VerificationOracle oracleImplementation = new VerificationOracle();
        oracleImpl = address(oracleImplementation);

        PlatformRegistry registryImplementation = new PlatformRegistry();
        registryImpl = address(registryImplementation);

        Project projectImplementation = new Project();
        projectImpl = address(projectImplementation);

        ProjectFactory factoryImplementation = new ProjectFactory();
        factoryImpl = address(factoryImplementation);

        TokenInvestment tokenInvestmentImplementation = new TokenInvestment();
        tokenInvestmentImpl = address(tokenInvestmentImplementation);

        ProjectNFT nftImplementation = new ProjectNFT();
        nftImpl = address(nftImplementation);

        // Deploy test ERC20 token
        token = new MockERC20("Test Token", "TEST");

        // Deploy VerificationOracle proxy
        bytes memory oracleData = abi.encodeWithSelector(
            VerificationOracle.initialize.selector,
            owner,
            1 // required verifications
        );

        oracleProxy = new ERC1967Proxy(oracleImpl, oracleData);
        oracle = VerificationOracle(address(oracleProxy));

        // Add verifier
        oracle.addVerifier(verifier);

        // Deploy PlatformRegistry proxy
        bytes memory registryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury,
            address(oracleProxy),
            address(0) // factory address to be set later
        );

        registryProxy = new ERC1967Proxy(registryImpl, registryData);
        registry = PlatformRegistry(address(registryProxy));

        // Deploy ProjectFactory proxy
        bytes memory factoryData =
            abi.encodeWithSelector(ProjectFactory.initialize.selector, owner, address(registryProxy), projectImpl);

        factoryProxy = new ERC1967Proxy(factoryImpl, factoryData);
        factory = ProjectFactory(address(factoryProxy));

        // Update registry with factory
        registry.updateProjectFactory(address(factoryProxy));

        // Deploy TokenInvestment proxy
        bytes memory tokenInvestmentData =
            abi.encodeWithSelector(TokenInvestment.initialize.selector, owner, address(registryProxy));

        tokenInvestmentProxy = new ERC1967Proxy(tokenInvestmentImpl, tokenInvestmentData);
        tokenInvestment = TokenInvestment(address(tokenInvestmentProxy));

        // Deploy ProjectNFT proxy
        bytes memory nftData = abi.encodeWithSelector(ProjectNFT.initialize.selector, owner, address(registryProxy));

        nftProxy = new ERC1967Proxy(nftImpl, nftData);
        nft = ProjectNFT(address(nftProxy));

        // Set up roles
        registry.grantProjectCreatorRole(creator);
        factory.grantRole(factory.ADMIN_ROLE(), address(registryProxy));

        // Add supported token
        registry.addSupportedToken(address(token));

        // Mint tokens for investors
        token.mint(investor1, 100 ether);
        token.mint(investor2, 100 ether);

        // Approve token spending
        vm.prank(investor1);
        token.approve(address(tokenInvestment), 100 ether);
        vm.prank(investor2);
        token.approve(address(tokenInvestment), 100 ether);
    }

    function testEndToEndProjectLifecycle() public {
        // Step 1: Create a project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Test Project",
            "A test project for end-to-end testing",
            10 ether, // funding goal
            30 days, // duration
            false, // all-or-nothing funding
            teamMembers
        );
        vm.stopPrank();

        // Verify project was created
        assertTrue(registry.isProjectRegistered(projectAddress), "Project should be registered");
        project = Project(payable(projectAddress));

        // Step 2: Authorize project for NFTs
        nft.authorizeProject(projectAddress);

        // Step 3: Set up NFT tier
        vm.prank(projectAddress);
        nft.createTier("Gold Investor", "Premium access and rewards", 5 ether, "ipfs://QmTestURI");

        // Step 4: Create milestones
        vm.startPrank(creator);
        project.createMilestone("Initial Development", 3000); // 30%
        project.createMilestone("MVP Release", 4000); // 40%
        project.createMilestone("Final Product", 3000); // 30%
        vm.stopPrank();

        // Verify milestones
        assertEq(project.getMilestoneCount(), 3, "Should have 3 milestones");

        // Step 5: Invest with ETH
        vm.prank(investor1);
        project.invest{value: 6 ether}();

        // Step 6: Invest with tokens
        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 5 ether);

        // Step 7: Mint NFT for investor
        vm.prank(projectAddress);
        uint256 tokenId = nft.mintInvestorNFT(investor1, 0);

        // Verify NFT ownership
        assertEq(nft.ownerOf(tokenId), investor1, "Investor should own the NFT");

        // Step 8: Move time forward to end funding period
        vm.warp(block.timestamp + 31 days);

        // Step 9: Update project state
        project.checkAndUpdateState();

        // Verify project state
        assertEq(uint8(project.getProjectState()), 1, "Project should be Successful");

        // Step 10: Verify first milestone
        vm.prank(verifier);
        oracle.submitVerification(projectAddress, 0, true);

        // Step 11: Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Step 12: Vote on milestone
        vm.prank(investor1);
        project.voteMilestone(0);

        // Step 13: Release funds for milestone
        uint256 creatorBalanceBefore = creator.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 milestoneAmount = (6 ether * 3000) / 10000; // 30% of ETH funds
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee
        uint256 creatorAmount = milestoneAmount - platformFee;

        // Verify balances
        assertEq(creator.balance, creatorBalanceBefore + creatorAmount, "Creator should receive correct amount");
        assertEq(treasury.balance, treasuryBalanceBefore + platformFee, "Treasury should receive fee");
    }

    function test_RevertWhen_FailedProjectRefunds() public {
        // Create project with high funding goal
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Test Project",
            "A test project with unreachable goal",
            100 ether, // unreachable funding goal
            30 days,
            false, // all-or-nothing
            teamMembers
        );
        vm.stopPrank();

        project = Project(payable(projectAddress));

        // Make some investments
        vm.prank(investor1);
        project.invest{value: 2 ether}();

        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 3 ether);

        // Fast forward time
        vm.warp(block.timestamp + 31 days);

        // Update project state
        project.checkAndUpdateState();

        // Verify project failed
        assertEq(uint8(project.getProjectState()), 2, "Project should be Failed");

        // Claim ETH refund
        uint256 investor1BalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(investor1.balance, investor1BalanceBefore + 2 ether, "Investor should receive full refund");

        // Claim token refund
        uint256 tokenBalanceBefore = token.balanceOf(investor2);

        vm.prank(investor2);
        tokenInvestment.claimTokenRefund(projectAddress, address(token));

        assertEq(token.balanceOf(investor2), tokenBalanceBefore + 3 ether, "Investor should receive full token refund");
    }

    function testFlexibleFunding() public {
        // Create flexible funding project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Flexible Project",
            "A project with flexible funding",
            100 ether, // High goal that won't be met
            30 days,
            true, // Flexible funding
            teamMembers
        );

        project = Project(payable(projectAddress));

        // Create milestone
        project.createMilestone("Project Delivery", 10000); // 100%
        vm.stopPrank();

        // Make investment
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        // Fast forward time
        vm.warp(block.timestamp + 31 days);

        // Update project state
        project.checkAndUpdateState();

        // Verify project successful despite not meeting goal
        assertEq(uint8(project.getProjectState()), 1, "Flexible funding project should be Successful");

        // Try to claim refund - should fail
        vm.prank(investor1);
        vm.expectRevert("Refunds not available");
        project.claimRefund();

        // Submit milestone verification
        vm.prank(verifier);
        oracle.submitVerification(projectAddress, 0, true);

        // Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Vote on milestone
        vm.prank(investor1);
        project.voteMilestone(0);

        // Release funds
        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Verify creator received funds
        assertTrue(creator.balance > creatorBalanceBefore, "Creator should receive funds");
    }

    function testCancelledProject() public {
        // Create project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Cancellable Project",
            "A project that will be cancelled",
            10 ether,
            30 days,
            false, // all-or-nothing
            teamMembers
        );
        vm.stopPrank();

        project = Project(payable(projectAddress));

        // Make investments
        vm.prank(investor1);
        project.invest{value: 3 ether}();

        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 4 ether);

        // Cancel project
        vm.prank(creator);
        project.cancelProject();

        // Verify project state
        assertEq(uint8(project.getProjectState()), 3, "Project should be Cancelled");

        // Try to invest after cancellation
        vm.prank(investor1);
        vm.expectRevert("Project not active");
        project.invest{value: 1 ether}();

        // Claim refund
        uint256 investor1BalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(
            investor1.balance,
            investor1BalanceBefore + 3 ether,
            "Investor should receive full refund after cancellation"
        );

        // Claim token refund
        uint256 tokenBalanceBefore = token.balanceOf(investor2);

        vm.prank(investor2);
        tokenInvestment.claimTokenRefund(projectAddress, address(token));

        assertEq(
            token.balanceOf(investor2),
            tokenBalanceBefore + 4 ether,
            "Investor should receive full token refund after cancellation"
        );
    }

    function testProjectUpgrades() public {
        // Create a project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Upgradeable Project", "A project that tests upgrades", 10 ether, 30 days, false, teamMembers
        );
        vm.stopPrank();

        // Make investment
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        // Deploy new implementation versions
        PlatformRegistry newRegistryImpl = new PlatformRegistry();
        VerificationOracle newOracleImpl = new VerificationOracle();
        TokenInvestment newTokenInvestmentImpl = new TokenInvestment();
        ProjectNFT newNftImpl = new ProjectNFT();

        // Upgrade contracts
        registry.upgradeToAndCall(address(newRegistryImpl), "");
        oracle.upgradeToAndCall(address(newOracleImpl), "");
        tokenInvestment.upgradeToAndCall(address(newTokenInvestmentImpl), "");
        nft.upgradeToAndCall(address(newNftImpl), "");

        // Verify state preserved and functionality continues
        assertTrue(registry.isProjectRegistered(projectAddress), "Registry should still have project registered");
        assertEq(project.getInvestmentAmount(investor1), 5 ether, "Investment record should be preserved");

        // Continue with normal flow after upgrades
        vm.warp(block.timestamp + 31 days);
        project.checkAndUpdateState();
        assertEq(uint8(project.getProjectState()), 2, "Project should be Failed");

        // Claim refund after upgrade
        uint256 investor1BalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(investor1.balance, investor1BalanceBefore + 5 ether, "Refund should work after upgrades");
    }
}
