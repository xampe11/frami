// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {FounderNFT, FounderNFTStorage} from "../../src/FounderNFT.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

// Mock platform registry for testing
contract MockPlatformRegistry {
    function isFactoryRegistered(address /*factory*/ ) external pure returns (bool) {
        return true;
    }
}

// Create a contract that can receive both ETH and ERC721 tokens for testing
contract ReceivableUser {
    receive() external payable {}

    function onERC721Received(address, address, uint256, bytes memory) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

contract FounderNFTTest is Test {
    FounderNFT public implementation;
    FounderNFT public founderNFT;
    MockPlatformRegistry public mockRegistry;

    ReceivableUser public user1Contract;
    ReceivableUser public user2Contract;
    ReceivableUser public user3Contract;
    ReceivableUser public platformContract;

    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public platform;

    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant PRICE = 0.1 ether;
    uint256 public constant FEE_DISTRIBUTION_PERCENTAGE = 3000; // 30%
    uint256 public constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 public constant MIN_STAKING_PERIOD = 7 days;
    uint256 public constant WEEK = 7 days;

    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event WeeklyEpochFinalized(uint256 indexed week, uint256 totalRewards, uint256 stakedCount);
    event WeeklyRewardClaimed(address indexed user, uint256 indexed tokenId, uint256 indexed week, uint256 amount);
    event SalesRedistributed(uint256 amount);

    function setUp() public {
        // Create receivable user contracts
        user1Contract = new ReceivableUser();
        user2Contract = new ReceivableUser();
        user3Contract = new ReceivableUser();
        platformContract = new ReceivableUser();

        owner = address(this);
        user1 = address(user1Contract);
        user2 = address(user2Contract);
        user3 = address(user3Contract);
        platform = address(platformContract);

        // Fund accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
        vm.deal(platform, 10 ether);

        // === CHOOSE YOUR APPROACH ===

        // APPROACH 1: Fresh deployment (works with any network)
        deployFreshContractsForTesting();

        // APPROACH 2: Warp to future (for mainnet fork testing)
        // warpToFutureForForkTesting();
    }

    /**
     * @dev Deploy fresh contracts for testing (recommended for unit tests)
     */
    function deployFreshContractsForTesting() internal {
        // Set consistent starting time
        vm.warp(1);

        // Deploy mock registry
        mockRegistry = new MockPlatformRegistry();

        // Deploy implementation
        implementation = new FounderNFT();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            owner,
            address(mockRegistry),
            MAX_SUPPLY,
            PRICE,
            FEE_DISTRIBUTION_PERCENTAGE,
            DAO_TOKEN_ALLOCATION,
            MIN_STAKING_PERIOD
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        founderNFT = FounderNFT(payable(address(proxy)));

        // Grant platform role
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), platform);

        // Activate sale
        founderNFT.setSaleStatus(true);

        console.log("Fresh deployment - Deployment week:", founderNFT.getCurrentWeek());
    }

    /**
     * @dev Warp to future for fork testing (use this if testing with mainnet fork)
     */
    function warpToFutureForForkTesting() internal {
        // Assume founderNFT is already deployed (from fork)
        // Get current week from the forked mainnet timestamp
        uint256 currentMainnetWeek = founderNFT.getCurrentWeek();

        // Warp to a future week (well beyond deployment week)
        uint256 futureWeek = currentMainnetWeek + 10; // 10 weeks in future
        uint256 futureTimestamp = futureWeek * WEEK + 100;

        vm.warp(futureTimestamp);

        console.log("Fork testing - Original week:", currentMainnetWeek);
        console.log("Fork testing - Current week:", founderNFT.getCurrentWeek());
        console.log("Fork testing - Can finalize:", founderNFT.getCurrentWeek() > currentMainnetWeek);
    }

    function testWeeklySystemInitialization() public view {
        assertEq(founderNFT.getCurrentWeek(), block.timestamp / WEEK);
        assertEq(founderNFT.getCurrentWeeklyRewards(), 0);
        assertEq(founderNFT.getSalesRedistributionPercentage(), 1000); // 10%
    }

    function testMintAccumulatesWeeklyRewards() public {
        uint256 expectedRedistribution = (PRICE * 1000) / 10000; // 10%

        // Mint NFT
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Check weekly rewards accumulated
        assertEq(founderNFT.getCurrentWeeklyRewards(), expectedRedistribution);

        // Mint another NFT
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        // Should accumulate
        assertEq(founderNFT.getCurrentWeeklyRewards(), expectedRedistribution * 2);
    }

    function testPlatformFeesAccumulateWeeklyRewards() public {
        uint256 platformFees = 1 ether;

        // Add platform fees
        vm.prank(platform);
        founderNFT.addPlatformFees(platformFees);

        // Should accumulate in weekly rewards
        assertEq(founderNFT.getCurrentWeeklyRewards(), platformFees);
    }

    function testStakingMarksTokenForCurrentWeek() public {
        // Mint and stake
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        uint256 currentWeek = founderNFT.getCurrentWeek();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Check if token is marked as staked for current week
        assertTrue(founderNFT.tokenStakedDuringWeek(currentWeek, 0));
    }

    function testFinalizeWeek() public {
        // Mint and stake to create some rewards and stakers
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();
        vm.prank(user2);
        founderNFT.stakeToken(1);

        uint256 expectedRewards = (PRICE * 1000 * 2) / 10000; // 10% of 2 mints
        uint256 currentWeek = founderNFT.getCurrentWeek();

        // Move to next week
        vm.warp(block.timestamp + WEEK + 1);

        // Finalize the week
        vm.expectEmit(true, false, false, false);
        emit WeeklyEpochFinalized(currentWeek, expectedRewards, 2);
        founderNFT.finalizeWeek();

        // Check week was finalized
        (uint256 rewards, uint256 stakedCount) = founderNFT.getWeekInfo(currentWeek);
        assertEq(rewards, expectedRewards);
        assertEq(stakedCount, 2);

        // Current weekly rewards should reset
        assertEq(founderNFT.getCurrentWeeklyRewards(), 0);
    }

    function testClaimSingleWeekReward() public {
        // Setup: mint, stake, and finalize week
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();
        vm.prank(user2);
        founderNFT.stakeToken(1);

        uint256 expectedRewards = (PRICE * 1000 * 2) / 10000; // 10% of 2 mints
        uint256 weekToFinalize = founderNFT.getCurrentWeek();

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK + 1);
        founderNFT.finalizeWeek();

        // Claim reward for user1
        uint256 user1BalanceBefore = user1.balance;
        uint256 expectedPerUser = expectedRewards / 2; // Split between 2 stakers

        vm.prank(user1);
        vm.expectEmit(true, true, true, false);
        emit WeeklyRewardClaimed(user1, 0, weekToFinalize, expectedPerUser);
        founderNFT.claimWeeklyReward(0, weekToFinalize);

        // Check balance increased
        assertEq(user1.balance - user1BalanceBefore, expectedPerUser);

        // Check user2 can also claim
        uint256 user2BalanceBefore = user2.balance;
        vm.prank(user2);
        founderNFT.claimWeeklyReward(1, weekToFinalize);
        assertEq(user2.balance - user2BalanceBefore, expectedPerUser);
    }

    function testCannotClaimTwiceForSameWeek() public {
        // Setup and finalize week
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        uint256 weekToFinalize = founderNFT.getCurrentWeek();
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        // Claim once
        vm.prank(user1);
        founderNFT.claimWeeklyReward(0, weekToFinalize);

        // Try to claim again - should fail
        vm.prank(user1);
        vm.expectRevert("Already claimed for this week");
        founderNFT.claimWeeklyReward(0, weekToFinalize);
    }

    function testClaimAllWeeklyRewards() public {
        // Week 0: Setup (start at timestamp 1 to avoid edge cases)
        vm.warp(1);

        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        //uint256 week1 = founderNFT.getCurrentWeek();
        uint256 week1Rewards = (PRICE * 1000) / 10000;

        // Move to week 1 and finalize week 0
        vm.warp(WEEK + 100); // Move well into next week
        founderNFT.finalizeWeek();

        // Week 1: Add more rewards
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        //uint256 week2 = founderNFT.getCurrentWeek();
        uint256 week2Rewards = (PRICE * 1000) / 10000;

        // Move to week 2 and finalize week 1
        vm.warp(WEEK * 2 + 100); // Move well into week 2
        founderNFT.finalizeWeek();

        // Claim all weeks at once
        uint256 user1BalanceBefore = user1.balance;
        uint256 expectedTotal = week1Rewards + week2Rewards; // user1 was only staker

        vm.prank(user1);
        founderNFT.claimAllWeeklyRewards(0);

        assertEq(user1.balance - user1BalanceBefore, expectedTotal);
    }

    function testGetClaimableRewardsInfo() public {
        // Setup multiple weeks with rewards
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Week 1 -> Week 2
        vm.warp(WEEK + 100);
        founderNFT.finalizeWeek();

        // Add rewards in week 2
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        // Week 2 -> Week 3
        vm.warp(WEEK * 2 + 100);
        founderNFT.finalizeWeek();

        // Check claimable rewards info
        (uint256 weekCount, uint256 totalAmount) = founderNFT.getClaimableRewardsInfo(0);

        assertEq(weekCount, 2);
        uint256 expectedPerWeek = (PRICE * 1000) / 10000;
        assertEq(totalAmount, expectedPerWeek * 2);
    }

    function testGetWeekReward() public {
        // Setup
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        uint256 weekToFinalize = founderNFT.getCurrentWeek();

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        // Check week reward
        uint256 expectedReward = (PRICE * 1000) / 10000;
        uint256 weekReward = founderNFT.getWeekReward(0, weekToFinalize);

        assertEq(weekReward, expectedReward);
    }

    function testGetWeekRewardForUnstakedToken() public {
        // Setup
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        // Don't stake the token

        uint256 weekToFinalize = founderNFT.getCurrentWeek();

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        // Check week reward should be 0 for unstaked token
        uint256 weekReward = founderNFT.getWeekReward(0, weekToFinalize);

        assertEq(weekReward, 0);
    }

    function testCannotClaimCurrentWeek() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        uint256 currentWeek = founderNFT.getCurrentWeek();

        vm.prank(user1);
        vm.expectRevert("Cannot claim current or future week");
        founderNFT.claimWeeklyReward(0, currentWeek);
    }

    function testCannotClaimUnfinalizedWeek() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        uint256 week1 = founderNFT.getCurrentWeek();

        // Move to next week but don't finalize
        vm.warp(block.timestamp + WEEK);

        vm.prank(user1);
        vm.expectRevert("Week not finalized or no rewards");
        founderNFT.claimWeeklyReward(0, week1);
    }

    function testCannotClaimIfNotStakedDuringWeek() public {
        // Mint but don't stake initially
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        uint256 week1 = founderNFT.getCurrentWeek();

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        // Now stake (after the week)
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Try to claim - should fail because wasn't staked during week1
        vm.prank(user1);
        vm.expectRevert("Token not staked during this week");
        founderNFT.claimWeeklyReward(0, week1);
    }

    function testMultipleStakersEqualDistribution() public {
        // Setup multiple stakers
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();
        vm.prank(user2);
        founderNFT.stakeToken(1);

        vm.prank(user3);
        founderNFT.mint{value: PRICE}();
        vm.prank(user3);
        founderNFT.stakeToken(2);

        uint256 weekToFinalize = founderNFT.getCurrentWeek();
        uint256 totalRewards = (PRICE * 1000 * 3) / 10000; // 10% of 3 mints

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        uint256 expectedPerStaker = totalRewards / 3;

        // All users claim and should get equal amounts
        uint256 user1Before = user1.balance;
        vm.prank(user1);
        founderNFT.claimWeeklyReward(0, weekToFinalize);
        assertEq(user1.balance - user1Before, expectedPerStaker);

        uint256 user2Before = user2.balance;
        vm.prank(user2);
        founderNFT.claimWeeklyReward(1, weekToFinalize);
        assertEq(user2.balance - user2Before, expectedPerStaker);

        uint256 user3Before = user3.balance;
        vm.prank(user3);
        founderNFT.claimWeeklyReward(2, weekToFinalize);
        assertEq(user3.balance - user3Before, expectedPerStaker);
    }

    function testWithdrawExcludesCurrentWeeklyRewards() public {
        // Add some rewards
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        //uint256 expectedRewards = (PRICE * 1000) / 10000;
        //uint256 expectedSalesProceeds = PRICE - expectedRewards;

        // Add extra ETH to contract
        vm.deal(address(founderNFT), address(founderNFT).balance + 1 ether);

        uint256 contractBalance = address(founderNFT).balance;
        uint256 currentWeeklyRewards = founderNFT.getCurrentWeeklyRewards();
        uint256 expectedWithdrawable = contractBalance - currentWeeklyRewards;

        uint256 adminBalanceBefore = address(this).balance;
        founderNFT.withdraw();

        // Should withdraw everything except current weekly rewards
        assertEq(address(this).balance - adminBalanceBefore, expectedWithdrawable);
        assertEq(address(founderNFT).balance, currentWeeklyRewards);
    }

    function testClaimAllWithNoClaimableWeeks() public {
        // Mint and stake but no finalized weeks
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Try to claim all - should revert with no rewards
        vm.prank(user1);
        vm.expectRevert("No rewards to claim");
        founderNFT.claimAllWeeklyRewards(0);
    }

    function testBatchMintNoRedistribution() public {
        uint256 initialRewards = founderNFT.getCurrentWeeklyRewards();

        // Create list of recipients
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        // Batch mint NFTs (admin function, no payment)
        founderNFT.batchMint(recipients);

        // Verify ownership
        assertEq(founderNFT.ownerOf(0), user1);
        assertEq(founderNFT.ownerOf(1), user2);
        assertEq(founderNFT.ownerOf(2), user3);

        // Verify total supply
        assertEq(founderNFT.totalSupply(), 3);

        // Verify no weekly rewards added (batch mint is free)
        assertEq(founderNFT.getCurrentWeeklyRewards(), initialRewards);
    }

    // Receive function to allow contract to receive ETH
    receive() external payable {}
}
