// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "../src/proxy/ERC1967Proxy.sol";
import {ProxyAdmin} from "../src/proxy/ProxyAdmin.sol";
import {PlatformRegistry} from "../src/PlatformRegistry.sol";
import {Project} from "../src/Project.sol";
import {ProjectFactory} from "../src/ProjectFactory.sol";

contract DeployUpgradeableScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ProxyAdmin for managing proxies
        ProxyAdmin proxyAdmin = new ProxyAdmin(deployer);
        console.log("ProxyAdmin deployed at:", address(proxyAdmin));

        // Deploy implementation contracts
        PlatformRegistry platformRegistryImpl = new PlatformRegistry();
        console.log("PlatformRegistry implementation deployed at:", address(platformRegistryImpl));

        ProjectFactory projectFactoryImpl = new ProjectFactory();
        console.log("ProjectFactory implementation deployed at:", address(projectFactoryImpl));

        Project projectImpl = new Project();
        console.log("Project implementation deployed at:", address(projectImpl));

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

        // Deploy Project Factory proxy
        bytes memory projectFactoryData = abi.encodeWithSelector(
            ProjectFactory.initialize.selector,
            deployer, // initialOwner
            address(platformRegistryProxy), // registry address
            address(projectImpl) // project implementation
        );

        ERC1967Proxy projectFactoryProxy = new ERC1967Proxy(address(projectFactoryImpl), projectFactoryData);
        console.log("ProjectFactory proxy deployed at:", address(projectFactoryProxy));

        // Update registry with factory address
        PlatformRegistry platformRegistry = PlatformRegistry(payable(address(platformRegistryProxy)));
        platformRegistry.updateProjectFactory(address(projectFactoryProxy));
        console.log("Updated PlatformRegistry with ProjectFactory address");

        // Grant roles for various contracts

        // Grant ProjectFactory registry access
        ProjectFactory projectFactory = ProjectFactory(address(projectFactoryProxy));
        projectFactory.grantRole(projectFactory.ADMIN_ROLE(), address(platformRegistryProxy));
        console.log("Granted ADMIN_ROLE to PlatformRegistry in ProjectFactory");

        // Optional: Grant additional roles to deployer or other addresses
        platformRegistry.grantProjectCreatorRole(deployer);
        console.log("Granted PROJECT_CREATOR_ROLE to deployer in PlatformRegistry");

        // Optional: Transfer proxy admin ownership to a multisig in production
        // proxyAdmin.transferOwnership(multiSigAddress);

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("Next steps:");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Configure additional roles and permissions");
        console.log("3. Set up frontend to interact with deployed contracts");
    }
}
