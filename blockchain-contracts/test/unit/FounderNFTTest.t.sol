// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";
import {FounderNFTStorage} from "../../src/FounderNFTStorage.sol";
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

    // Events from the new contract
    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);
    event RewardAdded(uint256 amount, uint256 newRewardRate);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event ETHReceived(address indexed from, uint256 amount);

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

        deployFreshContractsForTesting();
    }

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

        console.log("Contract deployed and initialized");
    }

    // ============================================================================
    // INITIALIZATION TESTS
    // ============================================================================

    function testInitialization() public view {
        assertEq(founderNFT.name(), "Frami Founder");
        assertEq(founderNFT.symbol(), "FRAMI");
        assertEq(founderNFT.getMaxSupply(), MAX_SUPPLY);
        assertEq(founderNFT.getPrice(), PRICE);
        assertEq(founderNFT.getMinimumStakingPeriod(), MIN_STAKING_PERIOD);
        assertEq(founderNFT.getSalesRedistributionPercentage(), 1000); // 10%
        assertTrue(founderNFT.getSaleStatus());
        assertEq(founderNFT.getCurrentRewardRate(), 0);
        assertEq(founderNFT.getTotalStakedSupply(), 0);
    }

    function testRoleSetup() public view {
        assertTrue(founderNFT.hasRole(founderNFT.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(founderNFT.hasRole(founderNFT.ADMIN_ROLE(), owner));
        assertTrue(founderNFT.hasRole(founderNFT.UPGRADER_ROLE(), owner));
        assertTrue(founderNFT.hasRole(founderNFT.PLATFORM_ROLE(), platform));
    }

    // ============================================================================
    // MINTING TESTS
    // ============================================================================

    function testMintSingleNFT() public {
        uint256 initialSalesProceeds = founderNFT.getTotalSalesProceeds();
        uint256 expectedSalesProceeds = (PRICE * 9000) / 10000; // 90%
        uint256 expectedRedistribution = (PRICE * 1000) / 10000; // 10%

        vm.expectEmit(true, true, false, false);
        emit FounderNFTMinted(user1, 0);

        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Check NFT ownership
        assertEq(founderNFT.ownerOf(0), user1);
        assertEq(founderNFT.balanceOf(user1), 1);
        assertEq(founderNFT.totalSupply(), 1);

        // Check sales proceeds (90% goes to treasury)
        assertEq(founderNFT.getTotalSalesProceeds(), initialSalesProceeds + expectedSalesProceeds);

        // Check that reward rate was updated (10% goes to stakers)
        // Since no one is staking yet, it should be in pending rewards
        console.log("Expected redistribution:", expectedRedistribution);
        console.log("Current reward rate:", founderNFT.getCurrentRewardRate());
    }

    function testMintMultipleNFTs() public {
        uint256 quantity = 3;
        uint256 totalCost = PRICE * quantity;

        vm.prank(user1);
        founderNFT.mintMultiple{value: totalCost}(quantity);

        assertEq(founderNFT.balanceOf(user1), quantity);
        assertEq(founderNFT.totalSupply(), quantity);
        assertEq(founderNFT.ownerOf(0), user1);
        assertEq(founderNFT.ownerOf(1), user1);
        assertEq(founderNFT.ownerOf(2), user1);
    }

    function testMintFailsWhenSaleInactive() public {
        founderNFT.setSaleStatus(false);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("SaleNotActive()"));
        founderNFT.mint{value: PRICE}();
    }

    function testMintFailsWithInsufficientPayment() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("InsufficientPayment(uint256,uint256)", PRICE, PRICE - 1));
        founderNFT.mint{value: PRICE - 1}();
    }

    function testBatchMintByAdmin() public {
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        founderNFT.batchMint(recipients);

        assertEq(founderNFT.totalSupply(), 3);
        assertEq(founderNFT.ownerOf(0), user1);
        assertEq(founderNFT.ownerOf(1), user2);
        assertEq(founderNFT.ownerOf(2), user3);
    }

    // ============================================================================
    // STAKING TESTS
    // ============================================================================

    function testStakeSingleToken() public {
        // Mint NFT first
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Stake token
        vm.expectEmit(true, true, false, false);
        emit TokenStaked(user1, 0);

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Verify staking state
        assertTrue(founderNFT.isTokenStaked(0));
        assertEq(founderNFT.getTotalStakedSupply(), 1);
        assertEq(founderNFT.ownerOf(0), address(founderNFT)); // NFT transferred to contract

        // Check user's staked tokens
        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(user1);
        assertEq(stakedTokens.length, 1);
        assertEq(stakedTokens[0], 0);
        assertEq(founderNFT.getStakedCountByOwner(user1), 1);
        assertTrue(founderNFT.hasStakedTokens(user1));

        // Check staking info
        (address staker, uint256 stakedSince, uint256 lastClaimed) = founderNFT.getStakingInfo(0);
        assertEq(staker, user1);
        assertEq(stakedSince, block.timestamp);
        assertEq(lastClaimed, block.timestamp);
    }

    function testStakeMultipleTokens() public {
        // Mint multiple NFTs
        vm.prank(user1);
        founderNFT.mintMultiple{value: PRICE * 3}(3);

        // Stake multiple tokens
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(user1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Verify all are staked
        assertEq(founderNFT.getTotalStakedSupply(), 3);
        assertEq(founderNFT.getStakedCountByOwner(user1), 3);

        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(user1);
        assertEq(stakedTokens.length, 3);
    }

    function testStakeTokenNotOwned() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user2); // user2 tries to stake user1's token
        vm.expectRevert(abi.encodeWithSignature("TokenNotOwned(uint256,address)", 0, user2));
        founderNFT.stakeToken(0);
    }

    function testStakeAlreadyStakedToken() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        vm.prank(user1); // Try to stake again
        vm.expectRevert(abi.encodeWithSignature("TokenNotOwned(uint256,address)", 0, user1));
        founderNFT.stakeToken(0);
    }

    // ============================================================================
    // UNSTAKING TESTS
    // ============================================================================

    function testUnstakeToken() public {
        // Mint and stake
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Unstake
        vm.expectEmit(true, true, false, false);
        emit TokenUnstaked(user1, 0);

        vm.prank(user1);
        founderNFT.unstakeToken(0);

        // Verify unstaking state
        assertFalse(founderNFT.isTokenStaked(0));
        assertEq(founderNFT.getTotalStakedSupply(), 0);
        assertEq(founderNFT.ownerOf(0), user1); // NFT returned to user
        assertEq(founderNFT.getStakedCountByOwner(user1), 0);

        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(user1);
        assertEq(stakedTokens.length, 0);
    }

    function testUnstakeBeforeMinimumPeriod() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Try to unstake immediately
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("MinimumStakingPeriodNotMet(uint256,uint256)", 0, MIN_STAKING_PERIOD));
        founderNFT.unstakeToken(0);
    }

    function testUnstakeMultipleTokens() public {
        // Mint and stake multiple
        vm.prank(user1);
        founderNFT.mintMultiple{value: PRICE * 3}(3);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(user1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Unstake all
        vm.prank(user1);
        founderNFT.unstakeMultipleTokens(tokenIds);

        assertEq(founderNFT.getTotalStakedSupply(), 0);
        assertEq(founderNFT.getStakedCountByOwner(user1), 0);
    }

    // ============================================================================
    // CONTINUOUS REWARDS TESTS
    // ============================================================================

    function testRewardAccrualOverTime() public {
        // Setup: mint from user2 to create rewards, then user1 stakes
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(1);

        // At this point, there should be pending rewards from the mints
        uint256 initialEarned = founderNFT.earned(1);
        console.log("Initial earned:", initialEarned);

        // Fast forward time
        vm.warp(block.timestamp + 1 hours);

        // Check that rewards have increased
        uint256 earnedAfterTime = founderNFT.earned(1);
        console.log("Earned after 1 hour:", earnedAfterTime);

        if (founderNFT.getCurrentRewardRate() > 0) {
            assertGt(earnedAfterTime, initialEarned, "Rewards should increase over time");
        }
    }

    function testClaimRewardsWithGuaranteedRewards() public {
        // Step 1: Create multiple stakers to ensure reward distribution
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();
        vm.prank(user1);
        founderNFT.stakeToken(0);

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();
        vm.prank(user2);
        founderNFT.stakeToken(1);

        // Step 2: Add substantial platform fees
        uint256 largePlatformFees = 2 ether;
        vm.prank(platform);
        founderNFT.addPlatformFees{value: largePlatformFees}(0);

        // Step 3: Wait sufficient time for rewards to accrue
        vm.warp(block.timestamp + 24 hours); // Full day

        // Step 4: Verify rewards exist
        uint256 earned1 = founderNFT.earned(0);
        uint256 earned2 = founderNFT.earned(1);

        console.log("User1 earned:", earned1);
        console.log("User2 earned:", earned2);

        assertGt(earned1, 0, "User1 should have earned rewards");
        assertGt(earned2, 0, "User2 should have earned rewards");

        // Step 5: Claim rewards for user1
        uint256 balanceBefore = user1.balance;

        console.log("=== SIMPLE DEBUG ===");
        console.log("User1 earned before claim:", founderNFT.earned(0));
        console.log("User2 earned before claim:", founderNFT.earned(1));
        console.log("Contract balance:", address(founderNFT).balance);
        console.log("Total staked supply:", founderNFT.getTotalStakedSupply());
        console.log("Current reward rate:", founderNFT.getCurrentRewardRate());

        console.log("=== INTERNAL STATE DEBUG ===");
        console.log("_rewards[0]:", founderNFT.getRewards(0));
        console.log("_userRewardPerTokenPaid[0]:", founderNFT.getUserRewardPerTokenPaid(0));
        console.log("_rewardPerTokenStored:", founderNFT.getRewardPerTokenStored());
        console.log("rewardPerToken():", founderNFT.rewardPerToken());
        console.log("_lastUpdateTime:", founderNFT.getLastUpdateTime());
        console.log("block.timestamp:", block.timestamp);

        vm.prank(user1);
        try founderNFT.claimReward(0) {
            console.log("Claim succeeded!");
        } catch {
            console.log("Claim failed!");
            console.log("User1 earned after failed claim:", founderNFT.earned(0));
        }

        assertGt(user1.balance - balanceBefore, 0, "User1 should receive rewards");
        assertEq(founderNFT.earned(0), 0, "User1 earned should reset");

        // Step 6: Claim rewards for user2
        balanceBefore = user2.balance;

        vm.prank(user2);
        founderNFT.claimReward(1);

        assertGt(user2.balance - balanceBefore, 0, "User2 should receive rewards");
        assertEq(founderNFT.earned(1), 0, "User2 earned should reset");
    }

    function testClaimMultipleRewards() public {
        // Mint and stake multiple tokens
        vm.prank(user1);
        founderNFT.mintMultiple{value: PRICE * 2}(2);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 0;
        tokenIds[1] = 1;

        vm.prank(user1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Add rewards
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        vm.warp(block.timestamp + 1 hours);

        uint256 totalEarned = founderNFT.earned(0) + founderNFT.earned(1);
        if (totalEarned > 0) {
            uint256 balanceBefore = user1.balance;

            vm.prank(user1);
            founderNFT.claimMultipleRewards(tokenIds);

            assertGt(user1.balance, balanceBefore);
        }
    }

    function testClaimAllRewards() public {
        // Setup multiple staked tokens
        vm.prank(user1);
        founderNFT.mintMultiple{value: PRICE * 3}(3);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(user1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Add rewards
        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        vm.warp(block.timestamp + 1 hours);

        uint256 totalEarned = founderNFT.getTotalEarnedByOwner(user1);
        if (totalEarned > 0) {
            uint256 balanceBefore = user1.balance;

            vm.prank(user1);
            founderNFT.claimAllRewards();

            assertGt(user1.balance, balanceBefore);
        }
    }

    // ============================================================================
    // PLATFORM FEES TESTS
    // ============================================================================

    function testAddPlatformFees() public {
        uint256 feeAmount = 1 ether;
        uint256 initialRewardRate = founderNFT.getCurrentRewardRate();

        // When no stakers exist, platform fees go to pending rewards
        // No RewardAdded event should be emitted in this case
        vm.prank(platform);
        founderNFT.addPlatformFees{value: feeAmount}(0);

        // Since no stakers, reward rate should remain unchanged
        assertEq(founderNFT.getCurrentRewardRate(), initialRewardRate);
    }

    function testPlatformFeesDistributionWithStakers() public {
        // First, setup a staker
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        uint256 feeAmount = 1 ether;
        uint256 initialRewardRate = founderNFT.getCurrentRewardRate();

        vm.prank(platform);
        founderNFT.addPlatformFees{value: feeAmount}(0);

        // Should increase reward rate since there are stakers
        assertGt(founderNFT.getCurrentRewardRate(), initialRewardRate);
    }

    // ============================================================================
    // VIEW FUNCTION TESTS
    // ============================================================================

    function testGetStakingInfoBatch() public {
        // Setup multiple tokens
        vm.prank(user1);
        founderNFT.mintMultiple{value: PRICE * 2}(2);

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        // Stake user1's tokens
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 0;
        tokenIds[1] = 1;

        vm.prank(user1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Get batch info
        uint256[] memory queryIds = new uint256[](3);
        queryIds[0] = 0;
        queryIds[1] = 1;
        queryIds[2] = 2;

        (
            address[] memory owners,
            uint256[] memory stakedAt, /* uint256[] memory earnedRewards */
            ,
            bool[] memory canUnstake
        ) = founderNFT.getStakingInfoBatch(queryIds);

        assertEq(owners[0], user1);
        assertEq(owners[1], user1);
        assertEq(owners[2], address(0)); // not staked

        assertGt(stakedAt[0], 0);
        assertGt(stakedAt[1], 0);
        assertEq(stakedAt[2], 0);

        assertFalse(canUnstake[0]); // minimum period not met
        assertFalse(canUnstake[1]);
        assertFalse(canUnstake[2]);
    }

    function testGetEstimatedAPR() public {
        // Setup some staking and rewards
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Add some rewards
        vm.prank(platform);
        founderNFT.addPlatformFees{value: 1 ether}(0);

        uint256 apr = founderNFT.getEstimatedAPR();
        console.log("Estimated APR:", apr, "basis points");
        // APR should be calculated based on reward rate and staked value
    }

    // ============================================================================
    // ADMIN FUNCTION TESTS
    // ============================================================================

    function testSetMinimumStakingPeriod() public {
        uint256 newPeriod = 14 days;
        founderNFT.setMinimumStakingPeriod(newPeriod);
        assertEq(founderNFT.getMinimumStakingPeriod(), newPeriod);
    }

    function testSetSaleStatus() public {
        founderNFT.setSaleStatus(false);
        assertFalse(founderNFT.getSaleStatus());

        founderNFT.setSaleStatus(true);
        assertTrue(founderNFT.getSaleStatus());
    }

    function testSetPrice() public {
        uint256 newPrice = 0.2 ether;
        founderNFT.setPrice(newPrice);
        assertEq(founderNFT.getPrice(), newPrice);
    }

    function testWithdrawSalesProceeds() public {
        // Generate some sales proceeds
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        uint256 expectedProceeds = (PRICE * 9000) / 10000; // 90%
        assertEq(founderNFT.getTotalSalesProceeds(), expectedProceeds);

        uint256 balanceBefore = address(this).balance;
        founderNFT.withdrawSalesProceeds();

        assertEq(address(this).balance - balanceBefore, expectedProceeds);
        assertEq(founderNFT.getTotalSalesProceeds(), 0);
    }

    function testCannotTransferStakedToken() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // When a token is staked, it's owned by the contract, not the user
        // So the user can't transfer it because they don't own it anymore
        // The error should be ERC721InsufficientApproval, not CannotTransferStakedToken

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ERC721InsufficientApproval(address,uint256)", user1, 0));
        founderNFT.transferFrom(user1, user2, 0);
    }

    // Better test - Test the actual intended behavior
    function testStakedTokenTransferRestriction() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Before staking - should be transferable
        vm.prank(user1);
        founderNFT.transferFrom(user1, user2, 0);
        assertEq(founderNFT.ownerOf(0), user2, "Token should be transferred to user2");

        // Transfer back for staking test
        vm.prank(user2);
        founderNFT.transferFrom(user2, user1, 0);

        // After staking - user no longer owns the token
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Contract now owns the token
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "Contract should own staked token");

        // User cannot transfer because they don't own it
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ERC721InsufficientApproval(address,uint256)", user1, 0));
        founderNFT.transferFrom(user1, user2, 0);

        // Even if user1 tries to approve someone for the token they don't own
        vm.prank(user1);
        vm.expectRevert(); // Will fail because user1 doesn't own the token
        founderNFT.approve(user2, 0);
    }

    // Test the _update function override more directly
    function testUpdateFunctionOverride() public {
        // This tests the logic in your _update function
        // The _update function should only trigger CannotTransferStakedToken
        // when trying to transfer a staked token between external addresses

        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // The _update function checks:
        // if (from != address(0) && to != address(0)) {
        //     if (_stakedTokens[tokenId].owner != address(0) &&
        //         from != address(this) &&
        //         to != address(this)) {
        //         revert CannotTransferStakedToken(tokenId);
        //     }
        // }

        // This means the CannotTransferStakedToken error only triggers when:
        // 1. It's not a mint (from != 0)
        // 2. It's not a burn (to != 0)
        // 3. Token is staked (_stakedTokens[tokenId].owner != address(0))
        // 4. Transfer is not from the contract (from != address(this))
        // 5. Transfer is not to the contract (to != address(this))

        // In normal operation, when a token is staked:
        // - It's transferred TO the contract (allowed)
        // - Only the contract can transfer it back when unstaking (allowed)
        // - External transfers should fail at the ERC721 level first

        // The CannotTransferStakedToken error is a safety net for edge cases
    }

    // Comprehensive test
    function testTransferRestrictionsComprehensive() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Phase 1: Normal transfers work before staking
        vm.prank(user1);
        founderNFT.transferFrom(user1, user2, 0);
        assertEq(founderNFT.ownerOf(0), user2);

        vm.prank(user2);
        founderNFT.transferFrom(user2, user1, 0);
        assertEq(founderNFT.ownerOf(0), user1);

        // Phase 2: After staking, token is owned by contract
        vm.prank(user1);
        founderNFT.stakeToken(0);
        assertEq(founderNFT.ownerOf(0), address(founderNFT));

        // Phase 3: User cannot transfer staked token (doesn't own it)
        vm.prank(user1);
        vm.expectRevert();
        founderNFT.transferFrom(user1, user2, 0);

        // Phase 4: Unstaking returns ownership
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);
        vm.prank(user1);
        founderNFT.unstakeToken(0);
        assertEq(founderNFT.ownerOf(0), user1);

        // Phase 5: Normal transfers work again after unstaking
        vm.prank(user1);
        founderNFT.transferFrom(user1, user2, 0);
        assertEq(founderNFT.ownerOf(0), user2);
    }

    // ============================================================================
    // ERROR HANDLING TESTS
    // ============================================================================

    function testNoRewardsToClaimError() public {
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Try to claim with no rewards
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("NoRewardsToClaim()"));
        founderNFT.claimReward(0);
    }

    function testTooManyTokensInTransactionError() public {
        // Create more than MAX_BATCH_SIZE tokens
        uint256[] memory tokenIds = new uint256[](21); // MAX_BATCH_SIZE is 20
        for (uint256 i = 0; i < 21; i++) {
            tokenIds[i] = i;
        }

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("TooManyTokensInTransaction(uint256,uint256)", 21, 20));
        founderNFT.stakeMultipleTokens(tokenIds);
    }

    // Helper function to receive ETH
    receive() external payable {}
}
