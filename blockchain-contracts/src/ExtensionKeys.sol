// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ExtensionKeys
 * @dev Centralized constants library for all extension keys used across the platform
 * @notice This library ensures consistency and prevents typos in extension key usage
 * 
 * Usage:
 * import {ExtensionKeys} from "./libraries/ExtensionKeys.sol";
 * 
 * bytes32 key = ExtensionKeys.FOUNDER_NFT;
 * address extension = registry.getExtension(ExtensionKeys.FOUNDER_NFT);
 */
library ExtensionKeys {
    /// @dev Key for FounderNFT extension - handles fee distribution to stakers
    bytes32 public constant FOUNDER_NFT = keccak256("FOUNDER_NFT");
    
    /// @dev Key for ProjectFactory extension - creates new project instances
    bytes32 public constant PROJECT_FACTORY = keccak256("PROJECT_FACTORY");
    
    /// @dev Key for NFTFactory extension - creates project-specific NFTs
    bytes32 public constant NFT_FACTORY = keccak256("NFT_FACTORY");
    
    /// @dev Key for TokenFactory extension - creates project-specific tokens
    bytes32 public constant TOKEN_FACTORY = keccak256("TOKEN_FACTORY");
    
    /// @dev Key for Oracle extension - provides external data feeds
    bytes32 public constant ORACLE = keccak256("ORACLE");
    
    /// @dev Key for Validator extension - validates project milestones
    bytes32 public constant VALIDATOR = keccak256("VALIDATOR");
    
    /// @dev Key for Treasury extension - manages platform treasury functions
    bytes32 public constant TREASURY = keccak256("TREASURY");
    
    /// @dev Key for Governance extension - handles DAO governance
    bytes32 public constant GOVERNANCE = keccak256("GOVERNANCE");
    
    /**
     * @dev Returns all extension keys as an array for iteration
     * @return Array of all defined extension keys
     */
    function getAllKeys() internal pure returns (bytes32[] memory) {
        bytes32[] memory keys = new bytes32[](8);
        keys[0] = FOUNDER_NFT;
        keys[1] = PROJECT_FACTORY;
        keys[2] = NFT_FACTORY;
        keys[3] = TOKEN_FACTORY;
        keys[4] = ORACLE;
        keys[5] = VALIDATOR;
        keys[6] = TREASURY;
        keys[7] = GOVERNANCE;
        return keys;
    }
    
    /**
     * @dev Returns human-readable name for an extension key
     * @param key The extension key to get name for
     * @return Human-readable name of the extension
     */
    function getExtensionName(bytes32 key) internal pure returns (string memory) {
        if (key == FOUNDER_NFT) return "FounderNFT";
        if (key == PROJECT_FACTORY) return "ProjectFactory";
        if (key == NFT_FACTORY) return "NFTFactory";
        if (key == TOKEN_FACTORY) return "TokenFactory";
        if (key == ORACLE) return "Oracle";
        if (key == VALIDATOR) return "Validator";
        if (key == TREASURY) return "Treasury";
        if (key == GOVERNANCE) return "Governance";
        return "Unknown";
    }
    
    /**
     * @dev Validates if a key is a known extension key
     * @param key The key to validate
     * @return True if the key is a known extension key
     */
    function isValidExtensionKey(bytes32 key) internal pure returns (bool) {
        return key == FOUNDER_NFT ||
               key == PROJECT_FACTORY ||
               key == NFT_FACTORY ||
               key == TOKEN_FACTORY ||
               key == ORACLE ||
               key == VALIDATOR ||
               key == TREASURY ||
               key == GOVERNANCE;
    }
}