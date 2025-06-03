# Frami Web Application Setup Guide

This guide will help you set up the Frami blockchain crowdfunding platform on a fresh Ubuntu machine.

## Prerequisites

- Ubuntu 18.04 LTS or later
- Internet connection
- sudo privileges on the machine

## Quick Setup

1. **Clone or import the codebase** to your local machine
2. **Navigate to the project root directory**
3. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

## What the Setup Script Does

The script automatically handles:

### System Setup
- Updates Ubuntu packages
- Installs essential development tools (curl, wget, build-essential, etc.)
- Installs Git
- Installs Node.js 20.x LTS and npm
- Installs PostgreSQL database

### Project Setup
- Installs all npm dependencies for the main project
- Installs front-end dependencies
- Installs blockchain contracts dependencies
- Creates environment configuration files
- Sets up PostgreSQL database and user
- Builds the project

### Environment Configuration
- Creates `.env` files with default configurations
- Sets up database connection
- Prepares WalletConnect configuration placeholders

## After Setup

### 1. Configure Environment Variables

Update the generated `.env` files with your actual configuration:

**Root `.env` file:**
```env
DATABASE_URL="postgresql://frami_user:frami_password@localhost:5432/frami_db"
VITE_WALLET_CONNECT_PROJECT_ID="your_walletconnect_project_id"
```

**Front-end `.env` file:**
```env
VITE_WALLET_CONNECT_PROJECT_ID="your_walletconnect_project_id"
VITE_API_URL="http://localhost:3000"
```

### 2. Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to both `.env` files

### 3. Start the Development Server

```bash
cd front-end
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Development Commands

**Start the frontend development server:**
```bash
cd front-end
npm run dev
```

**Start local blockchain (for smart contract development):**
```bash
cd blockchain-contracts
npx hardhat node
```

**Deploy smart contracts to local network:**
```bash
cd blockchain-contracts
npx hardhat run scripts/deploy.ts --network localhost
```

## Troubleshooting

### Common Issues

**Permission denied when running setup.sh:**
```bash
chmod +x setup.sh
./setup.sh
```

**PostgreSQL connection issues:**
- Check if PostgreSQL service is running: `sudo systemctl status postgresql`
- Restart PostgreSQL: `sudo systemctl restart postgresql`

**Node.js version issues:**
- The script installs Node.js 20.x LTS
- Verify installation: `node --version`

**npm install failures:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Manual Database Setup (if automatic setup fails)

```bash
sudo -u postgres psql
CREATE USER frami_user WITH PASSWORD 'frami_password';
CREATE DATABASE frami_db OWNER frami_user;
GRANT ALL PRIVILEGES ON DATABASE frami_db TO frami_user;
\q
```

## Project Structure

```
frami/
├── setup.sh                 # Setup script
├── package.json             # Root package.json
├── .env                     # Environment variables
├── front-end/               # React frontend
│   ├── package.json
│   ├── .env
│   └── src/
├── blockchain-contracts/    # Smart contracts
│   ├── package.json
│   ├── hardhat.config.ts
│   └── contracts/
└── README.md
```

## Support

If you encounter issues during setup:

1. Check the console output for specific error messages
2. Ensure you have sudo privileges
3. Verify your Ubuntu version is supported
4. Check your internet connection for package downloads

## Security Notes

- The script creates default database credentials for development
- Update all credentials before deploying to production
- Keep your WalletConnect Project ID secure
- Review all `.env` files before committing to version control