// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {ProjectNFT} from "../../src/ProjectNFT.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";
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

contract RealWorldProjectsIntegrationTest is Test {
    // Contracts
    PlatformRegistry public registry;
    VerificationOracle public oracle;
    TokenInvestment public tokenInvestment;
    ProjectNFT public nft;
    TestToken public token;

    // Addresses
    address public owner;
    address public treasury;
    address public verifier;
    address public creator;
    address public investor1;
    address public investor2;

    // Project details
    string public projectName = "Real World Integration Project";
    string public projectDescription = "A test project for end-to-end testing";
    uint256 public fundingGoal = 10 ether;
    uint256 public duration = 30 days;
    bool public isFlexibleFunding = false;
    uint256 public platformFee = 500; // 5%

    // Project address storage
    address public projectAddress;

    function setUp() public {
        // Setup addresses
        owner = address(this);
        treasury = makeAddr("treasury");
        verifier = makeAddr("verifier");
        creator = makeAddr("creator");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Give accounts ETH
        vm.deal(creator, 5 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);

        // Setup Oracle
        oracle = new VerificationOracle(1);
        oracle.addVerifier(verifier);

        // Setup Registry
        registry = new PlatformRegistry(platformFee, treasury, address(oracle));

        // Setup TokenInvestment
        tokenInvestment = new TokenInvestment(address(registry));

        // Setup NFT contract
        nft = new ProjectNFT(address(registry));

        // Setup ERC20 token
        token = new TestToken("Test Token", "TEST");

        // Add token to supported tokens
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
        // Test 1: Project Creation
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            projectName, projectDescription, fundingGoal, duration, isFlexibleFunding, teamMembers
        );
        vm.stopPrank();

        assertTrue(registry.registeredProjects(projectAddress), "Project should be registered");
        Project project = Project(payable(projectAddress));

        // Test 2: Project NFT Setup
        nft.authorizeProject(projectAddress);

        vm.startPrank(projectAddress);
        nft.createTier("Gold Investor", "Premium access and rewards", 5 ether, "ipfs://QmTestURI");
        vm.stopPrank();

        // Test 3: Milestone Creation
        vm.startPrank(creator);
        project.createMilestone("Initial Development", 3000); // 30%
        project.createMilestone("MVP Release", 4000); // 40%
        project.createMilestone("Final Product", 3000); // 30%
        vm.stopPrank();

        assertEq(project.milestoneCount(), 3, "Should have 3 milestones");

        // Test 4: Investment with ETH
        vm.prank(investor1);
        project.invest{value: 6 ether}();

        // Test 5: Investment with Token
        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 5 ether);

        // Verify ETH investment
        assertEq(project.investments(investor1), 6 ether, "ETH investment not recorded");
        assertEq(address(project).balance, 6 ether, "Project balance incorrect");

        // Verify token investment
        assertEq(
            tokenInvestment.tokenInvestments(projectAddress, address(token), investor2),
            5 ether,
            "Token investment not recorded"
        );

        // Test 6: Mint NFT for investor
        vm.startPrank(projectAddress);
        uint256 tokenId = nft.mintInvestorNFT(investor1, 0);
        vm.stopPrank();

        assertEq(nft.ownerOf(tokenId), investor1, "NFT not correctly minted");

        // Test 7: Project Successful Completion
        // Fast forward to deadline
        vm.warp(block.timestamp + duration + 1);

        // Update project state
        project.checkAndUpdateState();
        assertEq(uint8(project.state()), 1, "Project should be in Successful state");

        // Test 8: Milestone Verification
        // Submit verification from oracle
        vm.startPrank(verifier);
        oracle.submitVerification(projectAddress, 0, true);
        vm.stopPrank();

        // Submit milestone completion
        vm.startPrank(creator);
        project.submitMilestoneCompletion(0);
        vm.stopPrank();

        // Test 9: Investor Voting
        vm.prank(investor1);
        project.voteMilestone(0);
        vm.stopPrank();

        // Test 10: Fund Release
        uint256 creatorBalanceBefore = creator.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        vm.startPrank(creator);
        project.releaseMilestoneFunds(0);
        vm.stopPrank();

        // Calculate expected amounts for first milestone (30%)
        uint256 milestoneAmount = (6 ether * 3000) / 10000; // 30% of ETH funds
        uint256 feeAmount = (milestoneAmount * platformFee) / 10000;
        uint256 creatorAmount = milestoneAmount - feeAmount;

        // Check balances
        assertEq(creator.balance, creatorBalanceBefore + creatorAmount, "Creator didn't receive correct amount");
        assertEq(treasury.balance, treasuryBalanceBefore + feeAmount, "Treasury didn't receive fee");
    }

    function testFailedProjectRefundFlow() public {
        // Test 1: Create project with high funding goal
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            projectName,
            projectDescription,
            100 ether, // Unreachable goal
            duration,
            isFlexibleFunding,
            teamMembers
        );
        vm.stopPrank();

        Project project = Project(payable(projectAddress));

        // Test 2: Partial investment
        vm.prank(investor1);
        project.invest{value: 2 ether}();

        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 3 ether);

        // Test 3: Project deadline passes
        vm.warp(block.timestamp + duration + 1);

        // Test 4: Project is marked as failed
        project.checkAndUpdateState();
        assertEq(uint8(project.state()), 2, "Project should be in Failed state");

        // Test 5: ETH Refund
        uint256 investor1BalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(investor1.balance, investor1BalanceBefore + 2 ether, "Investor1 should receive full refund");

        // Test 6: Token Refund
        uint256 tokenBalanceBefore = token.balanceOf(investor2);

        vm.prank(investor2);
        tokenInvestment.claimTokenRefund(projectAddress, address(token));

        assertEq(token.balanceOf(investor2), tokenBalanceBefore + 3 ether, "Investor2 should receive full token refund");
    }

    function testFlexibleFundingProjectFlow() public {
        // Test 1: Create flexible funding project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Flexible Project",
            "A project with flexible funding",
            100 ether, // High goal that won't be met
            duration,
            true, // Flexible funding
            teamMembers
        );

        Project project = Project(payable(projectAddress));

        // Create milestone
        project.createMilestone("Project Delivery", 10000); // 100%
        vm.stopPrank();

        // Test 2: Partial investment
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        // Test 3: Project deadline passes
        vm.warp(block.timestamp + duration + 1);

        // Test 4: Project is still marked as successful despite not meeting goal
        project.checkAndUpdateState();
        assertEq(uint8(project.state()), 1, "Flexible funding project should be Successful");

        // Test 5: Verify refund is not available
        vm.prank(investor1);
        vm.expectRevert("Refunds not available");
        project.claimRefund();

        // Test 6: Milestone completion and fund release still works
        // Submit verification from oracle
        vm.startPrank(verifier);
        oracle.submitVerification(projectAddress, 0, true);
        vm.stopPrank();

        // Submit milestone completion
        vm.startPrank(creator);
        project.submitMilestoneCompletion(0);
        vm.stopPrank();

        // Investor voting
        vm.startPrank(investor1);
        project.voteMilestone(0);
        vm.stopPrank();

        // Release funds
        uint256 creatorBalanceBefore = creator.balance;

        vm.startPrank(creator);
        project.releaseMilestoneFunds(0);
        vm.stopPrank();

        // Creator should receive funds (minus fee)
        assertTrue(creator.balance > creatorBalanceBefore, "Creator should receive funds in flexible funding model");
    }

    function testCancelledProjectRefundProcess() public {
        // Test 1: Create project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            projectName, projectDescription, fundingGoal, duration, isFlexibleFunding, teamMembers
        );
        vm.stopPrank();

        Project project = Project(payable(projectAddress));

        // Test 2: Investment
        vm.prank(investor1);
        project.invest{value: 3 ether}();

        vm.prank(investor2);
        tokenInvestment.investWithToken(projectAddress, address(token), 4 ether);

        // Test 3: Cancel project
        vm.prank(creator);
        project.cancelProject();

        assertEq(uint8(project.state()), 3, "Project should be in Cancelled state");

        // Test 4: Verify further investments are rejected
        vm.prank(investor1);
        vm.expectRevert("Project not active");
        project.invest{value: 1 ether}();

        // Test 5: Refund process
        uint256 investor1BalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(
            investor1.balance,
            investor1BalanceBefore + 3 ether,
            "Investor should receive full refund after cancellation"
        );
    }
}
