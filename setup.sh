#!/bin/bash

# Frami Web Application Setup Script for Ubuntu
# This script sets up the development environment for the Frami blockchain crowdfunding platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Ubuntu version
check_ubuntu_version() {
    print_status "Checking Ubuntu version..."
    if [[ -f /etc/lsb-release ]]; then
        . /etc/lsb-release
        if [[ $DISTRIB_ID == "Ubuntu" ]]; then
            print_success "Running on Ubuntu $DISTRIB_RELEASE"
        else
            print_warning "This script is designed for Ubuntu. You're running $DISTRIB_ID"
        fi
    else
        print_warning "Cannot detect Ubuntu version. Proceeding anyway..."
    fi
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    print_success "System packages updated"
}

# Function to install Node.js and npm
install_nodejs() {
    print_status "Installing Node.js and npm..."
    
    if command_exists node && command_exists npm; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is already installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [[ $NODE_MAJOR_VERSION -ge 18 ]]; then
            print_success "Node.js version is sufficient (>= 18.x)"
        else
            print_warning "Node.js version is too old. Installing latest LTS..."
            install_nodejs_fresh
        fi
    else
        install_nodejs_fresh
    fi
}

install_nodejs_fresh() {
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js installed: $NODE_VERSION"
    print_success "npm installed: $NPM_VERSION"
}

# Function to install Git
install_git() {
    print_status "Checking Git installation..."
    
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_success "Git is already installed: $GIT_VERSION"
    else
        print_status "Installing Git..."
        sudo apt install -y git
        print_success "Git installed successfully"
    fi
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."
    
    if command_exists psql; then
        print_success "PostgreSQL is already installed"
    else
        sudo apt install -y postgresql postgresql-contrib
        print_success "PostgreSQL installed"
    fi
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL service started and enabled"
}

# Function to install development tools
install_dev_tools() {
    print_status "Installing development tools..."
    
    sudo apt install -y \
        curl \
        wget \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip
    
    print_success "Development tools installed"
}

# Function to set up the project
setup_project() {
    print_status "Setting up the Frami project..."
    
    # Check if we're in the project directory
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Install dependencies for the main project
    print_status "Installing main project dependencies..."
    npm install
    
    # Navigate to front-end directory and install dependencies
    if [[ -d "front-end" ]]; then
        print_status "Installing front-end dependencies..."
        cd front-end
        npm install
        cd ..
        print_success "Front-end dependencies installed"
    else
        print_warning "front-end directory not found"
    fi
    
    # Navigate to blockchain-contracts directory and install dependencies
    if [[ -d "blockchain-contracts" ]]; then
        print_status "Installing blockchain contracts dependencies..."
        cd blockchain-contracts
        npm install
        cd ..
        print_success "Blockchain contracts dependencies installed"
    else
        print_warning "blockchain-contracts directory not found"
    fi
}

# Function to create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Create .env file if it doesn't exist
    if [[ ! -f ".env" ]]; then
        print_status "Creating .env file..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/frami_db"

# Wallet Connect Configuration (you'll need to add your project ID)
VITE_WALLET_CONNECT_PROJECT_ID=""

# Development Configuration
NODE_ENV="development"
PORT=3000

# Add other environment variables as needed
EOF
        print_success ".env file created"
        print_warning "Please update the .env file with your actual configuration values"
    else
        print_success ".env file already exists"
    fi
    
    # Create front-end .env file if it doesn't exist
    if [[ -d "front-end" && ! -f "front-end/.env" ]]; then
        print_status "Creating front-end .env file..."
        cat > front-end/.env << 'EOF'
# Wallet Connect Configuration
VITE_WALLET_CONNECT_PROJECT_ID=""

# API Configuration
VITE_API_URL="http://localhost:3000"

# Development Configuration
NODE_ENV="development"
EOF
        print_success "Front-end .env file created"
        print_warning "Please update the front-end .env file with your WalletConnect Project ID"
    fi
}

# Function to set up database
setup_database() {
    print_status "Setting up database..."
    
    # Create database user and database
    sudo -u postgres psql << 'EOF'
CREATE USER frami_user WITH PASSWORD 'frami_password';
CREATE DATABASE frami_db OWNER frami_user;
GRANT ALL PRIVILEGES ON DATABASE frami_db TO frami_user;
\q
EOF
    
    print_success "Database and user created"
    print_warning "Default database credentials created. Please update your .env file with secure credentials for production"
}

# Function to build the project
build_project() {
    print_status "Building the project..."
    
    # Build the front-end
    if [[ -d "front-end" ]]; then
        cd front-end
        npm run build
        cd ..
        print_success "Front-end built successfully"
    fi
    
    # Compile smart contracts if hardhat is available
    if [[ -d "blockchain-contracts" ]]; then
        cd blockchain-contracts
        if [[ -f "hardhat.config.ts" || -f "hardhat.config.js" ]]; then
            print_status "Compiling smart contracts..."
            npx hardhat compile
            print_success "Smart contracts compiled"
        fi
        cd ..
    fi
}

# Function to display final instructions
display_instructions() {
    echo ""
    echo "==============================================="
    print_success "Frami Web Application Setup Complete!"
    echo "==============================================="
    echo ""
    print_status "Next steps:"
    echo "1. Update your .env files with the correct configuration:"
    echo "   - Add your WalletConnect Project ID"
    echo "   - Update database credentials if needed"
    echo ""
    print_status "2. To start the development server:"
    echo "   cd front-end"
    echo "   npm run dev"
    echo ""
    print_status "3. The application will be available at:"
    echo "   http://localhost:5173 (Vite dev server)"
    echo ""
    print_status "4. For blockchain development:"
    echo "   cd blockchain-contracts"
    echo "   npx hardhat node  # Start local blockchain"
    echo "   npx hardhat run scripts/deploy.ts --network localhost  # Deploy contracts"
    echo ""
    print_warning "Important:"
    echo "- Make sure to configure your WalletConnect Project ID"
    echo "- Update database credentials for production use"
    echo "- Review all .env files before starting development"
    echo ""
    print_success "Happy coding! 🚀"
}

# Main execution
main() {
    echo "==============================================="
    echo "🚀 Frami Web Application Setup Script"
    echo "==============================================="
    echo ""
    
    check_ubuntu_version
    update_system
    install_dev_tools
    install_git
    install_nodejs
    install_postgresql
    setup_database
    setup_project
    setup_environment
    build_project
    display_instructions
}

# Check if script is run with sudo for system packages
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root. Please run as a regular user."
    print_error "The script will prompt for sudo when needed."
    exit 1
fi

# Run main function
main

print_success "Setup script completed successfully!"