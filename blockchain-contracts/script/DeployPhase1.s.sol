// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../src/PlatformRegistry.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

/**
 * @title DeployPhase1
 * @dev Complete deployment script for Phase 1: PlatformRegistry + FounderNFT
 * @notice This script deploys both contracts with proper integration and testing
 *
 * Usage:
 * forge script script/DeployPhase1.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
 *
 * Environment Variables Required:
 * - DEPLOYER_PRIVATE_KEY: Private key for deployment
 * - TREASURY_ADDRESS: Address to receive platform fees (optional, defaults to deployer)
 * - FOUNDER_NFT_MAX_SUPPLY: Maximum NFT supply (default: 1000)
 * - FOUNDER_NFT_PRICE: Price per NFT in wei (default: 0.1 ETH)
 * - PLATFORM_FEE_DISTRIBUTION_PERCENTAGE: % of platform fees to stakers (default: 2500 = 25%)
 * - DAO_TOKEN_ALLOCATION_PERCENTAGE: % for future DAO tokens (default: 1000 = 10%)
 * - MINIMUM_STAKING_PERIOD: Minimum staking period in seconds (default: 7 days)
 * - ACTIVATE_SALE_IMMEDIATELY: Whether to activate sales immediately (default: true)
 * - PLATFORM_FEE_PERCENTAGE: Platform fee percentage (default: 500 = 5%)
 * - ETHERSCAN_API_KEY: For contract verification (optional)
 */
contract DeployPhase1 is Script {
    // ============================================================================
    // STRUCTS & CONSTANTS
    // ============================================================================

    struct Phase1Config {
        address deployer;
        address treasury;
        uint256 platformFeePercentage;
        uint256 maxSupply;
        uint256 price;
        uint256 platformFeeDistributionPercentage;
        uint256 daoTokenAllocationPercentage;
        uint256 minimumStakingPeriod;
        bool activateSaleImmediately;
    }

    struct DeploymentResult {
        address platformRegistryImpl;
        address platformRegistryProxy;
        address founderNFTImpl;
        address founderNFTProxy;
        uint256 deploymentBlock;
        uint256 deploymentTimestamp;
        uint256 chainId;
        string networkName;
    }

    // Extension constants
    bytes32 constant FOUNDER_NFT_KEY = keccak256("FOUNDER_NFT");
    bytes32 constant CATEGORY_NFT = keccak256("NFT");

    // ============================================================================
    // MAIN DEPLOYMENT FUNCTION
    // ============================================================================

    function run() external {
        console.log(" Starting Phase 1 Deployment (PlatformRegistry + FounderNFT)");
        console.log("================================================================");

        // Load and validate configuration
        Phase1Config memory config = loadConfiguration();
        validateConfiguration(config);

        // Deploy contracts
        DeploymentResult memory result = deployContracts(config);

        // Register FounderNFT as extension
        registerFounderNFTExtension(result, config);

        // Activate sales if requested
        if (config.activateSaleImmediately) {
            activateSales(result.founderNFTProxy);
        }

        // Run integration tests
        runIntegrationTests(result, config);

        // Log deployment summary
        logDeploymentSummary(result, config);

        // Save deployment data
        saveDeploymentData(result, config);

        console.log(" Phase 1 Deployment Completed Successfully!");
        console.log("================================================================");
    }

    // ============================================================================
    // CONFIGURATION LOADING
    // ============================================================================

    function loadConfiguration() internal view returns (Phase1Config memory) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Treasury defaults to deployer if not specified
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        Phase1Config memory config = Phase1Config({
            deployer: deployer,
            treasury: treasury,
            platformFeePercentage: vm.envOr("PLATFORM_FEE_PERCENTAGE", uint256(500)), // 5%
            maxSupply: vm.envOr("FOUNDER_NFT_MAX_SUPPLY", uint256(1000)),
            price: vm.envOr("FOUNDER_NFT_PRICE", uint256(0.1 ether)),
            platformFeeDistributionPercentage: vm.envOr("PLATFORM_FEE_DISTRIBUTION_PERCENTAGE", uint256(2500)), // 25%
            daoTokenAllocationPercentage: vm.envOr("DAO_TOKEN_ALLOCATION_PERCENTAGE", uint256(1000)), // 10%
            minimumStakingPeriod: vm.envOr("MINIMUM_STAKING_PERIOD", uint256(7 days)),
            activateSaleImmediately: vm.envOr("ACTIVATE_SALE_IMMEDIATELY", true)
        });

        console.log(" Configuration Loaded:");
        console.log("   Deployer:", config.deployer);
        console.log("   Treasury:", config.treasury);
        console.log("   Platform Fee:", config.platformFeePercentage, "basis points");
        console.log("   NFT Max Supply:", config.maxSupply);
        console.log("   NFT Price:", config.price / 1e18, "ETH");
        console.log("   Min Staking Period:", config.minimumStakingPeriod / 86400, "days");
        console.log("   Activate Sales:", config.activateSaleImmediately ? "Yes" : "No");

        return config;
    }

    function validateConfiguration(Phase1Config memory config) internal pure {
        require(config.deployer != address(0), "Invalid deployer address");
        require(config.treasury != address(0), "Invalid treasury address");
        require(config.platformFeePercentage <= 1000, "Platform fee too high (max 10%)");
        require(config.maxSupply > 0 && config.maxSupply <= 100000, "Invalid max supply");
        require(config.price > 0, "Price must be greater than 0");
        require(config.platformFeeDistributionPercentage <= 10000, "Fee distribution percentage too high");
        require(config.daoTokenAllocationPercentage <= 10000, "DAO allocation percentage too high");
        require(config.minimumStakingPeriod <= 365 days, "Staking period too long");

        console.log(" Configuration validation passed");
    }

    // ============================================================================
    // CONTRACT DEPLOYMENT
    // ============================================================================

    function deployContracts(Phase1Config memory config) internal returns (DeploymentResult memory) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log(" Deploying Contracts...");

        // Deploy PlatformRegistry
        console.log("  Deploying PlatformRegistry implementation...");
        PlatformRegistry platformRegistryImpl = new PlatformRegistry();
        console.log("    PlatformRegistry implementation:", address(platformRegistryImpl));

        // Deploy PlatformRegistry proxy
        console.log("  Deploying PlatformRegistry proxy...");
        bytes memory platformRegistryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            config.deployer,
            config.platformFeePercentage,
            config.treasury
        );

        ERC1967Proxy platformRegistryProxy = new ERC1967Proxy(
            address(platformRegistryImpl), 
            platformRegistryData
        );
        console.log("    PlatformRegistry proxy:", address(platformRegistryProxy));

        // Deploy FounderNFT
        console.log("  Deploying FounderNFT implementation...");
        FounderNFT founderNFTImpl = new FounderNFT();
        console.log("    FounderNFT implementation:", address(founderNFTImpl));

        // Deploy FounderNFT proxy
        console.log("  Deploying FounderNFT proxy...");
        bytes memory founderNFTData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            config.deployer,
            address(platformRegistryProxy),
            config.maxSupply,
            config.price,
            config.platformFeeDistributionPercentage,
            config.daoTokenAllocationPercentage,
            config.minimumStakingPeriod
        );

        ERC1967Proxy founderNFTProxy = new ERC1967Proxy(
            address(founderNFTImpl), 
            founderNFTData
        );
        console.log("    FounderNFT proxy:", address(founderNFTProxy));

        vm.stopBroadcast();

        return DeploymentResult({
            platformRegistryImpl: address(platformRegistryImpl),
            platformRegistryProxy: address(platformRegistryProxy),
            founderNFTImpl: address(founderNFTImpl),
            founderNFTProxy: address(founderNFTProxy),
            deploymentBlock: block.number,
            deploymentTimestamp: block.timestamp,
            chainId: block.chainid,
            networkName: getNetworkName()
        });
    }

    // ============================================================================
    // EXTENSION REGISTRATION
    // ============================================================================

    function registerFounderNFTExtension(
        DeploymentResult memory result, 
        Phase1Config memory /* config */
    ) internal {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log(" Registering FounderNFT as Platform Extension...");

        PlatformRegistry registry = PlatformRegistry(payable(result.platformRegistryProxy));
        
        bytes32[] memory permissions = new bytes32[](0); // No special permissions needed

        registry.registerExtension(
            FOUNDER_NFT_KEY,
            result.founderNFTProxy,
            CATEGORY_NFT,
            "Founder NFT",
            "1.0.0",
            "Exclusive stakeable NFTs providing platform governance and fee distribution",
            permissions
        );

        console.log("    FounderNFT registered as extension");
        console.log("    Extension Key:", vm.toString(FOUNDER_NFT_KEY));
        console.log("    Category:", vm.toString(CATEGORY_NFT));

        // Verify registration
        address registeredAddress = registry.getExtension(FOUNDER_NFT_KEY);
        require(registeredAddress == result.founderNFTProxy, "Extension registration failed");
        console.log("    Registration verified");

        vm.stopBroadcast();
    }

    // ============================================================================
    // SALES ACTIVATION
    // ============================================================================

    function activateSales(address founderNFTProxy) internal {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log(" Activating NFT Sales...");

        FounderNFT founderNFT = FounderNFT(payable(founderNFTProxy));
        founderNFT.setSaleStatus(true);

        console.log("    Sales activated - users can now mint NFTs");

        vm.stopBroadcast();
    }

    // ============================================================================
    // INTEGRATION TESTING
    // ============================================================================

    function runIntegrationTests(
        DeploymentResult memory result, 
        Phase1Config memory config
    ) internal view {
        console.log(" Running Integration Tests...");

        PlatformRegistry registry = PlatformRegistry(payable(result.platformRegistryProxy));
        FounderNFT founderNFT = FounderNFT(payable(result.founderNFTProxy));

        // Test 1: Verify PlatformRegistry initialization
        console.log("  Testing PlatformRegistry initialization...");
        require(registry.getPlatformFeePercentage() == config.platformFeePercentage, "Platform fee mismatch");
        require(registry.getPlatformTreasury() == config.treasury, "Treasury mismatch");
        require(registry.hasRole(registry.ADMIN_ROLE(), config.deployer), "Admin role not granted");
        console.log("    PlatformRegistry initialization verified");

        // Test 2: Verify FounderNFT initialization
        console.log("  Testing FounderNFT initialization...");
        require(founderNFT.getMaxSupply() == config.maxSupply, "Max supply mismatch");
        require(founderNFT.getPrice() == config.price, "Price mismatch");
        require(founderNFT.getMinimumStakingPeriod() == config.minimumStakingPeriod, "Staking period mismatch");
        require(founderNFT.owner() == config.deployer, "Owner mismatch");
        console.log("    FounderNFT initialization verified");

        // Test 3: Verify extension registration
        console.log("  Testing extension registration...");
        require(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "Extension not registered");
        require(registry.getExtension(FOUNDER_NFT_KEY) == result.founderNFTProxy, "Extension address mismatch");
        require(registry.getFounderNFT() == result.founderNFTProxy, "Convenience getter failed");
        console.log("    Extension registration verified");

        // Test 4: Verify access controls
        console.log("  Testing access controls...");
        require(founderNFT.hasRole(founderNFT.PLATFORM_ROLE(), result.platformRegistryProxy), "Platform role not granted");
        require(registry.hasRole(registry.FEE_MANAGER_ROLE(), result.founderNFTProxy), "Fee manager role not granted");
        console.log("    Access controls verified");

        // Test 5: Verify sales status
        console.log("  Testing sales status...");
        if (config.activateSaleImmediately) {
            require(founderNFT.getSaleStatus(), "Sales not activated");
            console.log("    Sales status verified (active)");
        } else {
            require(!founderNFT.getSaleStatus(), "Sales should not be active");
            console.log("    Sales status verified (inactive)");
        }

        console.log("    All integration tests passed!");
    }

    // ============================================================================
    // LOGGING & DATA SAVING
    // ============================================================================

    function logDeploymentSummary(
        DeploymentResult memory result, 
        Phase1Config memory config
    ) internal pure {
        console.log(" Deployment Summary");
        console.log("================================================================");
        console.log(" Network:", result.networkName);
        console.log("  Chain ID:", result.chainId);
        console.log(" Block Number:", result.deploymentBlock);
        console.log(" Timestamp:", result.deploymentTimestamp);
        console.log("");
        console.log(" Deployed Contracts:");
        console.log("   PlatformRegistry Implementation:", result.platformRegistryImpl);
        console.log("   PlatformRegistry Proxy:        ", result.platformRegistryProxy);
        console.log("   FounderNFT Implementation:     ", result.founderNFTImpl);
        console.log("   FounderNFT Proxy:             ", result.founderNFTProxy);
        console.log("");
        console.log("  Configuration:");
        console.log("   Deployer:           ", config.deployer);
        console.log("   Treasury:           ", config.treasury);
        console.log("   Platform Fee:       ", config.platformFeePercentage, "bp");
        console.log("   NFT Max Supply:     ", config.maxSupply);
        console.log("   NFT Price:          ", config.price / 1e18, "ETH");
        console.log("   Min Staking Period: ", config.minimumStakingPeriod / 86400, "days");
        console.log("   Sales Active:       ", config.activateSaleImmediately ? "Yes" : "No");
        console.log("");
        console.log(" Next Steps:");
        console.log("   1. Verify contracts on block explorer");
        console.log("   2. Update frontend with new contract addresses");
        console.log("   3. Set up monitoring and alerts");
        console.log("   4. Test minting and staking functionality");
        console.log("   5. Prepare for Phase 2 project integration");
        console.log("");
        console.log(" Important Addresses:");
        console.log("   Main Registry:  ", result.platformRegistryProxy);
        console.log("   FounderNFT:     ", result.founderNFTProxy);
        console.log("   Treasury:       ", config.treasury);
    }

    function saveDeploymentData(
        DeploymentResult memory result, 
        Phase1Config memory config
    ) internal {
        console.log(" Saving deployment data...");

        // Create deployment directory if it doesn't exist
        string[] memory mkdirInputs = new string[](3);
        mkdirInputs[0] = "mkdir";
        mkdirInputs[1] = "-p";
        mkdirInputs[2] = "./deployments";
        vm.ffi(mkdirInputs);

        // Create deployment JSON data
        string memory deploymentData = string(
            abi.encodePacked(
                "{\n",
                '  "network": "', result.networkName, '",\n',
                '  "chainId": ', vm.toString(result.chainId), ',\n',
                '  "deploymentBlock": ', vm.toString(result.deploymentBlock), ',\n',
                '  "deploymentTimestamp": ', vm.toString(result.deploymentTimestamp), ',\n',
                '  "deployer": "', vm.toString(config.deployer), '",\n',
                '  "treasury": "', vm.toString(config.treasury), '",\n',
                '  "contracts": {\n',
                '    "platformRegistry": {\n',
                '      "implementation": "', vm.toString(result.platformRegistryImpl), '",\n',
                '      "proxy": "', vm.toString(result.platformRegistryProxy), '"\n',
                '    },\n',
                '    "founderNFT": {\n',
                '      "implementation": "', vm.toString(result.founderNFTImpl), '",\n',
                '      "proxy": "', vm.toString(result.founderNFTProxy), '"\n',
                '    }\n',
                '  },\n',
                '  "configuration": {\n',
                '    "platformFeePercentage": ', vm.toString(config.platformFeePercentage), ',\n',
                '    "maxSupply": ', vm.toString(config.maxSupply), ',\n',
                '    "price": "', vm.toString(config.price), '",\n',
                '    "minimumStakingPeriod": ', vm.toString(config.minimumStakingPeriod), ',\n',
                '    "salesActive": ', config.activateSaleImmediately ? "true" : "false", '\n',
                '    "platformFeeDistributionPercentage": ', vm.toString(config.platformFeeDistributionPercentage), ',\n',
                '    "daoTokenAllocationPercentage": ', vm.toString(config.daoTokenAllocationPercentage), '\n',
                '  }\n',
                '}'
            )
        );

        // Save to file
        string memory filename = string(
            abi.encodePacked("./deployments/phase1-", result.networkName, "-", vm.toString(result.deploymentTimestamp), ".json")
        );
        vm.writeFile(filename, deploymentData);
        console.log("    Deployment data saved to:", filename);

        // Also save a latest file for easy reference
        string memory latestFilename = string(
            abi.encodePacked("./deployments/phase1-", result.networkName, "-latest.json")
        );
        vm.writeFile(latestFilename, deploymentData);
        console.log("    Latest deployment saved to:", latestFilename);

        // Update .env file with deployed addresses
        updateEnvFile(result);
    }

    function updateEnvFile(DeploymentResult memory result) internal {
        console.log("    Updating .env file with deployed addresses...");
        
        try vm.writeFile(
            ".env.deployed",
            string(
                abi.encodePacked(
                    "# Phase 1 Deployment Addresses (", result.networkName, ")\n",
                    "PLATFORM_REGISTRY_PROXY=", vm.toString(result.platformRegistryProxy), "\n",
                    "PLATFORM_REGISTRY_IMPL=", vm.toString(result.platformRegistryImpl), "\n",
                    "FOUNDER_NFT_PROXY=", vm.toString(result.founderNFTProxy), "\n",
                    "FOUNDER_NFT_IMPL=", vm.toString(result.founderNFTImpl), "\n",
                    "DEPLOYMENT_BLOCK=", vm.toString(result.deploymentBlock), "\n",
                    "DEPLOYMENT_TIMESTAMP=", vm.toString(result.deploymentTimestamp), "\n",
                    "CHAIN_ID=", vm.toString(result.chainId), "\n",
                    "NETWORK_NAME=", result.networkName, "\n"
                )
            )
        ) {
            console.log("    Environment file updated: .env.deployed");
        } catch {
            console.log("     Could not update .env file (continuing anyway)");
        }
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

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
        if (chainId == 1337) return "anvil";

        return string(abi.encodePacked("chain-", vm.toString(chainId)));
    }
}