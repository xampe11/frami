#!/bin/bash

# Exit on error but show where it fails
set -e
trap 'echo "Error on line $LINENO"' ERR

echo "========================================="
echo "Starting Environment Reset"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ========================================
# PART 1: Reset Blockchain
# ========================================
print_step "Checking for running Anvil instance..."

# Check if anvil is running on port 8545
ANVIL_PID=$(lsof -ti:8545 2>/dev/null || true)

if [ -n "$ANVIL_PID" ]; then
    print_warning "Anvil is running (PID: $ANVIL_PID). Stopping it..."
    kill -9 $ANVIL_PID
    sleep 2
    print_step "Anvil stopped successfully"
else
    print_step "No Anvil instance running"
fi

# Navigate to blockchain-contracts folder
print_step "Navigating to blockchain-contracts folder..."
cd blockchain-contracts || { print_error "blockchain-contracts folder not found!"; exit 1; }

# Start Anvil in the background
print_step "Starting Anvil blockchain..."
nohup anvil --host 0.0.0.0 --port 8545 > anvil.log 2>&1 &
ANVIL_NEW_PID=$!
echo "Anvil PID: $ANVIL_NEW_PID"

# Wait for Anvil to be ready
print_step "Waiting for Anvil to start..."
sleep 3

# Verify Anvil is running
if ! lsof -ti:8545 > /dev/null 2>&1; then
    print_error "Anvil failed to start! Check anvil.log for details"
    exit 1
fi

print_step "Anvil started successfully (PID: $ANVIL_NEW_PID)"

# Deploy Phase 1
print_step "Deploying Phase 1 contracts..."
forge script script/DeployPhase1.s.sol --rpc-url http://0.0.0.0:8545 --ffi --broadcast

# Activate Sale
print_step "Activating sale..."
forge script script/ActivateSale.s.sol --rpc-url http://0.0.0.0:8545 --ffi --broadcast

# Update front and backend
print_step "Updating front and backend..."
npx hardhat run script/update-front-and-backend.ts

# Return to root directory
cd ..

# ========================================
# PART 2: Reset GraphQL Server
# ========================================
print_step "Navigating to graphql folder..."
cd graphql || { print_error "graphql folder not found!"; exit 1; }

print_step "Stopping Docker containers..."
docker compose down -v

print_step "Removing data directory..."
sudo rm -rf data/

print_step "Creating data directories..."
mkdir -p data/ipfs data/postgres

print_step "Starting Docker containers..."
docker compose up -d

print_step "Waiting for services to initialize (10 seconds)..."
sleep 10

print_step "Building GraphQL server..."
npm run build

print_step "Creating local GraphQL setup..."
npm run create-local

print_step "Deploying to local..."
npm run deploy-local

# Return to root directory
cd ..

echo "========================================="
echo -e "${GREEN}Environment Reset Complete!${NC}"
echo "========================================="
echo "Anvil is running on http://0.0.0.0:8545 (PID: $ANVIL_NEW_PID)"
echo "GraphQL server is ready"
echo "========================================="