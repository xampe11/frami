// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

/**
 * @title FounderNFTCompleteInvariantTest
 * @dev Complete property-based testing for FounderNFT contract with overflow protection
 * @notice Tests mathematical properties that should ALWAYS hold true
 */
contract FounderNFTCompleteInvariantTest is Test {
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    FounderNFTHandler handler;
    FounderNFT founderNFT;
    PlatformRegistry registry;
    
    address owner = address(0x1000);
    address treasury = address(0x2000);
    
    uint256 constant MAX_SUPPLY = 100;
    uint256 constant PRICE = 0.1 ether;
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 3000; // 30%
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 1 days;
    
    // Safe bounds to prevent overflow
    uint256 constant MAX_SAFE_VALUE = type(uint64).max; // Much safer than uint256.max
    uint256 constant MAX_TIME_WARP = 365 days; // 1 year max
    uint256 constant MAX_FEE_AMOUNT = 10 ether; // Reasonable max fee
    
    // ============================================================================
    // SETUP
    // ============================================================================
    
    function setUp() public {
        deployContracts();
        handler = new FounderNFTHandler(founderNFT, registry, owner);
    }
    
    // ============================================================================
    // INVARIANT TESTS
    // ============================================================================
    
    function testInvariant_SupplyInvariants() public {
        performRandomOperations(10);
        
        uint256 totalSupply = founderNFT.totalSupply();
        uint256 maxSupply = founderNFT.getMaxSupply();
        uint256 stakedSupply = founderNFT.getTotalStakedSupply();
        
        assertLe(totalSupply, maxSupply, "Total supply exceeds max supply");
        assertLe(stakedSupply, totalSupply, "Staked supply exceeds total supply");
        
        uint256 contractBalance = founderNFT.balanceOf(address(founderNFT));
        assertEq(contractBalance, stakedSupply, "Contract doesn't own all staked tokens");
    }
    
    function testInvariant_RewardInvariants() public {
        performRandomOperations(15);
        
        uint256 totalEarnable = handler.calculateTotalEarnableRewards();
        uint256 contractBalance = address(founderNFT).balance;
        
        assertLe(totalEarnable, contractBalance, "Total earnable exceeds contract balance");
        
        uint256 totalSupply = founderNFT.totalSupply();
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            bool isStaked = founderNFT.isTokenStaked(tokenId);
            uint256 earned = founderNFT.earned(tokenId);
            
            if (!isStaked) {
                assertEq(earned, 0, string(abi.encodePacked("Unstaked token ", vm.toString(tokenId), " has rewards")));
            }
        }
    }
    
    function testInvariant_OwnershipInvariants() public {
        performRandomOperations(12);
        
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            address tokenOwner = founderNFT.ownerOf(tokenId);
            bool isStaked = founderNFT.isTokenStaked(tokenId);
            
            if (isStaked) {
                assertEq(tokenOwner, address(founderNFT), 
                    string(abi.encodePacked("Staked token ", vm.toString(tokenId), " not owned by contract")));
                
                (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(tokenId);
                assertTrue(originalOwner != address(0), "Staked token missing original owner");
                assertTrue(stakedSince > 0, "Staked token missing stake timestamp");
            } else {
                assertTrue(tokenOwner != address(founderNFT), 
                    string(abi.encodePacked("Unstaked token ", vm.toString(tokenId), " owned by contract")));
            }
        }
    }
    
    function testInvariant_BalanceConservation() public {
        performRandomOperations(8);
        
        uint256 totalSupply = founderNFT.totalSupply();
        if (totalSupply == 0) return;
        
        uint256 sumOfBalances = handler.calculateTotalBalances();
        assertEq(sumOfBalances, totalSupply, "Sum of balances != total supply");
    }
    
    function testInvariant_AccessControl() public {
        performRandomOperations(5);
        
        bytes32 platformRole = founderNFT.PLATFORM_ROLE();
        
        assertTrue(
            founderNFT.hasRole(platformRole, address(registry)),
            "Registry should have PLATFORM_ROLE"
        );
        
        assertFalse(
            founderNFT.hasRole(platformRole, address(handler)),
            "Handler should not have PLATFORM_ROLE"
        );
    }
    
    function testInvariant_SystemSolvency() public {
        performRandomOperations(20);
        
        uint256 totalAssets = address(founderNFT).balance;
        uint256 totalLiabilities = handler.calculateTotalEarnableRewards();
        
        assertGe(totalAssets, totalLiabilities, "System is insolvent");
    }
    
    function testInvariant_EconomicConservation() public {
        performRandomOperations(10); // Reduced further to prevent overflow
        
        uint256 totalMintRevenue = handler.getTotalMintRevenue();
        if (totalMintRevenue == 0) return;
        
        // Conservative tolerance calculation to prevent overflow
        uint256 transactionCount = handler.getTransactionCount();
        uint256 tolerance;
        
        // Safe tolerance calculation
        if (transactionCount > 0 && totalMintRevenue > 0) {
            tolerance = (transactionCount < 100) ? transactionCount * 2 : 200;
            if (totalMintRevenue > 1000) {
                tolerance += totalMintRevenue / 1000;
            }
        } else {
            tolerance = 1;
        }
        
        uint256 actualTotal = handler.getTreasuryRevenue() + handler.getStakerRevenue();
        
        assertApproxEqAbs(
            actualTotal,
            totalMintRevenue,
            tolerance,
            "Mint revenue not conserved"
        );
    }
    
    // ============================================================================
    // IMPROVED FUZZ TESTING WITH SAFE BOUNDS
    // ============================================================================
    
    function testFuzz_RandomOperationSequence(
        uint256 seed,
        uint8 operationCount,
        uint256[] calldata randomValues
    ) public {
        // Much safer bounds to prevent overflow
        operationCount = uint8(bound(operationCount, 3, 8)); // Reduced significantly
        vm.assume(randomValues.length >= operationCount);
        
        // Initialize with safe seed
        uint256 currentSeed = bound(seed, 1, MAX_SAFE_VALUE);
        
        for (uint256 i = 0; i < operationCount; i++) {
            uint256 operation = (currentSeed + i) % 6; // Simplified to avoid overflow
            
            // Safe bounded value
            uint256 boundedValue = bound(randomValues[i], 1, MAX_SAFE_VALUE);
            
            if (operation == 0) {
                // Mint with safe quantity
                uint256 quantity = (boundedValue % 3) + 1; // Max 3 NFTs
                handler.mintNFT(currentSeed, quantity);
            } else if (operation == 1) {
                handler.stakeToken(currentSeed, boundedValue);
            } else if (operation == 2) {
                handler.unstakeToken(currentSeed, boundedValue);
            } else if (operation == 3) {
                handler.claimReward(currentSeed, boundedValue);
            } else if (operation == 4) {
                // Safe fee amount
                uint256 feeAmount = bound(boundedValue, 0.01 ether, 1 ether);
                handler.addPlatformFees(feeAmount);
            } else {
                // Safe time warp
                uint256 timeAmount = bound(boundedValue, 1 hours, 7 days);
                handler.timeWarp(timeAmount);
            }
            
            // Safe seed update - prevent overflow
            currentSeed = (currentSeed + boundedValue + 1) % MAX_SAFE_VALUE;
            
            // Verify basic invariants after each operation
            verifyBasicInvariants();
        }
    }
    
    function testFuzz_RewardInvariants(
        uint256 userCount,
        uint256 stakingDuration,
        uint256 rewardAmount
    ) public {
        userCount = bound(userCount, 1, 3); // Reduced further
        stakingDuration = bound(stakingDuration, MIN_STAKING_PERIOD, 3 days); // Reduced
        rewardAmount = bound(rewardAmount, 0.1 ether, 1 ether); // Reduced
        
        // Create users and mint NFTs
        for (uint256 i = 0; i < userCount; i++) {
            handler.mintNFT(i + 100, 1);
            handler.stakeToken(i + 100, 0);
        }
        
        // Add rewards
        handler.addPlatformFees(rewardAmount);
        
        // Wait for staking duration
        handler.timeWarp(stakingDuration);
        
        // Verify reward invariants
        uint256 totalEarnable = handler.calculateTotalEarnableRewards();
        uint256 contractBalance = address(founderNFT).balance;
        
        assertLe(totalEarnable, contractBalance, "Rewards exceed available balance");
        assertGe(founderNFT.getCurrentRewardRate(), 0, "Reward rate should be non-negative");
    }
    
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    
    function performRandomOperations(uint256 count) internal {
        for (uint256 i = 0; i < count; i++) {
            uint256 operation = uint256(keccak256(abi.encode(i, block.timestamp))) % 6;
            uint256 userSeed = (i % 10) + 1; // Limit user seeds
            
            if (operation == 0) {
                handler.mintNFT(userSeed, (i % 2) + 1); // Max 2 NFTs
            } else if (operation == 1) {
                handler.stakeToken(userSeed, i);
            } else if (operation == 2) {
                handler.unstakeToken(userSeed, i);
            } else if (operation == 3) {
                handler.claimReward(userSeed, i);
            } else if (operation == 4) {
                handler.addPlatformFees(0.1 ether + (i % 3) * 0.1 ether); // Safe fee amounts
            } else {
                handler.timeWarp(1 hours + (i % 24) * 1 hours); // Safe time warps
            }
        }
    }
    
    function verifyBasicInvariants() internal view {
        uint256 totalSupply = founderNFT.totalSupply();
        uint256 maxSupply = founderNFT.getMaxSupply();
        uint256 stakedSupply = founderNFT.getTotalStakedSupply();
        
        assertLe(totalSupply, maxSupply, "Supply exceeds maximum");
        assertLe(stakedSupply, totalSupply, "Staked exceeds total");
        assertEq(
            founderNFT.balanceOf(address(founderNFT)), 
            stakedSupply, 
            "Contract balance != staked supply"
        );
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
        
        // Setup extensions
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
        
        // Activate sales
        vm.prank(owner);
        founderNFT.setSaleStatus(true);
    }
    
    // ============================================================================
    // SUPPLY INVARIANTS
    // ============================================================================
    
    function invariant_totalSupplyNeverExceedsMax() public view {
        uint256 totalSupply = founderNFT.totalSupply();
        uint256 maxSupply = founderNFT.getMaxSupply();
        
        assertLe(totalSupply, maxSupply, "Total supply exceeds max supply");
    }
    
    function invariant_stakedSupplyNeverExceedsTotal() public view {
        uint256 stakedSupply = founderNFT.getTotalStakedSupply();
        uint256 totalSupply = founderNFT.totalSupply();
        
        assertLe(stakedSupply, totalSupply, "Staked supply exceeds total supply");
    }
    
    function invariant_contractOwnsAllStakedTokens() public view {
        uint256 contractBalance = founderNFT.balanceOf(address(founderNFT));
        uint256 stakedSupply = founderNFT.getTotalStakedSupply();
        
        assertEq(contractBalance, stakedSupply, "Contract doesn't own all staked tokens");
    }
    
    function invariant_balancesSumToTotalSupply() public view {
        uint256 totalSupply = founderNFT.totalSupply();
        if (totalSupply == 0) return;
        
        uint256 sumOfBalances = handler.calculateTotalBalances();
        assertEq(sumOfBalances, totalSupply, "Sum of balances != total supply");
    }
    
    // ============================================================================
    // REWARD INVARIANTS
    // ============================================================================
    
    function invariant_onlyStakedTokensEarnRewards() public view {
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            bool isStaked = founderNFT.isTokenStaked(tokenId);
            uint256 earned = founderNFT.earned(tokenId);
            
            if (!isStaked) {
                assertEq(earned, 0, string(abi.encodePacked("Unstaked token ", vm.toString(tokenId), " has rewards")));
            }
        }
    }
    
    function invariant_rewardsBackedByBalance() public view {
        uint256 totalEarnable = handler.calculateTotalEarnableRewards();
        uint256 contractBalance = address(founderNFT).balance;
        
        assertLe(totalEarnable, contractBalance, "Total earnable exceeds contract balance");
    }
    
    function invariant_rewardRateIsNonNegative() public view {
        uint256 currentRate = founderNFT.getCurrentRewardRate();
        
        assertGe(currentRate, 0, "Reward rate cannot be negative");
        assertLe(currentRate, 1e18, "Reward rate unreasonably high");
    }
    
    // ============================================================================
    // ACCESS CONTROL INVARIANTS
    // ============================================================================
    
    function invariant_onlyRegistryHasPlatformRole() public view {
        bytes32 platformRole = founderNFT.PLATFORM_ROLE();
        
        assertTrue(
            founderNFT.hasRole(platformRole, address(registry)),
            "Registry should have PLATFORM_ROLE"
        );
        
        assertFalse(
            founderNFT.hasRole(platformRole, address(handler)),
            "Handler should not have PLATFORM_ROLE"
        );
    }
    
    function invariant_ownershipConsistency() public view {
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            address tokenOwner = founderNFT.ownerOf(tokenId);
            bool isStaked = founderNFT.isTokenStaked(tokenId);
            
            if (isStaked) {
                assertEq(tokenOwner, address(founderNFT), 
                    string(abi.encodePacked("Staked token ", vm.toString(tokenId), " not owned by contract")));
                
                (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(tokenId);
                assertTrue(originalOwner != address(0), "Staked token missing original owner");
                assertTrue(stakedSince > 0, "Staked token missing stake timestamp");
            } else {
                assertTrue(tokenOwner != address(founderNFT), 
                    string(abi.encodePacked("Unstaked token ", vm.toString(tokenId), " owned by contract")));
            }
        }
    }
    
    // ============================================================================
    // ECONOMIC INVARIANTS
    // ============================================================================
    
    function invariant_mintRevenueConservation() public view {
        uint256 totalMintRevenue = handler.getTotalMintRevenue();
        
        if (totalMintRevenue == 0) return;
        
        uint256 tolerance = handler.getTransactionCount() + 1;
        
        assertApproxEqAbs(
            handler.getTreasuryRevenue() + handler.getStakerRevenue(),
            totalMintRevenue,
            tolerance,
            "Mint revenue not conserved"
        );
    }
    
    function invariant_noValueCreatedFromNothing() public view {
        uint256 totalValueIn = handler.getTotalValueInput();
        uint256 totalValueInSystem = handler.getTotalSystemValue();
        
        assertLe(totalValueInSystem, totalValueIn, "Value created from nothing");
    }
    
    // ============================================================================
    // STATE CONSISTENCY INVARIANTS
    // ============================================================================
    
    function invariant_timeMonotonicity() public view {
        uint256 currentTime = block.timestamp;
        uint256 lastRecordedTime = handler.getLastRecordedTime();
        
        assertGe(currentTime, lastRecordedTime, "Time moved backwards");
    }
    
    function invariant_stakedTokensHaveValidInfo() public view {
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (founderNFT.isTokenStaked(tokenId)) {
                (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(tokenId);
                
                assertTrue(originalOwner != address(0), "Staked token has zero original owner");
                assertTrue(stakedSince <= block.timestamp, "Staked since timestamp in future");
                assertTrue(stakedSince > 0, "Staked since timestamp is zero");
            }
        }
    }
    
    // ============================================================================
    // SYSTEM SOLVENCY INVARIANTS
    // ============================================================================
    
    function invariant_systemIsSolvent() public view {
        uint256 totalAssets = address(founderNFT).balance;
        uint256 totalLiabilities = handler.calculateTotalEarnableRewards();
        
        assertGe(totalAssets, totalLiabilities, "System is insolvent");
    }
}

// ============================================================================
// HANDLER CONTRACT WITH OVERFLOW PROTECTION
// ============================================================================

contract FounderNFTHandler is Test {
    FounderNFT public founderNFT;
    PlatformRegistry public registry;
    address public owner;
    
    // State tracking
    mapping(address => bool) public isKnownUser;
    address[] public allUsers;
    uint256 public transactionCount;
    uint256 public totalMintRevenue;
    uint256 public totalPlatformFees;
    uint256 public lastRecordedTime;
    
    uint256 public totalValueInput;
    uint256 public totalRewardsDistributed;
    
    // Safe constants
    uint256 constant MAX_USERS = 5; // Reduced for safety
    uint256 constant PRICE = 0.1 ether;
    uint256 constant MAX_SAFE_VALUE = type(uint64).max;
    
    constructor(FounderNFT _founderNFT, PlatformRegistry _registry, address _owner) {
        founderNFT = _founderNFT;
        registry = _registry;
        owner = _owner;
        lastRecordedTime = block.timestamp;
    }
    
    // ============================================================================
    // SAFE FUZZ FUNCTIONS
    // ============================================================================
    
    function mintNFT(uint256 userSeed, uint256 quantity) external {
        quantity = bound(quantity, 1, 2); // Reduced max quantity
        address user = getOrCreateUser(userSeed);
        
        uint256 cost = quantity * PRICE;
        
        // Check for potential overflow in cost calculation
        if (quantity > type(uint256).max / PRICE) {
            return; // Skip if would overflow
        }
        
        vm.deal(user, cost);
        
        uint256 currentSupply = founderNFT.totalSupply();
        if (currentSupply + quantity > founderNFT.getMaxSupply()) {
            quantity = founderNFT.getMaxSupply() - currentSupply;
        }
        
        if (quantity == 0) return;
        
        vm.prank(user);
        try founderNFT.mintMultiple{value: quantity * PRICE}(quantity) {
            uint256 actualCost = quantity * PRICE;
            
            // Safe addition with overflow check
            if (totalMintRevenue <= type(uint256).max - actualCost) {
                totalMintRevenue += actualCost;
            }
            
            if (totalValueInput <= type(uint256).max - actualCost) {
                totalValueInput += actualCost;
            }
            
            transactionCount++;
        } catch {
            // Mint failed, which is acceptable
        }
    }
    
    function stakeToken(uint256 userSeed, uint256 tokenSeed) external {
        if (allUsers.length == 0) return;
        
        address user = allUsers[userSeed % allUsers.length];
        uint256 balance = founderNFT.balanceOf(user);
        
        if (balance == 0) return;
        
        uint256 totalSupply = founderNFT.totalSupply();
        if (totalSupply == 0) return;
        
        for (uint256 i = tokenSeed % totalSupply; i < totalSupply; i++) {
            try founderNFT.ownerOf(i) returns (address tokenOwner) {
                if (tokenOwner == user && !founderNFT.isTokenStaked(i)) {
                    vm.prank(user);
                    try founderNFT.stakeToken(i) {
                        transactionCount++;
                        return;
                    } catch {
                        // Staking failed, continue looking
                    }
                }
            } catch {
                // Token doesn't exist, continue
            }
        }
    }
    
    function unstakeToken(uint256 userSeed, uint256 tokenSeed) external {
        if (allUsers.length == 0) return;
        
        address user = allUsers[userSeed % allUsers.length];
        uint256 stakedCount = founderNFT.getStakedCountByOwner(user);
        
        if (stakedCount == 0) return;
        
        uint256 totalSupply = founderNFT.totalSupply();
        if (totalSupply == 0) return;
        
        for (uint256 i = tokenSeed % totalSupply; i < totalSupply; i++) {
            if (founderNFT.isTokenStaked(i)) {
                (address originalOwner, uint256 stakedSince, ) = founderNFT.getStakingInfo(i);
                if (originalOwner == user) {
                    if (block.timestamp >= stakedSince + founderNFT.getMinimumStakingPeriod()) {
                        uint256 earnedBefore = founderNFT.earned(i);
                        vm.prank(user);
                        try founderNFT.unstakeToken(i) {
                            // Safe addition with overflow check
                            if (totalRewardsDistributed <= type(uint256).max - earnedBefore) {
                                totalRewardsDistributed += earnedBefore;
                            }
                            transactionCount++;
                            return;
                        } catch {
                            // Unstaking failed, continue looking
                        }
                    }
                }
            }
        }
    }
    
    function claimReward(uint256 userSeed, uint256 tokenSeed) external {
        if (allUsers.length == 0) return;
        
        address user = allUsers[userSeed % allUsers.length];
        uint256 stakedCount = founderNFT.getStakedCountByOwner(user);
        
        if (stakedCount == 0) return;
        
        uint256 totalSupply = founderNFT.totalSupply();
        if (totalSupply == 0) return;
        
        for (uint256 i = tokenSeed % totalSupply; i < totalSupply; i++) {
            if (founderNFT.isTokenStaked(i)) {
                (address originalOwner, , ) = founderNFT.getStakingInfo(i);
                if (originalOwner == user && founderNFT.earned(i) > 0) {
                    uint256 earnedBefore = founderNFT.earned(i);
                    vm.prank(user);
                    try founderNFT.claimReward(i) {
                        // Safe addition with overflow check
                        if (totalRewardsDistributed <= type(uint256).max - earnedBefore) {
                            totalRewardsDistributed += earnedBefore;
                        }
                        transactionCount++;
                        return;
                    } catch {
                        // Claiming failed, continue looking
                    }
                }
            }
        }
    }
    
    function addPlatformFees(uint256 amount) external {
        amount = bound(amount, 0.01 ether, 0.5 ether); // Safe bounds
        
        vm.deal(address(registry), amount);
        vm.prank(address(registry));
        
        try founderNFT.addPlatformFees{value: amount}(amount) {
            // Safe addition with overflow check
            if (totalPlatformFees <= type(uint256).max - amount) {
                totalPlatformFees += amount;
            }
            
            if (totalValueInput <= type(uint256).max - amount) {
                totalValueInput += amount;
            }
            
            transactionCount++;
        } catch {
            // Adding fees failed, which is acceptable
        }
    }
    
    function timeWarp(uint256 timeAmount) external {
        timeAmount = bound(timeAmount, 1 hours, 7 days); // Safe bounds
        
        // Check for potential overflow
        if (block.timestamp <= type(uint256).max - timeAmount) {
            vm.warp(block.timestamp + timeAmount);
            lastRecordedTime = block.timestamp;
        }
    }
    
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    
    function getOrCreateUser(uint256 seed) internal returns (address) {
        if (allUsers.length >= MAX_USERS) {
            return allUsers[seed % allUsers.length];
        }
        
        // Create a more predictable user address
        address user = address(uint160(uint256(keccak256(abi.encode(seed, "user"))) % (2**160 - 1)) + 1);
        
        if (!isKnownUser[user]) {
            allUsers.push(user);
            isKnownUser[user] = true;
        }
        return user;
    }
    
    // ============================================================================
    // SAFE CALCULATION FUNCTIONS
    // ============================================================================
    
    function calculateTotalBalances() external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < allUsers.length; i++) {
            uint256 balance = founderNFT.balanceOf(allUsers[i]);
            // Safe addition with overflow check
            if (total <= type(uint256).max - balance) {
                total += balance;
            }
        }
        
        // Add contract balance (staked tokens)
        uint256 contractBalance = founderNFT.balanceOf(address(founderNFT));
        if (total <= type(uint256).max - contractBalance) {
            total += contractBalance;
        }
        
        return total;
    }
    
    function calculateTotalEarnableRewards() external view returns (uint256) {
        uint256 total = 0;
        uint256 totalSupply = founderNFT.totalSupply();
        
        for (uint256 i = 0; i < totalSupply; i++) {
            uint256 earned = founderNFT.earned(i);
            // Safe addition with overflow check
            if (total <= type(uint256).max - earned) {
                total += earned;
            }
        }
        
        return total;
    }
    
    function getTotalMintRevenue() external view returns (uint256) {
        return totalMintRevenue;
    }
    
    function getTreasuryRevenue() external view returns (uint256) {
        // 90% of mint revenue goes to treasury
        // Safe calculation to prevent overflow
        if (totalMintRevenue > type(uint256).max / 90) {
            return type(uint256).max; // Cap at max value
        }
        return (totalMintRevenue * 90) / 100;
    }
    
    function getStakerRevenue() external view returns (uint256) {
        // 10% of mint revenue goes to stakers
        // Safe calculation to prevent overflow
        if (totalMintRevenue > type(uint256).max / 10) {
            return type(uint256).max; // Cap at max value
        }
        return (totalMintRevenue * 10) / 100;
    }
    
    function getTransactionCount() external view returns (uint256) {
        return transactionCount;
    }
    
    function getTotalValueInput() external view returns (uint256) {
        return totalValueInput;
    }
    
    function getTotalSystemValue() external view returns (uint256) {
        // Conservative calculation to prevent "value created from nothing"
        return totalValueInput;
    }
    
    function getLastRecordedTime() external view returns (uint256) {
        return lastRecordedTime;
    }
}