#!/bin/bash

# =============================================================================
# PHASE 1 DEPLOYMENT SCRIPTS
# =============================================================================
# Collection of deployment commands for different networks and scenarios

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo "Please copy .env.template to .env and configure it first."
        exit 1
    fi
    print_success ".env file found"
}

check_foundry() {
    if ! command -v forge &> /dev/null; then
        print_error "Foundry not found!"
        echo "Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
        exit 1
    fi
    print_success "Foundry is installed"
}

check_balance() {
    local network=$1
    local min_balance=${2:-0.5} # Default 0.5 ETH minimum
    
    print_header "Checking Deployer Balance on $network"
    
    # Load environment variables
    source .env
    
    # Get deployer address
    local deployer_address=$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)
    echo "Deployer address: $deployer_address"
    
    # Get RPC URL based on network
    local rpc_url=""
    case $network in
        "mainnet")
            rpc_url=$MAINNET_RPC_URL
            ;;
        "sepolia")
            rpc_url=$SEPOLIA_RPC_URL
            ;;
        "polygon")
            rpc_url=$POLYGON_RPC_URL
            ;;
        "arbitrum")
            rpc_url=$ARBITRUM_RPC_URL
            ;;
        "base")
            rpc_url=$BASE_RPC_URL
            ;;
        "localhost")
            rpc_url=$LOCALHOST_RPC_URL
            ;;
        *)
            print_error "Unknown network: $network"
            exit 1
            ;;
    esac
    
    # Check balance
    local balance=$(cast balance $deployer_address --rpc-url $rpc_url --ether)
    echo "Current balance: $balance ETH"
    
    # Compare with minimum
    if (( $(echo "$balance < $min_balance" | bc -l) )); then
        print_error "Insufficient balance! Need at least $min_balance ETH, have $balance ETH"
        exit 1
    else
        print_success "Sufficient balance for deployment"
    fi
}

compile_contracts() {
    print_header "Compiling Contracts"
    
    forge clean
    forge build
    
    if [ $? -eq 0 ]; then
        print_success "Contracts compiled successfully"
    else
        print_error "Contract compilation failed"
        exit 1
    fi
}

run_tests() {
    print_header "Running Tests"
    
    forge test
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_to_network() {
    local network=$1
    local verify=${2:-true}
    
    print_header "Deploying Phase 1 to $network"
    
    # Check prerequisites
    check_env_file
    check_foundry
    compile_contracts
    
    # Check balance (higher requirement for mainnet)
    if [ "$network" = "mainnet" ]; then
        check_balance $network 1.0
    else
        check_balance $network 0.1
    fi
    
    # Load environment variables
    source .env
    
    # Build deployment command
    local cmd="forge script script/DeployPhase1.s.sol --rpc-url $network --private-key \$DEPLOYER_PRIVATE_KEY --broadcast --ffi"
    
    # Add verification if requested and not localhost
    if [ "$verify" = "true" ] && [ "$network" != "localhost" ]; then
        case $network in
            "mainnet")
                cmd="$cmd --verify --etherscan-api-key \$ETHERSCAN_API_KEY"
                ;;
            "sepolia")
                cmd="$cmd --verify --etherscan-api-key \$ETHERSCAN_API_KEY"
                ;;
            "polygon")
                cmd="$cmd --verify --etherscan-api-key \$POLYGON_API_KEY"
                ;;
            "arbitrum")
                cmd="$cmd --verify --etherscan-api-key \$ARBITRUM_API_KEY"
                ;;
            "base")
                cmd="$cmd --verify --etherscan-api-key \$BASE_API_KEY"
                ;;
        esac
    fi
    
    echo "Executing deployment command..."
    echo "$cmd"
    echo
    
    # Confirm deployment
    if [ "$network" = "mainnet" ]; then
        print_warning "You are about to deploy to MAINNET!"
        read -p "Are you absolutely sure? Type 'DEPLOY' to continue: " confirmation
        if [ "$confirmation" != "DEPLOY" ]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Execute deployment
    eval $cmd
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully!"
        
        # Run post-deployment tests
        echo
        read -p "Run post-deployment tests? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            test_deployment $network
        fi
        
        # Display next steps
        show_next_steps $network
        
    else
        print_error "Deployment failed!"
        exit 1
    fi
}

test_deployment() {
    local network=$1
    
    print_header "Testing Deployment on $network"
    
    # Check if deployment addresses are available
    if [ ! -f .env.deployed ]; then
        print_error "Deployment addresses not found!"
        echo "Make sure deployment completed successfully and .env.deployed was created."
        exit 1
    fi
    
    # Load deployment addresses
    source .env.deployed
    
    # Run integration tests
    local test_cmd="forge script script/TestPhase1Deployment.s.sol --rpc-url $network --private-key \$DEPLOYER_PRIVATE_KEY --broadcast"
    
    echo "Executing test command..."
    eval $test_cmd
    
    if [ $? -eq 0 ]; then
        print_success "All deployment tests passed!"
    else
        print_error "Some tests failed!"
        exit 1
    fi
}

show_next_steps() {
    local network=$1
    
    print_header "Next Steps"
    
    echo "1. 📝 Verify contracts on block explorer"
    echo "2. 🔧 Update frontend configuration with new addresses"
    echo "3. 📊 Set up monitoring and alerts"
    echo "4. 🧪 Test minting and staking functionality manually"
    echo "5. 📢 Announce deployment to community"
    echo "6. 🛡️  Consider transferring ownership to multisig (for production)"
    echo
    
    if [ -f .env.deployed ]; then
        echo "📋 Deployed Addresses (from .env.deployed):"
        cat .env.deployed
        echo
    fi
    
    echo "📚 Important files:"
    echo "   - Deployment data: ./deployments/phase1-$network-latest.json"
    echo "   - Environment backup: .env.deployed"
    echo "   - Deployment logs: Check console output above"
    echo
}

# =============================================================================
# MAIN MENU FUNCTIONS
# =============================================================================

show_menu() {
    print_header "Phase 1 Deployment Menu"
    echo "Select deployment option:"
    echo
    echo "🧪 TESTNETS:"
    echo "1) Deploy to Sepolia (recommended for testing)"
    echo "2) Deploy to Local network (anvil)"
    echo
    echo "🚀 MAINNETS:"
    echo "3) Deploy to Ethereum Mainnet"
    echo "4) Deploy to Polygon"
    echo "5) Deploy to Arbitrum"
    echo "6) Deploy to Base"
    echo
    echo "🔧 UTILITIES:"
    echo "7) Compile contracts only"
    echo "8) Run tests only"
    echo "9) Test existing deployment"
    echo "10) Check deployer balance"
    echo
    echo "0) Exit"
    echo
}

handle_menu_choice() {
    local choice=$1
    
    case $choice in
        1)
            deploy_to_network "sepolia"
            ;;
        2)
            print_warning "Make sure anvil is running in another terminal!"
            read -p "Continue? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_to_network "localhost" false
            fi
            ;;
        3)
            deploy_to_network "mainnet"
            ;;
        4)
            deploy_to_network "polygon"
            ;;
        5)
            deploy_to_network "arbitrum"
            ;;
        6)
            deploy_to_network "base"
            ;;
        7)
            compile_contracts
            ;;
        8)
            run_tests
            ;;
        9)
            echo "Enter network name (mainnet/sepolia/polygon/arbitrum/base/localhost):"
            read network
            test_deployment $network
            ;;
        10)
            echo "Enter network name (mainnet/sepolia/polygon/arbitrum/base/localhost):"
            read network
            check_balance $network
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice: $choice"
            ;;
    esac
}

# =============================================================================
# DIRECT COMMAND FUNCTIONS (for CI/CD)
# =============================================================================

deploy_sepolia() {
    deploy_to_network "sepolia"
}

deploy_mainnet() {
    deploy_to_network "mainnet"
}

deploy_polygon() {
    deploy_to_network "polygon"
}

deploy_arbitrum() {
    deploy_to_network "arbitrum"
}

deploy_base() {
    deploy_to_network "base"
}

deploy_localhost() {
    deploy_to_network "localhost" false
}

# =============================================================================
# EMERGENCY FUNCTIONS
# =============================================================================

emergency_pause() {
    local network=$1
    
    print_header "Emergency Pause Contracts"
    print_warning "This will pause PlatformRegistry and disable FounderNFT sales!"
    
    read -p "Are you sure? Type 'PAUSE' to continue: " confirmation
    if [ "$confirmation" != "PAUSE" ]; then
        print_error "Operation cancelled"
        exit 1
    fi
    
    # Load deployment addresses
    source .env.deployed
    
    # Pause PlatformRegistry
    echo "Pausing PlatformRegistry..."
    cast send $PLATFORM_REGISTRY_PROXY "pause()" --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $network
    
    # Disable FounderNFT sales (FounderNFT doesn't have direct pause function)
    echo "Disabling FounderNFT sales..."
    cast send $FOUNDER_NFT_PROXY "setSaleStatus(bool)" false --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $network
    
    print_success "Emergency measures activated successfully"
    echo "- PlatformRegistry is paused"
    echo "- FounderNFT sales are disabled"
}

emergency_unpause() {
    local network=$1
    
    print_header "Emergency Unpause Contracts"
    
    # Load deployment addresses
    source .env.deployed
    
    # Unpause PlatformRegistry
    echo "Unpausing PlatformRegistry..."
    cast send $PLATFORM_REGISTRY_PROXY "unpause()" --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $network
    
    # Re-enable FounderNFT sales
    echo "Re-enabling FounderNFT sales..."
    cast send $FOUNDER_NFT_PROXY "setSaleStatus(bool)" true --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $network
    
    print_success "Contracts restored to normal operation"
    echo "- PlatformRegistry is unpaused"
    echo "- FounderNFT sales are enabled"
}

# =============================================================================
# MAIN SCRIPT LOGIC
# =============================================================================

main() {
    # Check if specific function was called
    if [ $# -gt 0 ]; then
        case $1 in
            "sepolia")
                deploy_sepolia
                ;;
            "mainnet")
                deploy_mainnet
                ;;
            "polygon")
                deploy_polygon
                ;;
            "arbitrum")
                deploy_arbitrum
                ;;
            "base")
                deploy_base
                ;;
            "localhost")
                deploy_localhost
                ;;
            "test")
                if [ $# -gt 1 ]; then
                    test_deployment $2
                else
                    echo "Usage: $0 test <network>"
                    exit 1
                fi
                ;;
            "compile")
                compile_contracts
                ;;
            "balance")
                if [ $# -gt 1 ]; then
                    check_balance $2
                else
                    echo "Usage: $0 balance <network>"
                    exit 1
                fi
                ;;
            "pause")
                if [ $# -gt 1 ]; then
                    emergency_pause $2
                else
                    echo "Usage: $0 pause <network>"
                    exit 1
                fi
                ;;
            "unpause")
                if [ $# -gt 1 ]; then
                    emergency_unpause $2
                else
                    echo "Usage: $0 unpause <network>"
                    exit 1
                fi
                ;;
            "--help"|"-h")
                echo "Phase 1 Deployment Script"
                echo
                echo "Usage:"
                echo "  $0                    # Interactive menu"
                echo "  $0 <network>          # Deploy to specific network"
                echo "  $0 test <network>     # Test existing deployment"
                echo "  $0 compile            # Compile contracts only"
                echo "  $0 balance <network>  # Check deployer balance"
                echo "  $0 pause <network>    # Emergency pause contracts"
                echo "  $0 unpause <network>  # Emergency unpause contracts"
                echo
                echo "Supported networks: sepolia, mainnet, polygon, arbitrum, base, localhost"
                exit 0
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Use '$0 --help' for usage information"
                exit 1
                ;;
        esac
    else
        # Interactive mode
        while true; do
            show_menu
            read -p "Enter your choice (0-10): " choice
            echo
            handle_menu_choice $choice
            echo
            read -p "Press Enter to continue..."
            clear
        done
    fi
}

# Run main function with all arguments
main "$@"