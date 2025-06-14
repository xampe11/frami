// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {ERC1967Proxy} from "../src/proxy/ERC1967Proxy.sol";

/**
 * @title DeployFounderNFT
 * @dev Foundry deployment script for FounderNFT with upgradeable proxy pattern
 *
 * Usage:
 * forge script script/DeployFounderNFT.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
 *
 * Environment Variables Required:
 * - PLATFORM_REGISTRY_ADDRESS: Address of the deployed PlatformRegistry
 * - DEPLOYER_PRIVATE_KEY: Private key for deployment
 * - ETHERSCAN_API_KEY: For contract verification (optional)
 */
contract DeployFounderNFT is Script {
    // Deployment configuration
    struct DeployConfig {
        address platformRegistry;
        uint256 maxSupply;
        uint256 price;
        uint256 platformFeeDistributionPercentage;
        uint256 daoTokenAllocationPercentage;
        uint256 minimumStakingPeriod;
        bool activateSaleImmediately;
    }

    // Extension type constant for registration
    bytes32 constant FOUNDER_NFT_EXTENSION = keccak256("FOUNDER_NFT_EXTENSION");

    function run() external {
        // Load configuration
        DeployConfig memory config = getDeployConfig();

        // Validate configuration
        validateConfig(config);

        // Get deployer account
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== FounderNFT Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Platform Registry:", config.platformRegistry);
        console.log("Max Supply:", config.maxSupply);
        console.log("Price (ETH):", config.price / 1e18);
        console.log("================================");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the implementation contract
        console.log("1. Deploying FounderNFT implementation...");
        FounderNFT implementation = new FounderNFT();
        console.log("   Implementation deployed at:", address(implementation));

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            deployer, // initial owner
            config.platformRegistry,
            config.maxSupply,
            config.price,
            config.platformFeeDistributionPercentage,
            config.daoTokenAllocationPercentage,
            config.minimumStakingPeriod
        );

        // Deploy the proxy contract
        console.log("2. Deploying ERC1967 Proxy...");
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("   Proxy deployed at:", address(proxy));

        // Wrap the proxy in the FounderNFT interface
        FounderNFT founderNFT = FounderNFT(payable(address(proxy)));

        // Verify initialization
        console.log("3. Verifying initialization...");
        require(founderNFT.owner() == deployer, "Owner not set correctly");
        require(founderNFT.hasRole(founderNFT.ADMIN_ROLE(), deployer), "Admin role not granted");
        require(founderNFT.hasRole(founderNFT.PLATFORM_ROLE(), config.platformRegistry), "Platform role not granted");
        console.log("   Initialization verified");

        // Activate sale if configured
        if (config.activateSaleImmediately) {
            console.log("4. Activating NFT sale...");
            founderNFT.setSaleStatus(true);
            console.log("   Sale activated");
        }

        vm.stopBroadcast();

        // Log deployment summary
        logDeploymentSummary(address(implementation), address(proxy), config);

        // Save deployment addresses to file
        saveDeploymentAddresses(address(implementation), address(proxy));

        console.log("=== Deployment Complete ===");
        console.log("Next steps:");
        console.log("1. Register FounderNFT as extension in PlatformRegistry");
        console.log("3. Test minting functionality");
        console.log("4. Set up monitoring for the contract");
    }

    /**
     * @dev Load deployment configuration from environment variables
     */
    function getDeployConfig() internal view returns (DeployConfig memory) {
        return DeployConfig({
            platformRegistry: vm.envAddress("PLATFORM_REGISTRY_ADDRESS"),
            maxSupply: vm.envOr("FOUNDER_NFT_MAX_SUPPLY", uint256(1000)),
            price: vm.envOr("FOUNDER_NFT_PRICE", uint256(0.1 ether)),
            platformFeeDistributionPercentage: vm.envOr("PLATFORM_FEE_DISTRIBUTION_PERCENTAGE", uint256(5000)), // 50%
            daoTokenAllocationPercentage: vm.envOr("DAO_TOKEN_ALLOCATION_PERCENTAGE", uint256(1000)), // 10%
            minimumStakingPeriod: vm.envOr("MINIMUM_STAKING_PERIOD", uint256(0)),
            activateSaleImmediately: vm.envOr("ACTIVATE_SALE_IMMEDIATELY", true)
        });
    }

    /**
     * @dev Validate deployment configuration
     */
    function validateConfig(DeployConfig memory config) internal pure {
        require(config.platformRegistry != address(0), "Platform registry address required");
        require(config.maxSupply > 0, "Max supply must be greater than 0");
        require(config.price > 0, "Price must be greater than 0");
        require(config.platformFeeDistributionPercentage <= 10000, "Platform fee percentage too high");
        require(config.daoTokenAllocationPercentage <= 10000, "DAO allocation percentage too high");
    }

    /**
     * @dev Log comprehensive deployment summary
     */
    function logDeploymentSummary(address implementation, address proxy, DeployConfig memory config) internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", getNetworkName());
        console.log("Block Number:", block.number);
        console.log("Block Timestamp:", block.timestamp);
        console.log("\nContract Addresses:");
        console.log("Implementation:   ", implementation);
        console.log("Proxy (Main):     ", proxy);
        console.log("Platform Registry:", config.platformRegistry);

        console.log("\nConfiguration:");
        console.log("Max Supply:                    ", config.maxSupply);
        console.log("Price (wei):                   ", config.price);
        console.log("Platform Fee Distribution (%): ", config.platformFeeDistributionPercentage / 100);
        console.log("DAO Token Allocation (%):      ", config.daoTokenAllocationPercentage / 100);
        console.log("Minimum Staking Period (days): ", config.minimumStakingPeriod / 1 days);
        console.log("Sale Active:                   ", config.activateSaleImmediately);

        console.log("\nImportant Constants:");
        console.log("Sales Redistribution %:        ", "10%");
        console.log("Week Duration (seconds):       ", uint256(7 days));
        console.log("Extension Type Hash:           ");
        console.logBytes32(FOUNDER_NFT_EXTENSION);
    }

    /**
     * @dev Save deployment addresses to JSON file for future reference
     */
    function saveDeploymentAddresses(address implementation, address proxy) internal {
        string memory networkName = getNetworkName();
        string memory deploymentData = string(
            abi.encodePacked(
                "{\n",
                '  "network": "',
                networkName,
                '",\n',
                '  "blockNumber": ',
                vm.toString(block.number),
                ",\n",
                '  "timestamp": ',
                vm.toString(block.timestamp),
                ",\n",
                '  "founderNFT": {\n',
                '    "implementation": "',
                vm.toString(implementation),
                '",\n',
                '    "proxy": "',
                vm.toString(proxy),
                '",\n',
                '    "extensionType": "',
                vm.toString(FOUNDER_NFT_EXTENSION),
                '"\n',
                "  }\n",
                "}"
            )
        );

        string memory filename = string(abi.encodePacked("./deployments/foundernft-", networkName, ".json"));

        vm.writeFile(filename, deploymentData);
        console.log("Deployment data saved to:", filename);
    }

    /**
     * @dev Get network name for logging
     */
    function getNetworkName() internal view returns (string memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) return "mainnet";
        if (chainId == 11155111) return "sepolia";
        if (chainId == 17000) return "holesky";
        if (chainId == 137) return "polygon";
        if (chainId == 10) return "optimism";
        if (chainId == 42161) return "arbitrum";
        if (chainId == 8453) return "base";
        if (chainId == 31337) return "localhost";

        return string(abi.encodePacked("chain-", vm.toString(chainId)));
    }
}

/**
 * @title DeployFounderNFTWithRegistry
 * @dev Extended deployment script that also deploys PlatformRegistry if needed
 */

/*
contract DeployFounderNFTWithRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Full Platform Deployment ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Check if PlatformRegistry is already deployed
        address existingRegistry = vm.envOr("PLATFORM_REGISTRY_ADDRESS", address(0));

        address platformRegistry;
        if (existingRegistry != address(0)) {
            console.log("Using existing PlatformRegistry:", existingRegistry);
            platformRegistry = existingRegistry;
        } else {
            console.log("PlatformRegistry not found, please deploy it first or set PLATFORM_REGISTRY_ADDRESS");
            revert("PlatformRegistry required");
        }

        vm.stopBroadcast();

        // Set the registry address and run the main deployment
        vm.setEnv("PLATFORM_REGISTRY_ADDRESS", vm.toString(platformRegistry));

        // Run the main FounderNFT deployment
        DeployFounderNFT mainDeployment = new DeployFounderNFT();
        mainDeployment.run();
    }
}
*/

/**
 * @title UpgradeFounderNFT
 * @dev Script to upgrade an existing FounderNFT implementation
 */

/*
contract UpgradeFounderNFT is Script {
    function run() external {
        address proxyAddress = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("=== FounderNFT Upgrade ===");
        console.log("Proxy Address:", proxyAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        console.log("Deploying new implementation...");
        FounderNFT newImplementation = new FounderNFT();
        console.log("New implementation:", address(newImplementation));

        // Get the proxy contract
        FounderNFT founderNFT = FounderNFT(payable(proxyAddress));

        // Perform the upgrade
        console.log("Upgrading proxy to new implementation...");
        founderNFT.upgradeToAndCall(address(newImplementation), "");

        vm.stopBroadcast();

        console.log("Upgrade completed successfully!");
        console.log("Proxy now points to:", address(newImplementation));
    }
} 
*/
