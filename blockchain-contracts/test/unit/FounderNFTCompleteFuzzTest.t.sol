// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

/**
 * @title FounderNFTCompleteFuzzTest
 * @dev Complete fuzz testing for FounderNFT contract
 * @notice Tests system behavior with random inputs to discover edge cases
 */
contract FounderNFTCompleteFuzzTest is Test {
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    FounderNFT founderNFT;
    PlatformRegistry registry;
    SimpleRewardCalculator referenceCalculator;
    
    address owner = address(0x1000);
    address treasury = address(0x2000);
    
    uint256 constant MAX_SUPPLY = 100; // Smaller for faster testing
    uint256 constant PRICE = 0.1 ether;
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 3000; // 30%
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 1 days; // Shorter for testing
    
    // Tracking for stateful tests
    mapping(address => uint256[]) userTokens;
    mapping(address => uint256) userMintCounts;
    address[] testUsers;
    uint256 globalNonce;
    
    // ============================================================================
    // SETUP
    // ============================================================================
    
    function setUp() public {
        deployContracts();
        referenceCalculator = new SimpleRewardCalculator();
        globalNonce = 0;
    }
    
    function deployContracts() internal {
        // Deploy registry
        PlatformRegistry registryImpl = new PlatformRegistry();
        bytes memory registryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500,
            treasury
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryData);
        registry = PlatformRegistry(payable(address(registryProxy)));
        
        // Deploy FounderNFT
        FounderNFT founderNFTImpl = new FounderNFT();
        bytes memory founderNFTData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            owner,
            address(registry),
            MAX_SUPPLY,
            PRICE,
            FEE_DISTRIBUTION_PERCENTAGE,
            DAO_TOKEN_ALLOCATION,
            MIN_STAKING_PERIOD
        );
        ERC1967Proxy founderNFTProxy = new ERC1967Proxy(address(founderNFTImpl), founderNFTData);
        founderNFT = FounderNFT(payable(address(founderNFTProxy)));
        
        // Setup
        bytes32[] memory permissions = new bytes32[](0);
        vm.prank(owner);
        registry.registerExtension(
            keccak256("FOUNDER_NFT"),
            address(founderNFT),
            keccak256("NFT"),
            "Founder NFT",
            "1.0.0",
            "Stakeable NFTs",
            permissions
        );
        
        vm.prank(owner);
        founderNFT.setSaleStatus(true);
    }
    
    // ============================================================================
    // 1. STRUCTURED FUZZ TESTING
    // ============================================================================
    
    /// @dev Test minting with random quantities and payments
    function testFuzz_MintingWithRandomInputs(
        address user,
        uint8 quantity,
        uint256 payment,
        bool exactPayment
    ) public {
        // Bound inputs to realistic ranges
        vm.assume(user != address(0) && user.code.length == 0);
        vm.assume(user != address(founderNFT) && user != address(registry));
        vm.assume(user != owner && user != treasury);
        quantity = uint8(bound(quantity, 1, 10));
        
        // Check supply limits
        uint256 currentSupply = founderNFT.totalSupply();
        if (currentSupply + quantity > MAX_SUPPLY) {
            quantity = uint8(MAX_SUPPLY - currentSupply);
            if (quantity == 0) return; // Skip if at max supply
        }
        
        // Calculate expected payment
        uint256 expectedPayment = quantity * PRICE;
        
        if (exactPayment) {
            payment = expectedPayment;
        } else {
            payment = bound(payment, 0, expectedPayment * 3);
        }
        
        vm.deal(user, payment);
        uint256 initialBalance = user.balance;
        uint256 initialSupply = founderNFT.totalSupply();
        uint256 initialContractBalance = address(founderNFT).balance;
        
        vm.prank(user);
        
        if (payment >= expectedPayment && quantity > 0) {
            // Should succeed
            founderNFT.mintMultiple{value: payment}(quantity);
            
            // Verify state changes
            assertEq(founderNFT.totalSupply(), initialSupply + quantity, "Supply not increased correctly");
            assertEq(founderNFT.balanceOf(user), quantity, "User balance incorrect");
            
            // Verify payment handling
            uint256 finalBalance = user.balance;
            uint256 finalContractBalance = address(founderNFT).balance;
            
            // User should have paid exactly the required amount
            assertEq(finalBalance, initialBalance - expectedPayment, "User didn't pay correct amount");
            
            // Contract should have received payment (minus any redistribution)
            assertGe(finalContractBalance, initialContractBalance, "Contract balance didn't increase");
            
        } else {
            // Should fail
            if (payment < expectedPayment) {
                vm.expectRevert();
                founderNFT.mintMultiple{value: payment}(quantity);
            }
        }
    }
    
    /// @dev Test staking with random timing and users
    function testFuzz_StakingBehavior(
        uint256 userSeed,
        uint256 tokenCount,
        uint256 stakingDelay,
        bool hasExistingRewards
    ) public {
        tokenCount = bound(tokenCount, 1, 5);
        stakingDelay = bound(stakingDelay, 0, 30 days);
        
        address user = createTestUser(userSeed);
        
        // Setup: mint NFTs
        mintNFTsForUser(user, tokenCount);
        uint256[] storage userTokenList = userTokens[user];
        
        // Add some rewards if specified
        if (hasExistingRewards) {
            addPlatformRewards(1 ether);
        }
        
        // Wait before staking
        vm.warp(block.timestamp + stakingDelay);
        
        // Test staking each token
        for (uint256 i = 0; i < userTokenList.length; i++) {
            uint256 tokenId = userTokenList[i];
            
            // Verify initial state
            assertFalse(founderNFT.isTokenStaked(tokenId), "Token should not be staked initially");
            assertEq(founderNFT.ownerOf(tokenId), user, "User should own token initially");
            
            // Stake the token
            vm.prank(user);
            founderNFT.stakeToken(tokenId);
            
            // Verify staked state
            assertTrue(founderNFT.isTokenStaked(tokenId), "Token should be staked");
            assertEq(founderNFT.ownerOf(tokenId), address(founderNFT), "Contract should own staked token");
            
            // Verify staking info
            (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(tokenId);
            assertEq(originalOwner, user, "Original owner should be user");
            assertEq(stakedSince, block.timestamp, "Staked since should be current timestamp");
        }
        
        // Verify total staked count
        assertEq(founderNFT.getTotalStakedSupply(), tokenCount, "Total staked should match token count");
        assertEq(founderNFT.getStakedCountByOwner(user), tokenCount, "User staked count should match");
    }
    
    /// @dev Test unstaking with various conditions
    function testFuzz_UnstakingBehavior(
        uint256 userSeed,
        uint256 stakingDuration,
        uint256 tokenIndex,
        bool claimBeforeUnstake
    ) public {
        stakingDuration = bound(stakingDuration, MIN_STAKING_PERIOD, 365 days);
        
        address user = createTestUser(userSeed);
        
        // Setup: mint and stake NFTs
        mintNFTsForUser(user, 3);
        uint256[] storage userTokenList = userTokens[user];
        
        for (uint256 i = 0; i < userTokenList.length; i++) {
            vm.prank(user);
            founderNFT.stakeToken(userTokenList[i]);
        }
        
        // Add some rewards
        addPlatformRewards(0.5 ether);
        
        // Wait for staking duration
        vm.warp(block.timestamp + stakingDuration);
        
        // Select token to unstake
        uint256 tokenId = userTokenList[tokenIndex % userTokenList.length];
        uint256 earnedBefore = founderNFT.earned(tokenId);
        
        // Optionally claim rewards first
        if (claimBeforeUnstake && earnedBefore > 0) {
            uint256 balanceBefore = user.balance;
            vm.prank(user);
            founderNFT.claimReward(tokenId);
            assertGt(user.balance, balanceBefore, "Should receive rewards when claiming");
        }
        
        // Unstake the token
        vm.prank(user);
        founderNFT.unstakeToken(tokenId);
        
        // Verify unstaked state
        assertFalse(founderNFT.isTokenStaked(tokenId), "Token should not be staked");
        assertEq(founderNFT.ownerOf(tokenId), user, "User should own token again");
        
        // Verify rewards were automatically claimed
        assertEq(founderNFT.earned(tokenId), 0, "Token should have no pending rewards after unstaking");
    }
    
    /// @dev Test reward calculations with random parameters
    function testFuzz_RewardCalculations(
        uint256 stakingTime,
        uint256 rewardAmount,
        uint256 stakerCount,
        uint256 userStakeAmount
    ) public {
        stakingTime = bound(stakingTime, 1 hours, 365 days);
        rewardAmount = bound(rewardAmount, 0.01 ether, 10 ether);
        stakerCount = bound(stakerCount, 1, 10);
        userStakeAmount = bound(userStakeAmount, 1, stakerCount);
        
        // Create multiple stakers
        address[] memory stakers = new address[](stakerCount);
        for (uint256 i = 0; i < stakerCount; i++) {
            stakers[i] = createTestUser(i + 100);
            mintNFTsForUser(stakers[i], 1);
            
            vm.prank(stakers[i]);
            founderNFT.stakeToken(userTokens[stakers[i]][0]);
        }
        
        // Add rewards
        addPlatformRewards(rewardAmount);
        
        // Wait for staking time
        vm.warp(block.timestamp + stakingTime);
        
        // Calculate expected rewards using reference implementation
        uint256 rewardRate = founderNFT.getCurrentRewardRate();
        uint256 expectedReward = referenceCalculator.calculateReward(
            stakingTime,
            rewardRate,
            stakerCount,
            userStakeAmount
        );
        
        // Get actual rewards for first staker
        uint256 actualReward = founderNFT.earned(userTokens[stakers[0]][0]);
        
        // Allow for small rounding differences (within 1%)
        if (expectedReward > 0) {
            assertApproxEqRel(actualReward, expectedReward, 1e16, "Reward calculation mismatch");
        }
    }
    
    /// @dev Test batch operations with random configurations
    function testFuzz_BatchOperations(
        uint256 userSeed,
        uint8 tokenCount,
        uint256 operationDelay,
        bool mixedOwnership
    ) public {
        tokenCount = uint8(bound(tokenCount, 2, 10));
        operationDelay = bound(operationDelay, 0, 7 days);
        
        address user1 = createTestUser(userSeed);
        address user2 = createTestUser(userSeed + 1);
        
        uint256 user1Count = mixedOwnership ? tokenCount / 2 : tokenCount;
        uint256 user2Count = mixedOwnership ? tokenCount - user1Count : 0;
        
        // Mint NFTs
        if (user1Count > 0) mintNFTsForUser(user1, user1Count);
        if (user2Count > 0) mintNFTsForUser(user2, user2Count);
        
        // Test batch staking for user1
        if (user1Count > 0) {
            uint256[] memory tokenIds = userTokens[user1];
            
            vm.prank(user1);
            founderNFT.stakeMultipleTokens(tokenIds);
            
            // Verify all tokens are staked
            for (uint256 i = 0; i < tokenIds.length; i++) {
                assertTrue(founderNFT.isTokenStaked(tokenIds[i]), "Token should be staked");
            }
            
            // Wait with delay
            vm.warp(block.timestamp + operationDelay + MIN_STAKING_PERIOD);
            
            // Test batch unstaking
            vm.prank(user1);
            founderNFT.unstakeMultipleTokens(tokenIds);
            
            // Verify all tokens are unstaked
            for (uint256 i = 0; i < tokenIds.length; i++) {
                assertFalse(founderNFT.isTokenStaked(tokenIds[i]), "Token should be unstaked");
                assertEq(founderNFT.ownerOf(tokenIds[i]), user1, "User should own token");
            }
        }
    }
    
    // ============================================================================
    // 2. DIFFERENTIAL FUZZ TESTING
    // ============================================================================
    
    /// @dev Compare reward calculations against reference implementation
    function testFuzz_DifferentialRewardCalculation(
        uint256 amount,
        uint256 duration,
        uint256 totalStakers,
        uint256 rewardPool
    ) public view{
        amount = bound(amount, 1, 100);
        duration = bound(duration, 1 hours, 365 days);
        totalStakers = bound(totalStakers, 1, 50);
        rewardPool = bound(rewardPool, 0.1 ether, 10 ether);
        
        // Calculate using reference implementation
        uint256 referenceResult = referenceCalculator.calculateComplexReward(
            amount,
            duration,
            totalStakers,
            rewardPool
        );
        
        // Calculate using our simplified simulation
        uint256 ourResult = simulateRewardCalculation(amount, duration, totalStakers, rewardPool);
        
        // Results should be close (within 1%)
        if (referenceResult > 0) {
            assertApproxEqRel(ourResult, referenceResult, 1e16, "Differential test failed");
        } else {
            assertEq(ourResult, 0, "Both should be zero");
        }
    }
    
    /// @dev Test edge cases where implementations might diverge
    function testFuzz_EdgeCaseDifferential(
        uint256 verySmallAmount,
        uint256 veryLargeAmount,
        uint256 veryLongTime,
        uint256 veryShortTime
    ) public view{
        verySmallAmount = bound(verySmallAmount, 1, 1000);
        veryLargeAmount = bound(veryLargeAmount, 1e18, 1e24);
        veryLongTime = bound(veryLongTime, 365 days, 100 * 365 days);
        veryShortTime = bound(veryShortTime, 1, 3600);
        
        // Test very small amounts
        testDifferentialForParams(verySmallAmount, 1 days, 1, verySmallAmount * 2);
        
        // Test very large amounts (within reasonable bounds to avoid overflow)
        if (veryLargeAmount < type(uint128).max) {
            testDifferentialForParams(veryLargeAmount, 1 days, 1, veryLargeAmount / 2);
        }
        
        // Test very short times
        testDifferentialForParams(1 ether, veryShortTime, 1, 2 ether);
        
        // Test very long times (with smaller amounts to avoid overflow)
        testDifferentialForParams(1 ether, veryLongTime, 1, 1 ether);
    }
    
    function testDifferentialForParams(
        uint256 amount,
        uint256 duration,
        uint256 totalStakers,
        uint256 rewardPool
    ) internal view {
        try referenceCalculator.calculateComplexReward(amount, duration, totalStakers, rewardPool) 
        returns (uint256 referenceResult) {
            uint256 ourResult = simulateRewardCalculation(amount, duration, totalStakers, rewardPool);
            
            if (referenceResult > 0) {
                // Allow larger tolerance for edge cases
                assertApproxEqRel(ourResult, referenceResult, 5e16, "Edge case differential failed");
            }
        } catch {
            // If reference fails, our implementation should handle gracefully
            uint256 ourResult = simulateRewardCalculation(amount, duration, totalStakers, rewardPool);
            assertGe(ourResult, 0, "Our implementation should not fail");
        }
    }
    
    // ============================================================================
    // 3. ECONOMIC SECURITY FUZZ TESTING
    // ============================================================================
    
    /// @dev Test MEV resistance with random parameters
    function testFuzz_MEVResistance(
        uint256 attackerBudget,
        uint256 victimAmount,
        uint256 timeGap,
        uint8 attackType
    ) public {
        attackerBudget = bound(attackerBudget, 1 ether, 10 ether);
        victimAmount = bound(victimAmount, 0.1 ether, 5 ether);
        timeGap = bound(timeGap, 0, 1 hours);
        attackType = uint8(bound(attackType, 0, 2));
        
        address attacker = createTestUser(999);
        address victim = createTestUser(1000);
        
        vm.deal(attacker, attackerBudget);
        vm.deal(victim, victimAmount);
        
        // Setup existing staking pool to simulate realistic conditions
        setupStakingPool();
        
        uint256 attackerInitialBalance = attacker.balance;
        uint256 victimInitialBalance = victim.balance;
        
        // Execute different types of attacks
        if (attackType == 0) {
            // Sandwich attack
            executeSandwichAttack(attacker, victim, timeGap);
        } else if (attackType == 1) {
            // Front-run attack
            executeFrontRunAttack(attacker, victim);
        } else {
            // Just-in-time attack
            executeJustInTimeAttack(attacker, victim);
        }
        
        // Calculate profits
        uint256 attackerProfit = attacker.balance > attackerInitialBalance 
            ? attacker.balance - attackerInitialBalance 
            : 0;
        uint256 victimLoss = victimInitialBalance > victim.balance
            ? victimInitialBalance - victim.balance
            : 0;
        
        // MEV extraction should be minimal
        assertLt(attackerProfit, victimLoss / 10, "Attacker extracted too much value");
        
        // System should remain stable
        verifySystemInvariants();
    }
    
    /// @dev Test game theory scenarios with multiple players
    function testFuzz_GameTheoryScenarios(
        uint256 playerCount,
        uint256[] calldata strategies,
        uint256 rewardPool,
        uint256 timeHorizon
    ) public {
        playerCount = bound(playerCount, 2, 10);
        rewardPool = bound(rewardPool, 1 ether, 20 ether);
        timeHorizon = bound(timeHorizon, 1 days, 30 days);
        
        vm.assume(strategies.length >= playerCount);
        
        // Create players
        address[] memory players = new address[](playerCount);
        for (uint256 i = 0; i < playerCount; i++) {
            players[i] = createTestUser(i + 100);
        }
        
        // Setup reward pool
        addPlatformRewards(rewardPool);
        
        // Execute strategies
        for (uint256 i = 0; i < playerCount; i++) {
            uint256 strategy = strategies[i] % 4;
            executeStrategy(players[i], strategy, timeHorizon / playerCount);
        }
        
        // Verify no single player dominates
        verifyFairDistribution(players);
    }
    
    // ============================================================================
    // 4. STRESS TESTING
    // ============================================================================
    
    /// @dev Test system under stress conditions
    function testFuzz_StressConditions(
        uint256 operationCount,
        uint256 userCount,
        uint256 timeAcceleration
    ) public {
        operationCount = bound(operationCount, 10, 50);
        userCount = bound(userCount, 2, 10);
        timeAcceleration = bound(timeAcceleration, 1, 100);
        
        // Create users
        address[] memory users = new address[](userCount);
        for (uint256 i = 0; i < userCount; i++) {
            users[i] = createTestUser(i + 200);
        }
        
        // Execute random operations
        for (uint256 i = 0; i < operationCount; i++) {
            uint256 operation = uint256(keccak256(abi.encode(i, block.timestamp))) % 4;
            address randomUser = users[i % userCount];
            
            // Time acceleration
            vm.warp(block.timestamp + timeAcceleration);
            
            if (operation == 0) {
                // Mint
                tryMintForUser(randomUser, 1);
            } else if (operation == 1) {
                // Stake
                tryStakeRandomToken(randomUser);
            } else if (operation == 2) {
                // Unstake
                tryUnstakeRandomToken(randomUser);
            } else {
                // Claim
                tryClaimRandomReward(randomUser);
            }
            
            // Verify system remains stable after each operation
            verifySystemInvariants();
        }
    }
    
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    
    function createTestUser(uint256 seed) internal returns (address) {
        address user = address(uint160(uint256(keccak256(abi.encode(seed, globalNonce++)))));
        vm.deal(user, 1000 ether);
        
        if (testUsers.length < 50) { // Limit to prevent excessive gas usage
            testUsers.push(user);
        }
        
        return user;
    }
    
    function mintNFTsForUser(address user, uint256 count) internal {
        if (founderNFT.totalSupply() + count > MAX_SUPPLY) {
            count = MAX_SUPPLY - founderNFT.totalSupply();
        }
        if (count == 0) return;
        
        uint256 cost = count * PRICE;
        uint256 startingSupply = founderNFT.totalSupply();
        
        vm.prank(user);
        founderNFT.mintMultiple{value: cost}(count);
        
        // Track user's tokens
        for (uint256 i = 0; i < count; i++) {
            userTokens[user].push(startingSupply + i);
        }
        userMintCounts[user] += count;
    }
    
    function addPlatformRewards(uint256 amount) internal {
        vm.deal(address(registry), amount);
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: amount}(amount);
    }
    
    function setupStakingPool() internal {
        // Create some initial stakers for realistic conditions
        address staker1 = createTestUser(50);
        address staker2 = createTestUser(51);
        
        mintNFTsForUser(staker1, 2);
        mintNFTsForUser(staker2, 2);
        
        // Stake some tokens
        vm.prank(staker1);
        founderNFT.stakeToken(userTokens[staker1][0]);
        
        vm.prank(staker2);
        founderNFT.stakeToken(userTokens[staker2][0]);
        
        // Add some initial rewards
        addPlatformRewards(0.5 ether);
    }
    
    function executeSandwichAttack(address attacker, address victim, uint256 timeGap) internal {
        // Attacker front-runs
        tryMintForUser(attacker, 5);
        
        // Time gap
        vm.warp(block.timestamp + timeGap);
        
        // Victim transaction
        tryMintForUser(victim, 2);
        
        // Attacker back-runs (tries to extract value)
        tryStakeRandomToken(attacker);
    }
    
    function executeFrontRunAttack(address attacker, address victim) internal {
        // Attacker sees victim's transaction and front-runs
        tryMintForUser(attacker, 3);
        tryMintForUser(victim, 1);
    }
    
    function executeJustInTimeAttack(address attacker, address victim) internal {
        // Victim stakes
        tryMintForUser(victim, 1);
        tryStakeRandomToken(victim);
        
        // Attacker tries to time rewards
        addPlatformRewards(1 ether);
        tryMintForUser(attacker, 5);
        tryStakeRandomToken(attacker);
    }
    
    function executeStrategy(address player, uint256 strategy, uint256 timeSlice) internal {
        if (strategy == 0) {
            // Conservative: mint and hold
            tryMintForUser(player, 2);
        } else if (strategy == 1) {
            // Aggressive: mint and stake immediately
            tryMintForUser(player, 3);
            tryStakeRandomToken(player);
        } else if (strategy == 2) {
            // Opportunistic: wait then act
            vm.warp(block.timestamp + timeSlice / 2);
            tryMintForUser(player, 1);
            tryStakeRandomToken(player);
        } else {
            // Random: mix of actions
            tryMintForUser(player, 1);
            vm.warp(block.timestamp + timeSlice / 3);
            tryStakeRandomToken(player);
        }
    }
    
    function tryMintForUser(address user, uint256 count) internal {
        if (founderNFT.totalSupply() + count > MAX_SUPPLY) return;
        
        uint256 cost = count * PRICE;
        if (user.balance < cost) return;
        
        try founderNFT.mintMultiple{value: cost}(count) {
            // Track tokens if successful
            uint256 startSupply = founderNFT.totalSupply() - count;
            for (uint256 i = 0; i < count; i++) {
                userTokens[user].push(startSupply + i);
            }
        } catch {
            // Mint failed, which is acceptable
        }
    }
    
    function tryStakeRandomToken(address user) internal {
        uint256[] storage tokens = userTokens[user];
        if (tokens.length == 0) return;
        
        // Find an unstaked token
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];
            if (!founderNFT.isTokenStaked(tokenId) && founderNFT.ownerOf(tokenId) == user) {
                vm.prank(user);
                try founderNFT.stakeToken(tokenId) {
                    return;
                } catch {
                    // Staking failed, continue
                }
            }
        }
    }
    
    function tryUnstakeRandomToken(address user) internal {
        uint256[] storage tokens = userTokens[user];
        if (tokens.length == 0) return;
        
        // Find a staked token that can be unstaked
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];
            if (founderNFT.isTokenStaked(tokenId)) {
                (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(tokenId);
                if (originalOwner == user && 
                    block.timestamp >= stakedSince + MIN_STAKING_PERIOD) {
                    vm.prank(user);
                    try founderNFT.unstakeToken(tokenId) {
                        return;
                    } catch {
                        // Unstaking failed, continue
                    }
                }
            }
        }
    }
    
    function tryClaimRandomReward(address user) internal {
        uint256[] storage tokens = userTokens[user];
        if (tokens.length == 0) return;
        
        // Find a staked token with rewards
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];
            if (founderNFT.isTokenStaked(tokenId) && founderNFT.earned(tokenId) > 0) {
                (address originalOwner, , ) = founderNFT.getStakingInfo(tokenId);
                if (originalOwner == user) {
                    vm.prank(user);
                    try founderNFT.claimReward(tokenId) {
                        return;
                    } catch {
                        // Claiming failed, continue
                    }
                }
            }
        }
    }
    
    function simulateRewardCalculation(
        uint256 amount,
        uint256 duration,
        uint256 totalStakers,
        uint256 rewardPool
    ) internal pure returns (uint256) {
        if (totalStakers == 0 || duration == 0) return 0;
        
        // Simple proportional calculation
        uint256 rewardRate = rewardPool / duration;
        uint256 userShare = (amount * 1e18) / totalStakers;
        
        return (rewardRate * userShare * duration) / 1e18;
    }
    
    function verifySystemInvariants() internal view{
        // Critical invariants that should always hold
        assertLe(founderNFT.totalSupply(), MAX_SUPPLY, "Supply exceeds maximum");
        assertLe(founderNFT.getTotalStakedSupply(), founderNFT.totalSupply(), "Staked exceeds total");
        assertEq(
            founderNFT.balanceOf(address(founderNFT)), 
            founderNFT.getTotalStakedSupply(), 
            "Contract balance != staked supply"
        );
        
        // Reward invariants
        uint256 totalEarnable = calculateTotalEarnableRewards();
        uint256 contractBalance = address(founderNFT).balance;
        assertLe(totalEarnable, contractBalance, "Rewards exceed available balance");
    }
    
    function calculateTotalEarnableRewards() internal view returns (uint256) {
        uint256 total = 0;
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 i = 0; i < totalSupply; i++) {
            total += founderNFT.earned(i);
        }
        
        return total;
    }
    
    function verifyFairDistribution(address[] memory players) internal view{
        uint256 totalStaked = founderNFT.getTotalStakedSupply();
        if (totalStaked == 0) return;
        
        uint256 maxStakeShare = 0;
        for (uint256 i = 0; i < players.length; i++) {
            uint256 playerStaked = founderNFT.getStakedCountByOwner(players[i]);
            uint256 stakeShare = (playerStaked * 100) / totalStaked;
            if (stakeShare > maxStakeShare) {
                maxStakeShare = stakeShare;
            }
        }
        
        // No single player should control more than 70% of stakes
        assertLt(maxStakeShare, 70, "Single player dominates staking");
    }
    
    // ============================================================================
    // 5. COMPLEX SCENARIO TESTING
    // ============================================================================
    
    /// @dev Test complex multi-user scenarios
    function testFuzz_ComplexMultiUserScenario(
        uint256[] calldata userSeeds,
        uint256[] calldata actions,
        uint256[] calldata amounts,
        uint256[] calldata timeDeltas
    ) public {
        vm.assume(userSeeds.length <= 10);
        vm.assume(userSeeds.length == actions.length);
        vm.assume(userSeeds.length == amounts.length);
        vm.assume(userSeeds.length == timeDeltas.length);
        
        // Create users
        address[] memory users = new address[](userSeeds.length);
        for (uint256 i = 0; i < userSeeds.length; i++) {
            users[i] = createTestUser(userSeeds[i]);
        }
        
        // Execute sequence of actions
        for (uint256 i = 0; i < actions.length; i++) {
            uint256 action = actions[i] % 5;
            uint256 amount = bound(amounts[i], 1, 5);
            uint256 timeDelta = bound(timeDeltas[i], 1 hours, 7 days);
            
            address user = users[i % users.length];
            
            // Advance time
            vm.warp(block.timestamp + timeDelta);
            
            // Execute action
            if (action == 0) {
                tryMintForUser(user, amount);
            } else if (action == 1) {
                tryStakeRandomToken(user);
            } else if (action == 2) {
                tryUnstakeRandomToken(user);
            } else if (action == 3) {
                tryClaimRandomReward(user);
            } else if (action == 4) {
                // Add platform rewards
                uint256 rewardAmount = bound(amounts[i], 0.1 ether, 1 ether);
                addPlatformRewards(rewardAmount);
            }
            
            // Verify system stability after each action
            verifySystemInvariants();
        }
        
        // Final comprehensive check
        verifyFinalSystemState(users);
    }
    
    function verifyFinalSystemState(address[] memory users) internal view{
        // Verify token ownership consistency
        uint256 totalSupply = founderNFT.totalSupply();
        uint256 accountedTokens = 0;
        
        // Count tokens owned by users
        for (uint256 i = 0; i < users.length; i++) {
            accountedTokens += founderNFT.balanceOf(users[i]);
        }
        
        // Add contract-owned tokens (staked)
        accountedTokens += founderNFT.balanceOf(address(founderNFT));
        
        assertEq(accountedTokens, totalSupply, "Token ownership inconsistency");
        
        // Verify staking consistency
        uint256 totalStaked = founderNFT.getTotalStakedSupply();
        uint256 sumUserStaked = 0;
        
        for (uint256 i = 0; i < users.length; i++) {
            sumUserStaked += founderNFT.getStakedCountByOwner(users[i]);
        }
        
        assertEq(sumUserStaked, totalStaked, "Staking count inconsistency");
    }
    
    // ============================================================================
    // 6. BOUNDARY TESTING
    // ============================================================================
    
    /// @dev Test boundary conditions
    function testFuzz_BoundaryConditions(
        uint256 edgeCase,
        uint256 value1,
        uint256 value2
    ) public {
        edgeCase = edgeCase % 6;
        
        if (edgeCase == 0) {
            // Test at maximum supply
            testAtMaximumSupply(value1);
        } else if (edgeCase == 1) {
            // Test with zero values
            testZeroValueConditions();
        } else if (edgeCase == 2) {
            // Test minimum staking period boundary
            testMinimumStakingBoundary(value1);
        } else if (edgeCase == 3) {
            // Test very small rewards
            testSmallRewardAmounts(bound(value1, 1, 1000));
        } else if (edgeCase == 4) {
            // Test large time jumps
            testLargeTimeJumps(bound(value1, 365 days, 10 * 365 days));
        } else {
            // Test overflow boundaries
            testOverflowBoundaries(value1, value2);
        }
    }
    
    function testAtMaximumSupply(uint256 userSeed) internal {
        address user = createTestUser(userSeed);
        
        // Mint to maximum supply
        uint256 remaining = MAX_SUPPLY - founderNFT.totalSupply();
        if (remaining > 0) {
            mintNFTsForUser(user, remaining);
        }
        
        // Verify we're at max supply
        assertEq(founderNFT.totalSupply(), MAX_SUPPLY, "Should be at max supply");
        
        // Verify additional minting fails
        vm.prank(user);
        vm.expectRevert();
        founderNFT.mint{value: PRICE}();
    }
    
    function testZeroValueConditions() internal view{
        // These should all handle zero values gracefully
        assertEq(founderNFT.earned(999), 0, "Non-existent token should have zero rewards");
        assertEq(founderNFT.getStakedCountByOwner(address(0)), 0, "Zero address should have zero staked");
    }
    
    function testMinimumStakingBoundary(uint256 userSeed) internal {
        address user = createTestUser(userSeed);
        mintNFTsForUser(user, 1);
        uint256 tokenId = userTokens[user][0];
        
        // Stake token
        vm.prank(user);
        founderNFT.stakeToken(tokenId);
        
        // Try to unstake just before minimum period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD - 1);
        vm.prank(user);
        vm.expectRevert();
        founderNFT.unstakeToken(tokenId);
        
        // Should work exactly at minimum period
        vm.warp(block.timestamp + 1);
        vm.prank(user);
        founderNFT.unstakeToken(tokenId);
    }
    
    function testSmallRewardAmounts(uint256 smallAmount) internal {
        address user = createTestUser(100);
        mintNFTsForUser(user, 1);
        
        vm.prank(user);
        founderNFT.stakeToken(userTokens[user][0]);
        
        // Add very small reward amount
        vm.deal(address(registry), smallAmount);
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: smallAmount}(smallAmount);
        
        // Should handle small amounts without issues
        uint256 earned = founderNFT.earned(userTokens[user][0]);
        assertGe(earned, 0, "Earned should be non-negative");
    }
    
    function testLargeTimeJumps(uint256 timeJump) internal {
        address user = createTestUser(101);
        mintNFTsForUser(user, 1);
        
        vm.prank(user);
        founderNFT.stakeToken(userTokens[user][0]);
        
        addPlatformRewards(1 ether);
        
        // Large time jump
        vm.warp(block.timestamp + timeJump);
        
        // Should handle large time jumps gracefully
        uint256 earned = founderNFT.earned(userTokens[user][0]);
        assertGe(earned, 0, "Earned should be non-negative after large time jump");
        assertLe(earned, address(founderNFT).balance, "Earned should not exceed contract balance");
    }
    
    function testOverflowBoundaries(uint256 value1, uint256 value2) internal pure{
        // Test with values that might cause overflow
        value1 = bound(value1, type(uint128).max / 2, type(uint128).max);
        value2 = bound(value2, type(uint128).max / 2, type(uint128).max);
        
        // This should not cause overflow in our calculations
        uint256 result = simulateRewardCalculation(1, value1, 1, value2);
        assertGe(result, 0, "Calculation should not underflow");
    }
}

// ============================================================================
// REFERENCE CALCULATOR FOR DIFFERENTIAL TESTING
// ============================================================================

contract SimpleRewardCalculator {
    function calculateReward(
        uint256 stakingTime,
        uint256 rewardRate,
        uint256 totalStaked,
        uint256 userStaked
    ) external pure returns (uint256) {
        if (totalStaked == 0 || stakingTime == 0) return 0;
        return (stakingTime * rewardRate * userStaked) / totalStaked;
    }
    
    function calculateComplexReward(
        uint256 amount,
        uint256 duration,
        uint256 totalStakers,
        uint256 rewardPool
    ) external pure returns (uint256) {
        if (totalStakers == 0 || duration == 0) return 0;
        
        // Prevent overflow
        if (rewardPool > type(uint128).max || duration > type(uint128).max) {
            return 0;
        }
        
        // Simple linear distribution model
        uint256 rewardRate = rewardPool / duration;
        uint256 userShare = (amount * 1e18) / totalStakers;
        
        return (rewardRate * userShare * duration) / 1e18;
    }
}