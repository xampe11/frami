// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Project.sol";

contract PlatformRegistry is Ownable, Pausable {
    // Platform configuration
    uint256 public platformFeePercentage;
    address public platformTreasury;
    address public verificationOracle;

    // Project tracking
    mapping(address => bool) public registeredProjects;
    address[] public allProjects;

    // Supported funding tokens (could start with just ETH/native)
    mapping(address => bool) public supportedTokens;

    // Events
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event PlatformFeeUpdated(uint256 newFee);
    event FundsWithdrawn(uint256 amount);

    // Constructor sets initial platform fee and treasury
    constructor(uint256 _initialFee, address _treasury, address _oracle) Ownable(msg.sender) Pausable() {
        platformFeePercentage = _initialFee;
        platformTreasury = _treasury;
        verificationOracle = _oracle;
    }

    // Create new project with factory pattern
    function createProject(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        bool _isFlexibleFunding,
        address[] memory _teamMembers
    ) external whenNotPaused returns (address) {
        // Create new project contract
        Project newProject = new Project(
            msg.sender,
            _name,
            _description,
            _fundingGoal,
            _duration,
            _isFlexibleFunding,
            platformFeePercentage,
            platformTreasury,
            verificationOracle,
            address(this)
        );

        // Register project in platform
        address projectAddress = address(newProject);
        registeredProjects[projectAddress] = true;
        allProjects.push(projectAddress);

        // Add team members
        for (uint256 i = 0; i < _teamMembers.length; i++) {
            newProject.addTeamMember(_teamMembers[i]);
        }

        // Transfer ownership to creator
        newProject.transferOwnership(msg.sender);

        emit ProjectCreated(projectAddress, msg.sender);
        return projectAddress;
    }

    // Administrative functions
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // max 10%
        platformFeePercentage = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function updateTreasury(address _newTreasury) external onlyOwner {
        platformTreasury = _newTreasury;
    }

    function updateVerificationOracle(address _newOracle) external onlyOwner {
        verificationOracle = _newOracle;
    }

    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    // Emergency functions
    function pausePlatform() external onlyOwner {
        _pause();
    }

    function unpausePlatform() external onlyOwner {
        _unpause();
    }

    // Getter functions
    function getProjectCount() external view returns (uint256) {
        return allProjects.length;
    }

    function isProjectRegistered(address _project) external view returns (bool) {
        return registeredProjects[_project];
    }
}
