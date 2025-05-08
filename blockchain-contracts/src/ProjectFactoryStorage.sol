// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ProjectFactoryStorage
 * @dev Storage contract for ProjectFactory
 */
contract ProjectFactoryStorage {
    // Registry address
    address internal _platformRegistry;

    // Projects created by this factory
    address[] internal _createdProjects;

    // Implementation address for project proxies
    address internal _projectImplementation;

    // Reserved storage gap for future upgrades
    uint256[47] private __gap;
}
