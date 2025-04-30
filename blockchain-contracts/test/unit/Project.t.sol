// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";

contract MockVerificationOracle {
    mapping(address => mapping(uint256 => bool)) private verifications;

    function setVerification(address project, uint256 milestoneId, bool status) external {
        verifications[project][milestoneId] = status;
    }

    function verifyMilestone(address project, uint256 milestoneId) external view returns (bool) {
        return verifications[project][milestoneId];
    }
}

contract ProjectTest is Test {
    Project public project;
    address public creator;
    address public treasury;
    address public registry;
    address public investor1;
    address public investor2;
    MockVerificationOracle public oracle;

    uint256 public fundingGoal = 5 ether;
    uint256 public duration = 30 days;
    bool public isFlexibleFunding = false;
    uint256 public platformFee = 500; // 5%

    event FundingReceived(address indexed investor, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 fundingPercentage);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event FundsWithdrawn(uint256 amount, address recipient);
    event ProjectStateChanged(uint8 newState);

    function setUp() public {
        creator = makeAddr("creator");
        treasury = makeAddr("treasury");
        registry = makeAddr("registry");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Create mock oracle
        oracle = new MockVerificationOracle();

        vm.startPrank(creator);
        project = new Project(
            creator,
            "Test Project",
            "A test project for fundraising",
            fundingGoal,
            duration,
            isFlexibleFunding,
            platformFee,
            treasury,
            address(oracle),
            registry
        );
        vm.stopPrank();

        // Give investors some ETH
        vm.deal(investor1, 10 ether);
        vm.deal(investor2, 10 ether);
    }

    function testInvest() public {
        uint256 investment = 1 ether;

        vm.prank(investor1);
        vm.expectEmit(true, true, false, true);
        emit FundingReceived(investor1, investment);

        project.invest{value: investment}();

        assertEq(project.investments(investor1), investment, "Investment not recorded");
        assertEq(project.totalFundsRaised(), investment, "Total funds not updated");
        assertEq(address(project).balance, investment, "Contract balance mismatch");
        assertEq(project.totalInvestors(), 1, "Investor count mismatch");
    }

    function testMultipleInvestments() public {
        // First investment
        vm.prank(investor1);
        project.invest{value: 1 ether}();

        // Second investment from same investor
        vm.prank(investor1);
        project.invest{value: 2 ether}();

        // Investment from another investor
        vm.prank(investor2);
        project.invest{value: 3 ether}();

        assertEq(project.investments(investor1), 3 ether, "Investor1 investment mismatch");
        assertEq(project.investments(investor2), 3 ether, "Investor2 investment mismatch");
        assertEq(project.totalFundsRaised(), 6 ether, "Total funds mismatch");
        assertEq(project.totalInvestors(), 2, "Investor count mismatch");
    }

    function testCreateMilestone() public {
        string memory description = "First Milestone";
        uint256 percentage = 5000; // 50%

        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MilestoneCreated(0, description, percentage);

        project.createMilestone(description, percentage);

        assertEq(project.milestoneCount(), 1, "Milestone not created");
    }

    function testCreateMilestoneUnauthorized() public {
        string memory description = "Unauthorized Milestone";
        uint256 percentage = 5000; // 50%

        vm.prank(investor1);
        vm.expectRevert("Not authorized");
        project.createMilestone(description, percentage);
    }

    function testMilestoneCompletion() public {
        // Create milestone
        vm.prank(creator);
        project.createMilestone("First Milestone", 5000);

        // Fund project fully
        vm.prank(investor1);
        project.invest{value: fundingGoal}();

        // Fast forward past deadline
        vm.warp(block.timestamp + duration + 1);

        // Update project state
        project.checkAndUpdateState();

        // Set verification to true in mock oracle
        oracle.setVerification(address(project), 0, true);

        // Submit milestone completion
        vm.prank(creator);
        vm.expectEmit(true, false, false, false);
        emit MilestoneCompleted(0);

        project.submitMilestoneCompletion(0);

        // Verify that milestone is marked as completed
        assertTrue(project.isMilestoneCompleted(0), "Milestone should be marked as completed");
    }

    function testProjectState() public {
        // Test initial state
        assertEq(uint8(project.state()), 0, "Initial state should be Active");

        // Fast forward past deadline without funding
        vm.warp(block.timestamp + duration + 1);

        // Update and check state (should be Failed for all-or-nothing)
        project.checkAndUpdateState();
        assertEq(uint8(project.state()), 2, "Should be Failed state");

        // Reset for flexible funding test
        vm.revertTo(0);
        setUp();

        // Change to flexible funding
        vm.prank(creator);
        Project flexibleProject = new Project(
            creator,
            "Flexible Project",
            "A test project with flexible funding",
            fundingGoal,
            duration,
            true, // flexible funding
            platformFee,
            treasury,
            address(oracle),
            registry
        );

        // Partial funding
        vm.prank(investor1);
        flexibleProject.invest{value: 1 ether}();

        // Fast forward past deadline
        vm.warp(block.timestamp + duration + 1);

        // Update and check state (should be Successful for flexible funding)
        flexibleProject.checkAndUpdateState();
        assertEq(uint8(flexibleProject.state()), 1, "Should be Successful state for flexible funding");
    }

    function testFundRelease() public {
        // Create milestone for 100% of funds
        vm.prank(creator);
        project.createMilestone("Full Release", 10000);

        // Fund project fully
        vm.prank(investor1);
        project.invest{value: fundingGoal}();

        // Fast forward past deadline
        vm.warp(block.timestamp + duration + 1);

        // Update project state
        project.checkAndUpdateState();

        // Set verification to true in mock oracle
        oracle.setVerification(address(project), 0, true);

        // Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Vote for milestone completion
        // In a real scenario, multiple investors would vote
        vm.prank(investor1);
        project.voteMilestone(0);

        // Check creator and treasury balance before
        uint256 creatorBalanceBefore = creator.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        // Release funds
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 totalFunds = fundingGoal;
        uint256 feeAmount = (totalFunds * platformFee) / 10000;
        uint256 creatorAmount = totalFunds - feeAmount;

        // Check balances after
        assertEq(creator.balance, creatorBalanceBefore + creatorAmount, "Creator didn't receive correct amount");
        assertEq(treasury.balance, treasuryBalanceBefore + feeAmount, "Treasury didn't receive fee");
        assertEq(project.totalFundsWithdrawn(), totalFunds, "Withdrawn funds mismatch");

        // Check milestone status
        assertTrue(project.areMilestoneFundsReleased(0), "Milestone funds should be marked as released");
    }

    function testRefund() public {
        // Fund project partially (below goal)
        uint256 investment = 1 ether;
        vm.prank(investor1);
        project.invest{value: investment}();

        // Fast forward past deadline
        vm.warp(block.timestamp + duration + 1);

        // Update project state (should be Failed)
        project.checkAndUpdateState();

        // Check balance before refund
        uint256 balanceBefore = investor1.balance;

        // Claim refund
        vm.prank(investor1);
        project.claimRefund();

        // Check balance after refund
        assertEq(investor1.balance, balanceBefore + investment, "Refund amount incorrect");
        assertEq(project.investments(investor1), 0, "Investment not reset after refund");
    }

    function testCancelProject() public {
        // Cancel project
        vm.prank(creator);
        project.cancelProject();

        // Check state
        assertEq(uint8(project.state()), 3, "Project should be in Cancelled state");

        // Try to invest after cancellation
        vm.prank(investor1);
        vm.expectRevert("Project not active");
        project.invest{value: 1 ether}();
    }
}
