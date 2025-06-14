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

        //Update env file with updated Platform registry proxy address
        updateEnvVariable("PLATFORM_REGISTRY_ADDRESS", addressToString(address(platformRegistryProxy)));

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

    function updateEnvVariable(string memory key, string memory value) internal {
        // Read the current .env file
        string memory currentEnv = vm.readFile(".env");

        // Split into lines
        string[] memory lines = vm.split(currentEnv, "\n");

        string memory updatedEnv = "";
        bool variableFound = false;
        string memory targetPrefix = string.concat(key, "=");

        // Process each line
        for (uint256 i = 0; i < lines.length; i++) {
            if (startsWith(lines[i], targetPrefix)) {
                // Replace the line with new value
                updatedEnv = string.concat(updatedEnv, key, "=", value, "\n");
                variableFound = true;
            } else {
                // Keep the existing line
                updatedEnv = string.concat(updatedEnv, lines[i], "\n");
            }
        }

        // If variable wasn't found, append it
        if (!variableFound) {
            updatedEnv = string.concat(updatedEnv, key, "=", value, "\n");
        }

        // Write the updated content back to .env
        vm.writeFile(".env", updatedEnv);
    }

    // Helper function to check if a string starts with a prefix
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);

        if (prefixBytes.length > strBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }

        return true;
    }

    function addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }

        return string(str);
    }
}
