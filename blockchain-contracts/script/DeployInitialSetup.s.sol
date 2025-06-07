// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "../src/proxy/ERC1967Proxy.sol";
import {ProxyAdmin} from "../src/proxy/ProxyAdmin.sol";
import {PlatformRegistry} from "../src/PlatformRegistry.sol";
import {Project} from "../src/Project.sol";
import {ProjectFactory} from "../src/ProjectFactory.sol";

contract DeployInitialSetup is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ProxyAdmin for managing proxies
        ProxyAdmin proxyAdmin = new ProxyAdmin(deployer);
        console.log("ProxyAdmin deployed at:", address(proxyAdmin));

        // Deploy implementation contracts
        PlatformRegistry platformRegistryImpl = new PlatformRegistry();
        console.log("PlatformRegistry implementation deployed at:", address(platformRegistryImpl));

        // Treasury address - you can use a separate address in production
        address treasury = deployer;

        // Deploy Platform Registry proxy
        bytes memory platformRegistryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            deployer, // initialOwner
            500, // 5% platform fee
            treasury, // treasury address
            address(0) // factory address (will be updated after deployment)
        );

        ERC1967Proxy platformRegistryProxy = new ERC1967Proxy(address(platformRegistryImpl), platformRegistryData);
        console.log("PlatformRegistry proxy deployed at:", address(platformRegistryProxy));

        // Save deployment addresses to file
        saveDeploymentAddresses(address(platformRegistryImpl), address(platformRegistryProxy));

        // Update registry with factory address

        // Grant roles for various contracts

        // Optional: Transfer proxy admin ownership to a multisig in production
        // proxyAdmin.transferOwnership(multiSigAddress);

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("Next steps:");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Configure additional roles and permissions");
        console.log("3. Set up frontend to interact with deployed contracts");
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
                '  "PlatformRegistry": {\n',
                '    "implementation": "',
                vm.toString(implementation),
                '",\n',
                '    "proxy": "',
                vm.toString(proxy),
                '"\n',
                "  }\n",
                "}"
            )
        );

        string memory filename = string(abi.encodePacked("./deployments/platformregistry-", networkName, ".json"));

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
