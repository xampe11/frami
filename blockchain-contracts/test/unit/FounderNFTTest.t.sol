// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {FounderNFT, FounderNFTStorage} from "../../src/FounderNFT.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

// Mock platform registry for testing
contract MockPlatformRegistry {
    // Function to simulate platform registry functionality
    function isFactoryRegistered(address /*factory*/ ) external pure returns (bool) {
        return true;
    }
}

// Create a contract that can receive both ETH and ERC721 tokens for testing
contract ReceivableUser {
    // Function to receive ETH
    receive() external payable {}

    // Function required by ERC721 to receive tokens
    function onERC721Received(address, address, uint256, bytes memory) external pure returns (bytes4) {
        // Return the expected selector to indicate this contract can receive ERC721 tokens
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

    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event StakingRewardsClaimed(address indexed owner, uint256 indexed tokenId, uint256 amount);

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

        // Grant platform role to simulate platform
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), platform);

        // Activate sale
        founderNFT.setSaleStatus(true);

        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
        vm.deal(platform, 10 ether);
    }

    // Test initialization
    function testInitialization() public view {
        assertEq(founderNFT.getPlatformFeeDistributionPercentage(), FEE_DISTRIBUTION_PERCENTAGE);
        assertEq(founderNFT.getDaoTokenAllocationPercentage(), DAO_TOKEN_ALLOCATION);
        assertEq(founderNFT.getMinimumStakingPeriod(), MIN_STAKING_PERIOD);
        assertEq(founderNFT.getTotalStakedTokens(), 0);
        assertTrue(founderNFT.hasRole(founderNFT.ADMIN_ROLE(), owner));
    }

    // Test minting
    function testMint() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit FounderNFTMinted(user1, 0);
        founderNFT.mint{value: PRICE}();

        assertEq(founderNFT.balanceOf(user1), 1);
        assertEq(founderNFT.ownerOf(0), user1);
        assertTrue(founderNFT.isFounder(user1));
    }

    // Test insufficient payment
    function testInsufficientPayment() public {
        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        founderNFT.mint{value: PRICE - 0.01 ether}();
    }

    // Test max supply
    function testMaxSupply() public {
        // Create a smaller NFT for easier testing
        bytes memory initData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            owner,
            address(mockRegistry),
            2, // Max supply of 2
            PRICE,
            FEE_DISTRIBUTION_PERCENTAGE,
            DAO_TOKEN_ALLOCATION,
            MIN_STAKING_PERIOD
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        FounderNFT smallNFT = FounderNFT(payable(address(proxy)));
        smallNFT.setSaleStatus(true);

        // Mint 2 tokens (max supply)
        vm.prank(user1);
        smallNFT.mint{value: PRICE}();

        vm.prank(user2);
        smallNFT.mint{value: PRICE}();

        // Try to mint beyond max supply
        vm.prank(user3);
        vm.expectRevert("Max supply reached");
        smallNFT.mint{value: PRICE}();
    }

    // Test batch minting
    function testBatchMint() public {
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        founderNFT.batchMint(recipients);

        assertEq(founderNFT.balanceOf(user1), 1);
        assertEq(founderNFT.balanceOf(user2), 1);
        assertEq(founderNFT.balanceOf(user3), 1);

        assertEq(founderNFT.ownerOf(0), user1);
        assertEq(founderNFT.ownerOf(1), user2);
        assertEq(founderNFT.ownerOf(2), user3);
    }

    // Test staking
    function testStaking() public {
        // Mint a token to user1
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Stake the token
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit TokenStaked(user1, 0);
        founderNFT.stakeToken(0);

        // Check staking status
        assertEq(founderNFT.getTotalStakedTokens(), 1);
        assertTrue(founderNFT.isTokenStaked(0));

        // Check ownership after staking
        assertEq(founderNFT.ownerOf(0), address(founderNFT));

        // Check staking info
        (address stakedOwner, uint256 stakedSince, uint256 lastClaimed) = founderNFT.getStakingInfo(0);
        assertEq(stakedOwner, user1);
        assertEq(stakedSince, block.timestamp);
        assertEq(lastClaimed, block.timestamp);
    }

    // Test unstaking before minimum period
    function testUnstakingBeforeMinimumPeriod() public {
        // Mint and stake a token
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Try to unstake before minimum period
        vm.prank(user1);
        vm.expectRevert("Minimum staking period not reached");
        founderNFT.unstakeToken(0);
    }

    // Test unstaking after minimum period
    function testUnstakingAfterMinimumPeriod() public {
        // Mint and stake a token
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Unstake the token
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit TokenUnstaked(user1, 0);
        founderNFT.unstakeToken(0);

        // Check staking status after unstaking
        assertEq(founderNFT.getTotalStakedTokens(), 0);
        assertFalse(founderNFT.isTokenStaked(0));

        // Check ownership after unstaking
        assertEq(founderNFT.ownerOf(0), user1);
    }

    function testFeeDistribution() public {
        // Mint token for user1
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Stake the token
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Add platform fees - but first, fund the contract so it can pay out
        vm.deal(address(founderNFT), 2 ether); // Add 2 ETH to the contract's balance

        // Record the initial balances
        uint256 userBalanceBefore = user1.balance;

        // Now add fees to be distributed
        uint256 distributionAmount = 1 ether;
        vm.prank(platform);
        founderNFT.addPlatformFees(distributionAmount);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Unstake token (which claims rewards automatically)
        vm.prank(user1);
        founderNFT.unstakeToken(0);

        // Check if user1 received the distribution
        assertEq(user1.balance - userBalanceBefore, distributionAmount, "User should receive the distribution");

        // Verify token is no longer staked
        assertFalse(founderNFT.isTokenStaked(0), "Token should no longer be staked");

        // Verify token ownership has returned to the user
        assertEq(founderNFT.ownerOf(0), user1, "User should own the token after unstaking");
    }

    function testClaimRewardsWithoutUnstaking() public {
        // Mint token for user1
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Stake the token
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Fund the contract with ETH for distribution
        // This simulates the contract receiving fees from projects
        vm.deal(address(founderNFT), 2 ether);

        // Add platform fees
        uint256 distributionAmount = 1 ether;
        vm.prank(platform);
        founderNFT.addPlatformFees(distributionAmount);

        // Get balances before claiming
        uint256 contractBalanceBefore = address(founderNFT).balance;
        uint256 userBalanceBefore = user1.balance;

        // Claim rewards without unstaking
        vm.prank(user1);
        founderNFT.claimStakingRewards(0);

        // Check balances after claiming
        uint256 contractBalanceAfter = address(founderNFT).balance;
        uint256 userBalanceAfter = user1.balance;

        // Verify ETH amounts transferred
        assertEq(
            contractBalanceBefore - contractBalanceAfter, distributionAmount, "Contract should send distribution amount"
        );
        assertEq(userBalanceAfter - userBalanceBefore, distributionAmount, "User should receive distribution amount");

        // Verify undistributed fees updated
        assertEq(founderNFT.getUndistributedFees(), 0, "Undistributed fees should be 0 after claiming");
    }

    // Test early access functionality
    function testEarlyAccess() public {
        // Mint a token for user1
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Add a project for early access
        address projectAddress = makeAddr("project");
        founderNFT.addEarlyAccessProject(projectAddress);

        // Check early access
        assertTrue(founderNFT.hasEarlyAccess(user1, projectAddress));
        assertFalse(founderNFT.hasEarlyAccess(user2, projectAddress));

        // Remove project from early access
        founderNFT.removeEarlyAccessProject(projectAddress);

        // Check early access after removal
        assertFalse(founderNFT.hasEarlyAccess(user1, projectAddress));
    }

    // Test admin functions
    function testAdminFunctions() public {
        // Test setting platform fee distribution percentage
        uint256 newFeePercentage = 2000; // 20%
        founderNFT.setPlatformFeeDistributionPercentage(newFeePercentage);
        assertEq(founderNFT.getPlatformFeeDistributionPercentage(), newFeePercentage);

        // Test setting DAO token allocation percentage
        uint256 newDaoPercentage = 2000; // 20%
        founderNFT.setDaoTokenAllocationPercentage(newDaoPercentage);
        assertEq(founderNFT.getDaoTokenAllocationPercentage(), newDaoPercentage);

        // Test setting minimum staking period
        uint256 newMinStakingPeriod = 14 days;
        founderNFT.setMinimumStakingPeriod(newMinStakingPeriod);
        assertEq(founderNFT.getMinimumStakingPeriod(), newMinStakingPeriod);

        // Test setting NFT price
        uint256 newPrice = 0.2 ether;
        founderNFT.setPrice(newPrice);

        // Test the new price works
        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        founderNFT.mint{value: PRICE}(); // Old price should fail

        vm.prank(user1);
        founderNFT.mint{value: newPrice}(); // New price should work
        assertEq(founderNFT.ownerOf(0), user1);
    }

    function testTokenTransferRestrictions() public {
        // Mint tokens to users
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        vm.prank(user2);
        founderNFT.mint{value: PRICE}();

        // Stake user1's token
        vm.prank(user1);
        founderNFT.stakeToken(0);

        // Verify the token is staked and ownership transferred to contract
        assertTrue(founderNFT.isTokenStaked(0), "Token should be staked");
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "Contract should own the staked token");

        // Get staking info and verify
        (address stakedOwner,,) = founderNFT.getStakingInfo(0);
        assertEq(stakedOwner, user1, "Original owner should be recorded in staking info");

        // Verify unstaked token can be transferred
        vm.prank(user2);
        founderNFT.transferFrom(user2, user3, 1);
        assertEq(founderNFT.ownerOf(1), user3, "Unstaked token should be transferable");

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Unstake token
        vm.prank(user1);
        founderNFT.unstakeToken(0);

        // Verify token returned to original owner
        assertEq(founderNFT.ownerOf(0), user1, "Token should return to original owner after unstaking");
        assertFalse(founderNFT.isTokenStaked(0), "Token should no longer be staked");

        // Verify token can be transferred after unstaking
        vm.prank(user1);
        founderNFT.transferFrom(user1, user3, 0);
        assertEq(founderNFT.ownerOf(0), user3, "Token should be transferable after unstaking");
    }

    // Test withdrawing contract funds
    function testWithdraw() public {
        // Mint a token to get funds in the contract
        vm.prank(user1);
        founderNFT.mint{value: PRICE}();

        // Check contract balance
        uint256 contractBalance = address(founderNFT).balance;
        assertEq(contractBalance, PRICE);

        // Withdraw funds
        uint256 ownerBalanceBefore = address(this).balance;
        founderNFT.withdraw();
        uint256 ownerBalanceAfter = address(this).balance;

        // Check balances after withdrawal
        assertEq(ownerBalanceAfter - ownerBalanceBefore, PRICE);
        assertEq(address(founderNFT).balance, 0);
    }

    // Receive function to allow contract to receive ETH
    receive() external payable {}
}
