# Frami - Blockchain Crowdfunding Platform

A next-generation blockchain-powered crowdfunding platform that creates an immersive, interactive ecosystem for project creators and backers to discover, fund, and track innovative web3 initiatives through transparent and secure technologies.

## 🌟 Overview

Frami revolutionizes crowdfunding by combining the transparency of blockchain technology with an intuitive user experience. Our platform enables creators to launch projects while providing backers with secure, transparent funding mechanisms and exclusive benefits through our FounderNFT system.

### Key Features

- **🚀 Project Creation & Discovery** - Intuitive platform for launching and exploring innovative projects
- **💎 FounderNFT System** - Exclusive NFTs providing platform fee distribution, governance rights, and early access
- **🔗 Blockchain Integration** - Transparent, secure funding with wallet connectivity
- **📊 Real-time Analytics** - Track project progress, funding goals, and community engagement
- **🎯 Smart Staking** - Stake FounderNFTs to earn platform fees and enhanced benefits
- **📱 Responsive Design** - Seamless experience across desktop, tablet, and mobile devices

## 🛠 Tech Stack

### Frontend
- **React.js** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe development with enhanced developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Framer Motion** - Advanced animations and micro-interactions
- **GSAP** - High-performance animations for immersive experiences

### Blockchain & Web3
- **RainbowKit** - Best-in-class wallet connection interface
- **Wagmi** - React hooks for Ethereum interactions
- **Wallet Integration** - Support for MetaMask, WalletConnect, and major wallets

### Backend & Database
- **Express.js** - Fast, minimalist web framework for Node.js
- **Drizzle ORM** - TypeScript ORM for database interactions
- **PostgreSQL** - Robust relational database for data persistence
- **In-Memory Storage** - Development-friendly storage implementation

### Development Tools
- **TanStack Query** - Powerful data synchronization for React
- **Zod** - TypeScript-first schema validation
- **React Hook Form** - Performant forms with easy validation
- **Lucide React** - Beautiful, customizable icons
- **shadcn/ui** - Re-usable components built with Radix UI

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/frami.git
   cd frami
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   DATABASE_URL=your_database_connection_string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000` to see the application.

## 📁 Project Structure

```
frami/
├── front-end/
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utility functions
│   │   │   └── assets/         # Static assets
│   │   └── public/             # Public assets
│   ├── server/                 # Express.js backend
│   └── shared/                 # Shared types and schemas
├── blockchain-contracts/       # Smart contracts (Hardhat)
└── attached_assets/           # Project documentation assets
```

## 🎯 Key Features & Pages

### Core Platform
- **Homepage** - Hero section, featured projects, platform overview
- **Project Discovery** - Browse, filter, and search projects by category
- **Project Details** - Comprehensive project information and funding interface
- **Project Creation** - Intuitive project setup and management tools

### FounderNFT System
- **NFT Sale Page** - Detailed information about FounderNFT benefits and purchase
- **NFT Dashboard** - Portfolio management, staking controls, earnings tracking
- **Staking Interface** - Bulk operations with select-all functionality
- **Rewards System** - Real-time earnings and claims management

### Additional Features
- **Documentation** - Comprehensive platform guides and API documentation
- **Contact Page** - Professional contact form with Discord integration
- **Responsive Navigation** - Seamless mobile and desktop experience
- **Dark/Light Mode** - Elegant theme switching

## 🔗 Blockchain Integration

### Supported Networks
- Ethereum Mainnet
- Polygon
- Additional networks configurable

### Wallet Support
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet
- And more through RainbowKit

### Smart Contract Features
- Transparent funding mechanisms
- NFT minting and management
- Staking and rewards distribution
- Governance token integration

## 🎨 Design System

Frami features a carefully crafted design system with:
- **Consistent Color Palette** - Professional dark/light theme support
- **Typography Scale** - Readable, accessible text hierarchy
- **Component Library** - Reusable UI components with shadcn/ui
- **Animation System** - Smooth, performant animations with GSAP and Framer Motion
- **Responsive Grid** - Mobile-first, flexible layouts

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Environment Configuration
Ensure all environment variables are properly configured for production deployment.

## 🤝 Contributing

We welcome contributions to the Frami platform! Please see our contributing guidelines for details on:
- Code style and conventions
- Pull request process
- Issue reporting
- Feature requests

## 📞 Support & Contact

- **Discord Community** - Join our Discord for faster support and community discussions
- **Contact Form** - Use our in-platform contact form for detailed inquiries
- **Documentation** - Comprehensive guides available in the platform docs section

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Roadmap

- [ ] Advanced project analytics and insights
- [ ] Multi-chain support expansion
- [ ] DAO governance implementation
- [ ] Mobile application development
- [ ] Enhanced creator tools and features
- [ ] Institutional investor features

---

**Built with ❤️ by the Frami Team**

Transform your ideas into reality with blockchain-powered crowdfunding.