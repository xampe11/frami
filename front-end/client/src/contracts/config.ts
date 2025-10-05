// Auto-generated contract configuration
// Generated at: 2025-10-05T19:28:32.614Z
// Network: localhost

export const contractConfig = {
  "network": "localhost",
  "chainId": 31337,
  "deploymentBlock": 0,
  "deploymentTimestamp": 1759691564,
  "contracts": {
    "founderNFT": {
      "proxy": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      "implementation": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      "abi": [
        {
          "type": "constructor",
          "inputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "receive",
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "ADMIN_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "BASIS_POINTS",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "DEFAULT_ADMIN_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "PLATFORM_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "PRECISION",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "SALES_REDISTRIBUTION_PERCENTAGE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "UPGRADER_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "UPGRADE_INTERFACE_VERSION",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "addEarlyAccessProject",
          "inputs": [
            {
              "name": "projectAddress",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "addPlatformFees",
          "inputs": [
            {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "approve",
          "inputs": [
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "balanceOf",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "batchMint",
          "inputs": [
            {
              "name": "recipients",
              "type": "address[]",
              "internalType": "address[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "claimAllRewards",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "claimMultipleRewards",
          "inputs": [
            {
              "name": "tokenIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "claimReward",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "earned",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getApproved",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getBaseAPR",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getCurrentRewardRate",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getDaoTokenAllocationPercentage",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getEstimatedAPR",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getLastUpdateTime",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getMaxSupply",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getMinimumStakingPeriod",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPlatformConfiguration",
          "inputs": [],
          "outputs": [
            {
              "name": "minimumStakingPeriod",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "baseAPR",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "performanceMultiplier",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "rewardCalculationPeriod",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "maxStakeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "emergencyWithdrawEnabled",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPlatformFeeDistributionPercentage",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPlatformRegistry",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPrice",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getRewardPerTokenStored",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getRewards",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getRoleAdmin",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getSaleStatus",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getSalesRedistributionPercentage",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "pure"
        },
        {
          "type": "function",
          "name": "getStakedByOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256[]",
              "internalType": "uint256[]"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getStakedCountByOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getStakingInfo",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "stakedSince",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "lastRewardsClaimed",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getStakingInfoBatch",
          "inputs": [
            {
              "name": "tokenIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
            }
          ],
          "outputs": [
            {
              "name": "owners",
              "type": "address[]",
              "internalType": "address[]"
            },
            {
              "name": "stakedAt",
              "type": "uint256[]",
              "internalType": "uint256[]"
            },
            {
              "name": "earnedRewards",
              "type": "uint256[]",
              "internalType": "uint256[]"
            },
            {
              "name": "canUnstake",
              "type": "bool[]",
              "internalType": "bool[]"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getTotalEarnedByOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getTotalSalesProceeds",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getTotalStakedSupply",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getUserRewardPerTokenPaid",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "grantRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "hasEarlyAccess",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "projectAddress",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "hasRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "hasStakedTokens",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "initialize",
          "inputs": [
            {
              "name": "initialOwner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "platformRegistry",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "maxSupply",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "price",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "platformFeeDistributionPercentage",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "daoTokenAllocationPercentage",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "minimumStakingPeriod",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "isApprovedForAll",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "isFounder",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "isTokenStaked",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "mint",
          "inputs": [],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "mintMultiple",
          "inputs": [
            {
              "name": "quantity",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "name",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "owner",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "ownerOf",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "proxiableUUID",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "removeEarlyAccessProject",
          "inputs": [
            {
              "name": "projectAddress",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "renounceOwnership",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "renounceRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "callerConfirmation",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "revokeRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "rewardPerToken",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "safeTransferFrom",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "safeTransferFrom",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "data",
              "type": "bytes",
              "internalType": "bytes"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setApprovalForAll",
          "inputs": [
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "approved",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setDaoTokenAllocationPercentage",
          "inputs": [
            {
              "name": "newPercentage",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setMinimumStakingPeriod",
          "inputs": [
            {
              "name": "newPeriod",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setPlatformFeeDistributionPercentage",
          "inputs": [
            {
              "name": "newPercentage",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setPrice",
          "inputs": [
            {
              "name": "newPrice",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setRewardRate",
          "inputs": [
            {
              "name": "newRate",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "setSaleStatus",
          "inputs": [
            {
              "name": "status",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "stakeMultipleTokens",
          "inputs": [
            {
              "name": "tokenIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "stakeToken",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "supportsInterface",
          "inputs": [
            {
              "name": "interfaceId",
              "type": "bytes4",
              "internalType": "bytes4"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "symbol",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "toggleEmergencyWithdraw",
          "inputs": [
            {
              "name": "enabled",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "tokenByIndex",
          "inputs": [
            {
              "name": "index",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "tokenOfOwnerByIndex",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "index",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "tokenURI",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "totalSupply",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "transferFrom",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "transferOwnership",
          "inputs": [
            {
              "name": "newOwner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "unstakeMultipleTokens",
          "inputs": [
            {
              "name": "tokenIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "unstakeToken",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updateBaseAPR",
          "inputs": [
            {
              "name": "newAPR",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updateMinimumStakingPeriod",
          "inputs": [
            {
              "name": "newPeriod",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updatePlatformConfiguration",
          "inputs": [
            {
              "name": "newMinimumStakingPeriod",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "newBaseAPR",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "newPerformanceMultiplier",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "newRewardCalculationPeriod",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "newMaxStakeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "newEmergencyWithdrawEnabled",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "upgradeToAndCall",
          "inputs": [
            {
              "name": "newImplementation",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "data",
              "type": "bytes",
              "internalType": "bytes"
            }
          ],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "function",
          "name": "withdraw",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "withdrawSalesProceeds",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "event",
          "name": "Approval",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "approved",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ApprovalForAll",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "operator",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "approved",
              "type": "bool",
              "indexed": false,
              "internalType": "bool"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "BaseAPRUpdated",
          "inputs": [
            {
              "name": "oldAPR",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "newAPR",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "updatedBy",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ConfigurationInitialized",
          "inputs": [
            {
              "name": "minimumStakingPeriod",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "baseAPR",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "performanceMultiplier",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "emergencyWithdrawEnabled",
              "type": "bool",
              "indexed": false,
              "internalType": "bool"
            },
            {
              "name": "timestamp",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ConfigurationUpdated",
          "inputs": [
            {
              "name": "minimumStakingPeriod",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "baseAPR",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "performanceMultiplier",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "rewardCalculationPeriod",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "maxStakeAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "emergencyWithdrawEnabled",
              "type": "bool",
              "indexed": false,
              "internalType": "bool"
            },
            {
              "name": "updatedBy",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "timestamp",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ETHReceived",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "EarlyAccessProjectAdded",
          "inputs": [
            {
              "name": "projectAddress",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "EarlyAccessProjectRemoved",
          "inputs": [
            {
              "name": "projectAddress",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "EmergencyWithdrawToggled",
          "inputs": [
            {
              "name": "enabled",
              "type": "bool",
              "indexed": false,
              "internalType": "bool"
            },
            {
              "name": "updatedBy",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "FounderNFTMinted",
          "inputs": [
            {
              "name": "to",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Initialized",
          "inputs": [
            {
              "name": "version",
              "type": "uint64",
              "indexed": false,
              "internalType": "uint64"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "MinimumStakingPeriodUpdated",
          "inputs": [
            {
              "name": "oldPeriod",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "newPeriod",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "updatedBy",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "OwnershipTransferred",
          "inputs": [
            {
              "name": "previousOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "newOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RewardAdded",
          "inputs": [
            {
              "name": "amount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "newRewardRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RewardClaimed",
          "inputs": [
            {
              "name": "user",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            },
            {
              "name": "amount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RewardRateUpdated",
          "inputs": [
            {
              "name": "oldRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "newRate",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleAdminChanged",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "previousAdminRole",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "newAdminRole",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleGranted",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "sender",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleRevoked",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "sender",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "TokenStaked",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "TokenUnstaked",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Transfer",
          "inputs": [
            {
              "name": "from",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "indexed": true,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Upgraded",
          "inputs": [
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "error",
          "name": "AccessControlBadConfirmation",
          "inputs": []
        },
        {
          "type": "error",
          "name": "AccessControlUnauthorizedAccount",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "neededRole",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ]
        },
        {
          "type": "error",
          "name": "AddressEmptyCode",
          "inputs": [
            {
              "name": "target",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "CannotTransferStakedToken",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC1967InvalidImplementation",
          "inputs": [
            {
              "name": "implementation",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC1967NonPayable",
          "inputs": []
        },
        {
          "type": "error",
          "name": "ERC721EnumerableForbiddenBatchMint",
          "inputs": []
        },
        {
          "type": "error",
          "name": "ERC721IncorrectOwner",
          "inputs": [
            {
              "name": "sender",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InsufficientApproval",
          "inputs": [
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InvalidApprover",
          "inputs": [
            {
              "name": "approver",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InvalidOperator",
          "inputs": [
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InvalidOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InvalidReceiver",
          "inputs": [
            {
              "name": "receiver",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721InvalidSender",
          "inputs": [
            {
              "name": "sender",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721NonexistentToken",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC721OutOfBoundsIndex",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "index",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "FailedCall",
          "inputs": []
        },
        {
          "type": "error",
          "name": "InsufficientPayment",
          "inputs": [
            {
              "name": "required",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "provided",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "InvalidConfigValue",
          "inputs": []
        },
        {
          "type": "error",
          "name": "InvalidInitialization",
          "inputs": []
        },
        {
          "type": "error",
          "name": "InvalidOwnerAddress",
          "inputs": []
        },
        {
          "type": "error",
          "name": "InvalidPercentage",
          "inputs": [
            {
              "name": "provided",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "InvalidQuantity",
          "inputs": [
            {
              "name": "provided",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "max",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "MaxSupplyReached",
          "inputs": []
        },
        {
          "type": "error",
          "name": "MinimumStakingPeriodNotMet",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "timeRemaining",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "NoRewardsToAdd",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NoRewardsToClaim",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NoSalesProceedsToWithdraw",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NoStakedTokens",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NoWithdrawableFunds",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NotInitializing",
          "inputs": []
        },
        {
          "type": "error",
          "name": "OwnableInvalidOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "OwnableUnauthorizedAccount",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ReentrancyGuardReentrantCall",
          "inputs": []
        },
        {
          "type": "error",
          "name": "SaleNotActive",
          "inputs": []
        },
        {
          "type": "error",
          "name": "TokenAlreadyStaked",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "TokenNotOwned",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "caller",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "TokenNotStaked",
          "inputs": [
            {
              "name": "tokenId",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "TooManyTokensInTransaction",
          "inputs": [
            {
              "name": "provided",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "max",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "type": "error",
          "name": "TransferFailed",
          "inputs": []
        },
        {
          "type": "error",
          "name": "UUPSUnauthorizedCallContext",
          "inputs": []
        },
        {
          "type": "error",
          "name": "UUPSUnsupportedProxiableUUID",
          "inputs": [
            {
              "name": "slot",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ]
        }
      ]
    },
    "platformRegistry": {
      "implementation": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "proxy": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "abi": [
        {
          "type": "function",
          "name": "ADMIN_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_FACTORY",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_GOVERNANCE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_NFT",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_ORACLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_TOKEN",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_TREASURY",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_UTILITY",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "CATEGORY_VALIDATOR",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "DEFAULT_ADMIN_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "FEE_MANAGER_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "FOUNDER_NFT",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "PROJECT_CREATOR_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "PROJECT_FACTORY",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "UPGRADER_ROLE",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "UPGRADE_INTERFACE_VERSION",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "activateExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "deactivateExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "deregisterProject",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "extensionExists",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "extensionHasPermission",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "permission",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "generateExtensionKey",
          "inputs": [
            {
              "name": "name",
              "type": "string",
              "internalType": "string"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "pure"
        },
        {
          "type": "function",
          "name": "getAllExtensions",
          "inputs": [],
          "outputs": [
            {
              "name": "keys",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            },
            {
              "name": "extensions",
              "type": "tuple[]",
              "internalType": "struct PlatformRegistry.ExtensionInfo[]",
              "components": [
                {
                  "name": "implementation",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "category",
                  "type": "bytes32",
                  "internalType": "bytes32"
                },
                {
                  "name": "isActive",
                  "type": "bool",
                  "internalType": "bool"
                },
                {
                  "name": "addedAt",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "name",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "version",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "description",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "permissions",
                  "type": "bytes32[]",
                  "internalType": "bytes32[]"
                }
              ]
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getAllProjects",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address[]",
              "internalType": "address[]"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getExtensionCount",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getExtensionInfo",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "tuple",
              "internalType": "struct PlatformRegistry.ExtensionInfo",
              "components": [
                {
                  "name": "implementation",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "category",
                  "type": "bytes32",
                  "internalType": "bytes32"
                },
                {
                  "name": "isActive",
                  "type": "bool",
                  "internalType": "bool"
                },
                {
                  "name": "addedAt",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "name",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "version",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "description",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "permissions",
                  "type": "bytes32[]",
                  "internalType": "bytes32[]"
                }
              ]
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getExtensionKey",
          "inputs": [
            {
              "name": "implementation",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getExtensionsByCategory",
          "inputs": [
            {
              "name": "category",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "keys",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            },
            {
              "name": "implementations",
              "type": "address[]",
              "internalType": "address[]"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getFeeDistribution",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "tuple",
              "internalType": "struct PlatformRegistry.FeeDistribution",
              "components": [
                {
                  "name": "founderNFTPercentage",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "treasuryPercentage",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getFounderNFT",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPlatformFeePercentage",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getPlatformTreasury",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getProjectFactory",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getRoleAdmin",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getTotalProjectsCreated",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "getVersion",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "string",
              "internalType": "string"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "grantRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "hasRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "initialize",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "initialPlatformFeePercentage",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "initialPlatformTreasury",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "isExtensionRegistered",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "isFactoryRegistered",
          "inputs": [
            {
              "name": "factory",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "isProjectRegistered",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "owner",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "address",
              "internalType": "address"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "pause",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "paused",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "proxiableUUID",
          "inputs": [],
          "outputs": [
            {
              "name": "",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "registerExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "implementation",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "category",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "name",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "version",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "description",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "permissions",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "registerProject",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "removeExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "renounceOwnership",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "renounceRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "callerConfirmation",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "revokeRole",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "supportsInterface",
          "inputs": [
            {
              "name": "interfaceId",
              "type": "bytes4",
              "internalType": "bytes4"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "bool",
              "internalType": "bool"
            }
          ],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "transferOwnership",
          "inputs": [
            {
              "name": "newOwner",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "unpause",
          "inputs": [],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updateFeeDistribution",
          "inputs": [
            {
              "name": "founderPercentage",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "treasuryPercentage",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updatePlatformFee",
          "inputs": [
            {
              "name": "newFee",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updatePlatformTreasury",
          "inputs": [
            {
              "name": "newTreasury",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "updateVersion",
          "inputs": [
            {
              "name": "newVersion",
              "type": "string",
              "internalType": "string"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "upgradeExtension",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "newImplementation",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "newVersion",
              "type": "string",
              "internalType": "string"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "upgradeToAndCall",
          "inputs": [
            {
              "name": "newImplementation",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "data",
              "type": "bytes",
              "internalType": "bytes"
            }
          ],
          "outputs": [],
          "stateMutability": "payable"
        },
        {
          "type": "event",
          "name": "ExtensionActivated",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ExtensionDeactivated",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ExtensionRegistered",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "category",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "name",
              "type": "string",
              "indexed": false,
              "internalType": "string"
            },
            {
              "name": "version",
              "type": "string",
              "indexed": false,
              "internalType": "string"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ExtensionRemoved",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ExtensionUpgraded",
          "inputs": [
            {
              "name": "extensionKey",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "oldImplementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "newImplementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "newVersion",
              "type": "string",
              "indexed": false,
              "internalType": "string"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "FeeDistributionUpdated",
          "inputs": [
            {
              "name": "founderPercentage",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "treasuryPercentage",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "FeesDistributed",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "totalFee",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "founderAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "treasuryAmount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Initialized",
          "inputs": [
            {
              "name": "version",
              "type": "uint64",
              "indexed": false,
              "internalType": "uint64"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "OwnershipTransferred",
          "inputs": [
            {
              "name": "previousOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "newOwner",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Paused",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "indexed": false,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "PlatformFeeUpdated",
          "inputs": [
            {
              "name": "oldFee",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            },
            {
              "name": "newFee",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "PlatformTreasuryUpdated",
          "inputs": [
            {
              "name": "oldTreasury",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "newTreasury",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ProjectCreated",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "creator",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ProjectDeregistered",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "ProjectRegistered",
          "inputs": [
            {
              "name": "project",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleAdminChanged",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "previousAdminRole",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "newAdminRole",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleGranted",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "sender",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "RoleRevoked",
          "inputs": [
            {
              "name": "role",
              "type": "bytes32",
              "indexed": true,
              "internalType": "bytes32"
            },
            {
              "name": "account",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            },
            {
              "name": "sender",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Unpaused",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "indexed": false,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "event",
          "name": "Upgraded",
          "inputs": [
            {
              "name": "implementation",
              "type": "address",
              "indexed": true,
              "internalType": "address"
            }
          ],
          "anonymous": false
        },
        {
          "type": "error",
          "name": "AccessControlBadConfirmation",
          "inputs": []
        },
        {
          "type": "error",
          "name": "AccessControlUnauthorizedAccount",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "neededRole",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ]
        },
        {
          "type": "error",
          "name": "AddressEmptyCode",
          "inputs": [
            {
              "name": "target",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC1967InvalidImplementation",
          "inputs": [
            {
              "name": "implementation",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ERC1967NonPayable",
          "inputs": []
        },
        {
          "type": "error",
          "name": "EnforcedPause",
          "inputs": []
        },
        {
          "type": "error",
          "name": "ExpectedPause",
          "inputs": []
        },
        {
          "type": "error",
          "name": "FailedCall",
          "inputs": []
        },
        {
          "type": "error",
          "name": "InvalidInitialization",
          "inputs": []
        },
        {
          "type": "error",
          "name": "NotInitializing",
          "inputs": []
        },
        {
          "type": "error",
          "name": "OwnableInvalidOwner",
          "inputs": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "OwnableUnauthorizedAccount",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ]
        },
        {
          "type": "error",
          "name": "ReentrancyGuardReentrantCall",
          "inputs": []
        },
        {
          "type": "error",
          "name": "UUPSUnauthorizedCallContext",
          "inputs": []
        },
        {
          "type": "error",
          "name": "UUPSUnsupportedProxiableUUID",
          "inputs": [
            {
              "name": "slot",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ]
        }
      ]
    }
  },
  "deployer": "",
  "treasury": ""
};

export const ADDRESSES = {
  FOUNDER_NFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  FOUNDER_NFT_IMPLEMENTATION: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  PLATFORM_REGISTRY: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
};

export const CHAIN_ID = 31337;
export const NETWORK = "localhost";
