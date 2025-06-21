# Phase 1 Deployment Guide - PlatformRegistry & FounderNFT

## 🎯 Overview

This guide covers the complete deployment of Phase 1 infrastructure: PlatformRegistry and FounderNFT contracts with full staking functionality. Phase 1 provides:

- **PlatformRegistry**: Central hub for platform management and fee distribution
- **FounderNFT**: Stakeable NFTs with continuous reward distribution
- **Immediate Utility**: 10% of mint proceeds benefit existing stakers
- **Future Ready**: Infrastructure prepared for Phase 2 project integration

## 📋 Prerequisites

### Development Environment
- **Foundry** installed and updated
- **Node.js** 18+ and npm
- **Git** for version control

### Network Configuration
- RPC endpoint for target network
- Private key with sufficient ETH for deployment
- Block explorer API key (for verification)

### Required Accounts
- **Deployer**: Deploys contracts, has admin rights initially
- **Treasury**: Receives platform fees and contract proceeds
- **Optional: Multisig**: For production governance

## 🔧 Environment Setup

### 1. Create Environment File

Create `.env` in your project root:

```bash
# Deployment Configuration
DEPLOYER_PRIVATE_KEY=0x...your_private_key...
TREASURY_ADDRESS=0x...treasury_address...

# Network Configuration (choose one)
# Mainnet
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Sepolia Testnet
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# Local
LOCALHOST_RPC_URL=http://127.0.0.1:8545

# FounderNFT Configuration
FOUNDER_NFT_MAX_SUPPLY=1000
FOUNDER_NFT_PRICE=100000000000000000  # 0.1 ETH in wei
PLATFORM_FEE_DISTRIBUTION_PERCENTAGE=2500  # 25% of platform fees to stakers
DAO_TOKEN_ALLOCATION_PERCENTAGE=1000  # 10% for future DAO token allocation
MINIMUM_STAKING_PERIOD=604800  # 7 days in seconds
ACTIVATE_SALE_IMMEDIATELY=true

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=500  # 5% platform fee
```

### 2. Network-Specific Configuration

Add to `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]

[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
sepolia = "${SEPOLIA_RPC_URL}"
localhost = "${LOCALHOST_RPC_URL}"

[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

## 🚀 Deployment Steps

### Step 1: Compile Contracts

```bash
# Clean and compile
forge clean
forge build

# Run tests to ensure everything works
forge test
```

### Step 2: Deploy to Testnet First

```bash
# Deploy to Sepolia testnet
forge script script/DeployPhase1.s.sol \
    --rpc-url sepolia \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

### Step 3: Test Deployment

```bash
# Run integration tests
forge script script/TestPhase1Deployment.s.sol \
    --rpc-url sepolia \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast
```

### Step 4: Deploy to Mainnet

```bash
# Deploy to mainnet (after testnet validation)
forge script script/DeployPhase1.s.sol \
    --rpc-url mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

## 📝 Post-Deployment Checklist

### Immediate Actions (Day 1)

- [ ] **Verify Contracts**: Check block explorer verification
- [ ] **Test Basic Functions**: Mint, stake, unstake operations
- [ ] **Check Fee Distribution**: Validate 10% mint redistribution
- [ ] **Access Control**: Verify admin roles and permissions
- [ ] **Emergency Controls**: Test pause/unpause functionality

### Configuration (Week 1)

- [ ] **Transfer Ownership**: Move to multisig if using one
- [ ] **Set Up Monitoring**: Track contract metrics and health
- [ ] **Documentation**: Update addresses in all documentation
- [ ] **Frontend Integration**: Connect frontend to deployed contracts
- [ ] **Community Communication**: Announce deployment

### Security (Ongoing)

- [ ] **Monitor Transactions**: Set up alerts for large operations
- [ ] **Regular Audits**: Check for unusual patterns
- [ ] **Backup Plans**: Prepare upgrade procedures if needed
- [ ] **Key Management**: Secure all administrative keys

## 🔍 Verification & Testing

### Contract Verification Commands

```bash
# Verify PlatformRegistry
forge verify-contract \
    --chain-id 1 \
    --num-of-optimizations 200 \
    --watch \
    --constructor-args $(cast abi-encode "constructor()") \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    $PLATFORM_REGISTRY_IMPLEMENTATION \
    src/PlatformRegistry.sol:PlatformRegistry

# Verify FounderNFT
forge verify-contract \
    --chain-id 1 \
    --num-of-optimizations 200 \
    --watch \
    --constructor-args $(cast abi-encode "constructor()") \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    $FOUNDER_NFT_IMPLEMENTATION \
    src/FounderNFT.sol:FounderNFT
```

### Manual Testing Scripts

```bash
# Test minting
cast send $FOUNDER_NFT_PROXY "mint()" \
    --value 0.1ether \
    --private-key $TEST_PRIVATE_KEY \
    --rpc-url $RPC_URL

# Test staking
cast send $FOUNDER_NFT_PROXY "stakeToken(uint256)" 0 \
    --private-key $TEST_PRIVATE_KEY \
    --rpc-url $RPC_URL

# Check rewards
cast call $FOUNDER_NFT_PROXY "earned(uint256)" 0 \
    --rpc-url $RPC_URL
```

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
- Check gas price and limit
- Verify RPC endpoint is working
- Ensure sufficient ETH balance

**Verification Fails**
- Wait a few minutes after deployment
- Check constructor arguments match
- Verify Solidity version matches

**Transactions Fail**
- Check contract is initialized
- Verify caller has correct permissions
- Ensure contract is not paused

### Emergency Procedures

**Contract Issues**
```bash
# Pause contracts if needed
cast send $PLATFORM_REGISTRY_PROXY "pause()" \
    --private-key $ADMIN_PRIVATE_KEY \
    --rpc-url $RPC_URL

cast send $FOUNDER_NFT_PROXY "pause()" \
    --private-key $ADMIN_PRIVATE_KEY \
    --rpc-url $RPC_URL
```

**Access Control Issues**
```bash
# Grant emergency admin access
cast send $PLATFORM_REGISTRY_PROXY \
    "grantRole(bytes32,address)" \
    $(cast keccak "ADMIN_ROLE") \
    $EMERGENCY_ADMIN \
    --private-key $CURRENT_ADMIN_KEY \
    --rpc-url $RPC_URL
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

**Platform Registry**
- Total registered extensions
- Platform fee percentage
- Fee distribution amounts
- Admin role changes

**FounderNFT**
- Total supply and max supply
- Number of staked tokens
- Current reward rate
- Total rewards distributed
- Average staking time

### Monitoring Commands

```bash
# Get current statistics
cast call $FOUNDER_NFT_PROXY "totalSupply()" --rpc-url $RPC_URL
cast call $FOUNDER_NFT_PROXY "getTotalStakedSupply()" --rpc-url $RPC_URL
cast call $FOUNDER_NFT_PROXY "getCurrentRewardRate()" --rpc-url $RPC_URL
cast call $PLATFORM_REGISTRY_PROXY "getPlatformFeePercentage()" --rpc-url $RPC_URL
```

## 🔄 Upgrade Procedures

Phase 1 contracts use UUPS upgradeable pattern:

```bash
# Deploy new implementation
NEW_IMPL=$(forge create src/FounderNFT.sol:FounderNFT \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --rpc-url $RPC_URL)

# Upgrade proxy to new implementation
cast send $FOUNDER_NFT_PROXY \
    "upgradeToAndCall(address,bytes)" \
    $NEW_IMPL \
    "0x" \
    --private-key $ADMIN_PRIVATE_KEY \
    --rpc-url $RPC_URL
```

## 📞 Support & Resources

### Documentation
- **Contracts**: `/docs/contracts/`
- **API Reference**: `/docs/api/`
- **Integration Guide**: `/docs/integration/`

### Community
- **Discord**: For real-time support
- **GitHub Issues**: For bug reports
- **Governance Forum**: For proposal discussions

### Emergency Contacts
- **Technical Lead**: [Contact Information]
- **Security Team**: [Contact Information]
- **Multisig Signers**: [Contact Information]

---

## ⚠️ Important Notes

1. **Never share private keys** or commit them to version control
2. **Test thoroughly** on testnet before mainnet deployment
3. **Have emergency procedures** ready before going live
4. **Monitor gas prices** for optimal deployment timing
5. **Keep backups** of all deployment information

This completes the Phase 1 deployment infrastructure. The system will be ready to mint NFTs, stake them for rewards, and seamlessly integrate with Phase 2 project functionality when ready.