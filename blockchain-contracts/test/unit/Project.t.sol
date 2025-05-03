// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {Project} from "../../src/Project.sol";
import {TokenInvestment} from "../../src/TokenInvestment.sol";
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
    Project public implementation;
    Project public project;
    ERC1967Proxy public proxy;

    address public owner;
    address public creator;
    address public treasury;
    address public oracle;
    address public registry;
    address public investor1;
    address public investor2;

    uint256 public fundingGoal = 10 ether;
    uint256 public duration = 30 days;
    bool public isFlexibleFunding = false;
    uint256 public platformFee = 500; // 5%

    event FundingReceived(address indexed investor, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 fundingPercentage);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event MilestoneVoteReceived(uint256 indexed milestoneId, address indexed investor);
    event FundsWithdrawn(uint256 amount, address recipient);
    event ProjectStateChanged(uint256 newState);
    event RefundIssued(address indexed investor, uint256 amount);
    event TeamMemberAdded(address indexed member);
    event TeamMemberRemoved(address indexed member);

    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        treasury = makeAddr("treasury");
        oracle = makeAddr("oracle");
        registry = makeAddr("registry");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Deploy mock verification oracle
        MockVerificationOracle mockOracle = new MockVerificationOracle();
        oracle = address(mockOracle);

        // Deploy implementation
        implementation = new Project();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(
            Project.initialize.selector,
            creator,
            "Test Project",
            "A test project for fundraising",
            fundingGoal,
            duration,
            isFlexibleFunding,
            platformFee,
            treasury,
            oracle,
            registry,
            new address[](0) // Empty team members array
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        project = Project(payable(address(proxy)));

        // Give investors some ETH
        vm.deal(investor1, 10 ether);
        vm.deal(investor2, 10 ether);
    }

    function testInitialization() public {
        (
            string memory name,
            string memory description,
            address projectCreator,
            uint256 goal,
            uint256 projectDeadline,
            uint256 totalRaised,
            Project.State projectState,
            bool isFlexible
        ) = project.getProjectDetails();

        assertEq(name, "Test Project", "Wrong project name");
        assertEq(description, "A test project for fundraising", "Wrong project description");
        assertEq(projectCreator, creator, "Wrong creator");
        assertEq(goal, fundingGoal, "Wrong funding goal");
        assertEq(projectDeadline, block.timestamp + duration, "Wrong deadline");
        assertEq(totalRaised, 0, "Initial funds raised should be 0");
        assertEq(uint256(projectState), uint256(0), "Initial state should be Active");
        assertEq(isFlexible, isFlexibleFunding, "Wrong funding type");

        assertTrue(project.hasRole(project.ADMIN_ROLE(), creator), "Creator should have ADMIN_ROLE");
        assertTrue(project.hasRole(project.TEAM_MEMBER_ROLE(), creator), "Creator should have TEAM_MEMBER_ROLE");
    }

    function testInvest() public {
        uint256 investment = 1 ether;

        vm.prank(investor1);
        vm.expectEmit(true, true, false, true);
        emit FundingReceived(investor1, investment);

        project.invest{value: investment}();

        assertEq(project.getInvestmentAmount(investor1), investment, "Investment not recorded");
        assertEq(address(project).balance, investment, "Contract balance incorrect");
        assertEq(project.getInvestorCount(), 1, "Investor count incorrect");
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

        (,,,,, uint256 totalRaised,,) = project.getProjectDetails();

        assertEq(project.getInvestmentAmount(investor1), 3 ether, "Investor1 investment incorrect");
        assertEq(project.getInvestmentAmount(investor2), 3 ether, "Investor2 investment incorrect");
        assertEq(totalRaised, 6 ether, "Total funds raised incorrect");
        assertEq(project.getInvestorCount(), 2, "Investor count incorrect");
    }

    function testDirectEthTransfer() public {
        // Send ETH directly to contract
        vm.prank(investor1);
        (bool success,) = address(project).call{value: 1 ether}("");

        assertTrue(success, "Direct ETH transfer should succeed");
        assertEq(project.getInvestmentAmount(investor1), 1 ether, "Investment not recorded");
        assertEq(address(project).balance, 1 ether, "Contract balance incorrect");
    }

    function testCreateMilestone() public {
        string memory description = "First Milestone";
        uint256 percentage = 5000; // 50%

        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MilestoneCreated(0, description, percentage);

        project.createMilestone(description, percentage);

        assertEq(project.getMilestoneCount(), 1, "Milestone not created");

        (
            string memory milestoneDesc,
            uint256 milestonePercentage,
            bool completed,
            bool fundsReleased,
            uint256 votesNeeded,
            uint256 votesReceived
        ) = project.getMilestoneDetails(0);

        assertEq(milestoneDesc, description, "Milestone description incorrect");
        assertEq(milestonePercentage, percentage, "Milestone percentage incorrect");
        assertFalse(completed, "Milestone should not be completed initially");
        assertFalse(fundsReleased, "Milestone funds should not be released initially");
        assertEq(votesNeeded, 0, "Initial votes needed should be 0");
        assertEq(votesReceived, 0, "Initial votes received should be 0");
    }

    function testCreateMilestoneUnauthorized() public {
        vm.prank(investor1);
        vm.expectRevert();
        project.createMilestone("Unauthorized Milestone", 5000);
    }

    function testTeamMemberManagement() public {
        address newMember = makeAddr("newMember");

        // Initially not a team member
        assertFalse(project.isTeamMember(newMember), "Should not be a team member initially");

        // Add team member
        vm.prank(creator);
        vm.expectEmit(true, false, false, false);
        emit TeamMemberAdded(newMember);

        project.addTeamMember(newMember);

        assertTrue(project.isTeamMember(newMember), "Should be a team member after adding");
        assertTrue(project.hasRole(project.TEAM_MEMBER_ROLE(), newMember), "Should have TEAM_MEMBER_ROLE");

        // Remove team member
        vm.prank(creator);
        vm.expectEmit(true, false, false, false);
        emit TeamMemberRemoved(newMember);

        project.removeTeamMember(newMember);

        assertFalse(project.isTeamMember(newMember), "Should not be a team member after removal");
        assertFalse(project.hasRole(project.TEAM_MEMBER_ROLE(), newMember), "Should not have TEAM_MEMBER_ROLE");
    }

    function testCannotRemoveCreator() public {
        vm.prank(creator);
        vm.expectRevert("Cannot remove creator");
        project.removeTeamMember(creator);
    }

    function testSuccessfulFunding() public {
        // Invest full goal amount
        vm.prank(investor1);
        project.invest{value: fundingGoal}();

        // Move time forward
        vm.warp(block.timestamp + duration + 1);

        // Check and update state
        vm.expectEmit(true, false, false, false);
        emit ProjectStateChanged(uint256(1));

        Project.State newState = project.checkAndUpdateState();

        assertEq(uint256(newState), uint256(1), "Project should be Successful");
    }

    function testFailedFunding() public {
        // Invest less than goal
        vm.prank(investor1);
        project.invest{value: fundingGoal / 2}();

        // Move time forward
        vm.warp(block.timestamp + duration + 1);

        // Check and update state
        vm.expectEmit(true, false, false, false);
        emit ProjectStateChanged(uint256(2));

        Project.State newState = project.checkAndUpdateState();

        assertEq(uint256(newState), uint256(2), "Project should be Failed");
    }

    function testFlexibleFundingSuccess() public {
        // Deploy a flexible funding project
        bytes memory data = abi.encodeWithSelector(
            Project.initialize.selector,
            creator,
            "Flexible Project",
            "A flexible funding project",
            fundingGoal,
            duration,
            true, // flexible funding
            platformFee,
            treasury,
            oracle,
            registry,
            new address[](0)
        );

        ERC1967Proxy flexibleProxy = new ERC1967Proxy(address(implementation), data);
        Project flexibleProject = Project(payable(address(flexibleProxy)));

        // Invest less than goal
        vm.prank(investor1);
        flexibleProject.invest{value: fundingGoal / 2}();

        // Move time forward
        vm.warp(block.timestamp + duration + 1);

        // Check and update state
        Project.State newState = flexibleProject.checkAndUpdateState();

        assertEq(uint256(newState), uint256(1), "Flexible funding project should be Successful");
    }

    function testMilestoneVerificationAndFundRelease() public {
        // Create milestone
        vm.prank(creator);
        project.createMilestone("Test Milestone", 10000); // 100%

        // Invest full goal
        vm.prank(investor1);
        project.invest{value: fundingGoal}();

        // Move time forward and mark project as successful
        vm.warp(block.timestamp + duration + 1);
        project.checkAndUpdateState();

        // Set mock verification to true
        MockVerificationOracle(oracle).setVerification(address(project), 0, true);

        // Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Verify milestone is completed
        (,, bool completed,,,) = project.getMilestoneDetails(0);
        assertTrue(completed, "Milestone should be marked as completed");

        // Vote on milestone
        vm.prank(investor1);
        project.voteMilestone(0);

        // Balance before fund release
        uint256 creatorBalanceBefore = creator.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        // Release funds
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 totalAmount = fundingGoal;
        uint256 platformFeeAmount = (totalAmount * platformFee) / 10000;
        uint256 creatorAmount = totalAmount - platformFeeAmount;

        // Verify balances
        assertEq(creator.balance, creatorBalanceBefore + creatorAmount, "Creator balance incorrect");
        assertEq(treasury.balance, treasuryBalanceBefore + platformFeeAmount, "Treasury balance incorrect");

        // Verify milestone state
        (,,, bool fundsReleased,,) = project.getMilestoneDetails(0);
        assertTrue(fundsReleased, "Milestone funds should be marked as released");
    }

    function testRefundOnFailedProject() public {
        // Invest partial amount
        vm.prank(investor1);
        project.invest{value: fundingGoal / 2}();

        // Move time forward
        vm.warp(block.timestamp + duration + 1);

        // Mark project as failed
        project.checkAndUpdateState();

        // Balance before refund
        uint256 investorBalanceBefore = investor1.balance;

        // Claim refund
        vm.prank(investor1);
        project.claimRefund();

        // Verify refund
        assertEq(investor1.balance, investorBalanceBefore + fundingGoal / 2, "Refund amount incorrect");
        assertEq(project.getInvestmentAmount(investor1), 0, "Investment should be reset after refund");
    }

    function testNoRefundOnFlexibleFunding() public {
        // Deploy a flexible funding project
        bytes memory data = abi.encodeWithSelector(
            Project.initialize.selector,
            creator,
            "Flexible Project",
            "A flexible funding project",
            fundingGoal,
            duration,
            true, // flexible funding
            platformFee,
            treasury,
            oracle,
            registry,
            new address[](0)
        );

        ERC1967Proxy flexibleProxy = new ERC1967Proxy(address(implementation), data);
        Project flexibleProject = Project(payable(address(flexibleProxy)));

        // Invest less than goal
        vm.prank(investor1);
        flexibleProject.invest{value: fundingGoal / 2}();

        // Move time forward and mark project as successful
        vm.warp(block.timestamp + duration + 1);
        flexibleProject.checkAndUpdateState();

        // Try to claim refund
        vm.prank(investor1);
        vm.expectRevert("Refunds not available");
        flexibleProject.claimRefund();
    }

    function testProjectCancellation() public {
        // Invest in project
        vm.prank(investor1);
        project.invest{value: 1 ether}();

        // Cancel project
        vm.prank(creator);
        vm.expectEmit(true, false, false, false);
        emit ProjectStateChanged(uint256(3));

        project.cancelProject();

        // Verify state
        (,,,,,, Project.State projectState,) = project.getProjectDetails();
        assertEq(uint256(projectState), uint256(3), "Project should be Cancelled");

        // Try to invest after cancellation
        vm.prank(investor2);
        vm.expectRevert("Project not active");
        project.invest{value: 1 ether}();

        // Claim refund after cancellation
        uint256 investorBalanceBefore = investor1.balance;

        vm.prank(investor1);
        project.claimRefund();

        assertEq(investor1.balance, investorBalanceBefore + 1 ether, "Refund after cancellation incorrect");
    }

    function testUpgrade() public {
        // Invest in project
        vm.prank(investor1);
        project.invest{value: 1 ether}();

        // Deploy new implementation
        Project newImplementation = new Project();

        // Upgrade
        vm.startPrank(creator);
        project.upgradeToAndCall(address(newImplementation), "");
        vm.stopPrank();

        // Verify state preserved
        assertEq(project.getInvestmentAmount(investor1), 1 ether, "Investment record should be preserved");

        // Verify functionality after upgrade
        vm.prank(investor2);
        project.invest{value: 2 ether}();

        assertEq(project.getInvestmentAmount(investor2), 2 ether, "New investment should work after upgrade");
    }
}
