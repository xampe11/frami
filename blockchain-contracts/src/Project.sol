// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ProjectStorage} from "./ProjectStorage.sol";
import {ExtensionKeys} from "./ExtensionKeys.sol";

/**
 * @title IFounderNFT
 * @dev Interface for the FounderNFT contract
 */
interface IFounderNFT {
    function getPlatformFeeDistributionPercentage() external view returns (uint256);
    function getTotalStakedTokens() external view returns (uint256);
    function addPlatformFees(uint256 amount) external;
}

/**
 * @title IPlatformRegistry
 * @dev Interface for the PlatformRegistry with extension registry and relay functionality
 */
interface IPlatformRegistry {
    function getExtension(bytes32 extensionType) external view returns (address);
    function relayFounderFees(uint256 amount) external payable;
    function isProjectRegistered(address project) external view returns (bool);
    function getEmergencyStatus() external view returns (bool frozen, address emergencyRecipient);
    function isFactoryRegistered(address factory) external view returns (bool);
}

/**
 * @title Project
 * @dev Upgradeable project contract for fundraising with standardized extension integration
 */
contract Project is
    Initializable,
    ProjectStorage,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");

    // Events
    event FundingReceived(address indexed investor, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 fundingPercentage);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event MilestoneVoteReceived(uint256 indexed milestoneId, address indexed investor);
    event FundsWithdrawn(uint256 amount, address recipient);
    event ProjectStateChanged(State newState);
    event RefundIssued(address indexed investor, uint256 amount);
    event TeamMemberAdded(address indexed member);
    event TeamMemberRemoved(address indexed member);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the project
     */
    function initialize(
        address creator,
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 duration,
        bool isFlexibleFunding,
        uint256 platformFeePercentage,
        address platformTreasury,
        address platformRegistry,
        address[] memory teamMembers
    ) external initializer {
        // Validate factory using standardized check
        require(
            IPlatformRegistry(platformRegistry).isFactoryRegistered(msg.sender),
            "Only registered factories can initialize projects"
        );

        __Ownable_init(creator);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _name = name;
        _description = description;
        _creator = creator;
        _fundingGoal = fundingGoal;
        _deadline = block.timestamp + duration;
        _isFlexibleFunding = isFlexibleFunding;
        _platformFeePercentage = platformFeePercentage;
        _platformTreasury = platformTreasury;
        _platformRegistry = platformRegistry;
        _state = State.Active;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, creator);
        _grantRole(ADMIN_ROLE, creator);
        _grantRole(UPGRADER_ROLE, creator);
        _grantRole(TEAM_MEMBER_ROLE, creator);

        // Add creator as team member
        _teamMembers[creator] = true;

        // Add additional team members
        for (uint256 i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i] != creator) {
                _teamMembers[teamMembers[i]] = true;
                _grantRole(TEAM_MEMBER_ROLE, teamMembers[i]);
                emit TeamMemberAdded(teamMembers[i]);
            }
        }
    }

    // ... [All the existing modifiers and functions remain the same until releaseMilestoneFunds]

    /**
     * @dev Release funds for completed milestone with enhanced fee distribution
     */
    function releaseMilestoneFunds(uint256 milestoneId) external onlyRole(TEAM_MEMBER_ROLE) nonReentrant {
        require(milestoneId < _milestoneCount, "Invalid milestone");
        require(_milestones[milestoneId].completed, "Milestone not completed");
        require(!_milestones[milestoneId].fundsReleased, "Funds already released");
        require(_state == State.Successful, "Project not successful");
        require(_milestones[milestoneId].votesReceived >= _milestones[milestoneId].votesNeeded, "Not enough votes");

        // CHECK 1: Emergency freeze validation
        (bool frozen,) = IPlatformRegistry(_platformRegistry).getEmergencyStatus();
        require(!frozen, "Fee distribution frozen");

        _milestones[milestoneId].fundsReleased = true;

        // Calculate funds to release based on percentage
        uint256 releaseAmount = (_totalFundsRaised * _milestones[milestoneId].fundingPercentage) / 10000;
        uint256 platformFee = (releaseAmount * _platformFeePercentage) / 10000;

        // CHECK 2: Get FounderNFT extension using standardized key
        address foundersNFTAddress = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.FOUNDER_NFT);
        
        uint256 founderShare = 0;
        uint256 treasuryAmount = platformFee;

        // Enhanced fee distribution logic
        if (foundersNFTAddress != address(0)) {
            // FounderNFT is registered, attempt to distribute fees
            try IFounderNFT(foundersNFTAddress).getPlatformFeeDistributionPercentage() returns (
                uint256 founderPercentage
            ) {
                // Calculate founder share
                founderShare = (platformFee * founderPercentage) / 10000;

                if (founderShare > 0) {
                    // Check if there are staked tokens
                    try IFounderNFT(foundersNFTAddress).getTotalStakedTokens() returns (uint256 stakedTokens) {
                        if (stakedTokens > 0) {
                            // Use the registry's relay function to send fees to FounderNFT
                            treasuryAmount = platformFee - founderShare;

                            try IPlatformRegistry(_platformRegistry).relayFounderFees{value: founderShare}(founderShare)
                            {
                                // Successfully relayed fees through the registry
                            } catch {
                                // If relay fails, send all fees to treasury
                                treasuryAmount = platformFee;
                                founderShare = 0;
                            }
                        }
                    } catch {
                        // If call fails, send all fees to treasury
                        treasuryAmount = platformFee;
                        founderShare = 0;
                    }
                }
            } catch {
                // If call fails, send all fees to treasury
                treasuryAmount = platformFee;
                founderShare = 0;
            }
        }

        // Update withdrawn funds
        _totalFundsWithdrawn += releaseAmount;

        // Send platform fee to treasury (minus founder share if applicable)
        (bool feeSuccess,) = _platformTreasury.call{value: treasuryAmount}("");
        require(feeSuccess, "Fee transfer failed");

        // Send funds to creator
        uint256 creatorAmount = releaseAmount - platformFee;
        (bool success,) = _creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(releaseAmount, _creator);
    }

    /**
     * @dev Set the project's NFT contract address (uses extension validation)
     */
    function setProjectNFTContract(address nftContract) external onlyRole(ADMIN_ROLE) {
        require(_projectNFTContract == address(0), "NFT contract already set");
        
        // Optional: Validate that the NFT contract is from a registered factory
        address nftFactory = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.NFT_FACTORY);
        if (nftFactory != address(0)) {
            // Could add validation logic here if needed
        }
        
        _projectNFTContract = nftContract;
    }

    /**
     * @dev Set the project's token contract address (uses extension validation)
     */
    function setProjectTokenContract(address tokenContract) external onlyRole(ADMIN_ROLE) {
        require(_projectTokenContract == address(0), "Token contract already set");
        
        // Optional: Validate that the token contract is from a registered factory
        address tokenFactory = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.TOKEN_FACTORY);
        if (tokenFactory != address(0)) {
            // Could add validation logic here if needed
        }
        
        _projectTokenContract = tokenContract;
    }

    // ... [Rest of the existing functions remain unchanged]

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}