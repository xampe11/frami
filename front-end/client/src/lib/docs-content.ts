// Types for documentation content
type DocContent =
  | string
  | { type: "heading"; title: string }
  | { type: "subheading"; title: string }
  | { type: "list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "code"; code: string; language?: string }
  | { type: "note"; title: string; text: string }
  | { type: "warning"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

type DocItem = {
  id: string;
  title: string;
  description?: string;
  content: DocContent[];
};

type DocSection = {
  id: string;
  title: string;
  items: DocItem[];
};

// Documentation sections and content
export const docSections: DocSection[] = [
  {
    id: "roadmap",
    title: "Roadmap",
    items: [
      {
        id: "platform-roadmap",
        title: "Platform Development Roadmap",
        description: "Detailed timeline of Frami platform development for 2025-2026",
        content: [
          { type: "heading", title: "Our Vision" },
          "Frami is revolutionizing decentralized crowdfunding through a milestone-based, transparent platform that aligns incentives between project creators, investors, and the broader community. Our upgradeable smart contract infrastructure enables continuous innovation while maintaining robust security and governance.",
          
          { type: "heading", title: "Q2 - 2025: Foundation Launch" },
          { type: "subheading", title: "Website Launch" },
          {
            type: "list",
            items: [
              "Intuitive UI/UX focused on both creator and investor experiences",
              "Project discovery and filtering capabilities",
              "Interactive milestone visualization and tracking",
              "Responsive design for mobile and desktop users",
              "Integration with Web3 wallets"
            ]
          },
          
          { type: "subheading", title: "FounderNFT Launch" },
          "Limited collection of NFTs representing early platform supporters",
          { type: "subheading", title: "Exclusive Benefits:" },
          {
            type: "list",
            items: [
              "Priority access to premium projects before public rounds",
              "Enhanced fee sharing (Starting from 50% of all total fees)",
              "Governance voting rights for platform decisions"
            ]
          },
          
          { type: "subheading", title: "Core Contract Functionality" },
          {
            type: "list",
            items: [
              "Implementation of upgradeable smart contract architecture (UUPS pattern)",
              "Project creation and configuration capabilities",
              "Milestone-based funding with transparent progress tracking",
              "Investor contribution and withdrawal mechanisms",
              "Secure fund management with milestone-based release"
            ]
          },
          
          { type: "subheading", title: "First 10 Projects Curation" },
          {
            type: "list",
            items: [
              "Selection of diverse, high-quality inaugural projects",
              "Founder-led evaluation process to ensure project viability",
              "Ranging across multiple sectors (technology, creative, social impact)",
              "Special promotion and support for these foundational projects"
            ]
          },
          
          { type: "subheading", title: "Security Audit" },
          {
            type: "list",
            items: [
              "Comprehensive third-party audit of all smart contracts",
              "Penetration testing of platform infrastructure",
              "Implementation of security recommendations",
              "Publication of audit reports for community transparency"
            ]
          },
          
          { type: "heading", title: "Q3 - 2025: Feature Expansion" },
          { type: "subheading", title: "Community Building Initiatives" },
          {
            type: "list",
            items: [
              "Ambassador program for community-led growth",
              "Educational webinars on platform usage and benefits",
              "Social media and content strategy implementation",
              "Community forums and support channels establishment"
            ]
          },
          
          { type: "subheading", title: "Token (ERC20) Creator" },
          {
            type: "list",
            items: [
              "No-code tool for project-specific token creation",
              "Customizable tokenomics parameters",
              "Automated vesting and distribution schedules",
              "Integration with project milestones for token release"
            ]
          },
          
          { type: "subheading", title: "NFT (ERC721) Creator" },
          {
            type: "list",
            items: [
              "Simple interface for project-related NFT collections",
              "Customizable traits and rarity settings",
              "Metadata and asset management tools",
              "Integration with funding tiers and rewards"
            ]
          },
          
          { type: "subheading", title: "Multi-Currency Support" },
          {
            type: "list",
            items: [
              "Expansion beyond ETH to include stable coins (USDC, USDT)",
              "Smart contract adaptations for multi-currency handling",
              "Conversion and exchange rate management",
              "Gas optimization for various token standards"
            ]
          },
          
          { type: "subheading", title: "Analytics Dashboard" },
          {
            type: "list",
            items: [
              "Real-time project performance metrics",
              "Funding progress visualization",
              "Milestone completion statistics",
              "Investor engagement and contribution analytics",
              "Customizable reporting for project creators"
            ]
          },
          
          { type: "subheading", title: "Additional Wallet Integrations" },
          "Improved onboarding flow for non-crypto native users",
          
          { type: "heading", title: "Q4 - 2025: Advanced Ecosystem" },
          { type: "subheading", title: "Validator Economy" },
          {
            type: "list",
            items: [
              "Establishment of validator node system for milestone verification",
              "Incentive structure for honest validation",
              "FounderNFT Benefits: Priority validator status with enhanced rewards",
              "Slashing mechanisms for dishonest validation",
              "Distributed validation to ensure fairness"
            ]
          },
          
          { type: "subheading", title: "FounderNFT Staking Rewards Improvement" },
          {
            type: "list",
            items: [
              "Staking mechanism for compounding rewards",
              "Fee distribution proportional to stake duration and amount",
              "Special rewards for long-term stakers"
            ]
          },
          
          { type: "subheading", title: "Cross-Chain Bridge Functionality" },
          {
            type: "list",
            items: [
              "Interoperability between Ethereum and other major chains",
              "Secure bridge contracts for cross-chain asset transfer",
              "Multi-chain project contribution capabilities",
              "Chain-specific optimization for lower fees and faster transactions"
            ]
          },
          
          { type: "subheading", title: "Reputation System" },
          {
            type: "list",
            items: [
              "Dynamic reputation scoring for project creators",
              "Historical performance metrics",
              "Verification badges and trust indicators",
              "Community feedback integration",
              "Impact on future project parameters (fees, limits)"
            ]
          },
          
          { type: "subheading", title: "Automated Milestone Verification" },
          {
            type: "list",
            items: [
              "AI-assisted milestone validation",
              "Integration with external data sources for verification",
              "Reduction in manual verification requirements",
              "Transparent verification criteria and processes"
            ]
          },
          
          { type: "subheading", title: "Risk Assessment System" },
          {
            type: "list",
            items: [
              "AI-powered analysis of project viability",
              "Risk scoring based on multiple factors",
              "Historical data comparison and pattern recognition",
              "Recommendation engine for investors",
              "Due diligence automation and assistance"
            ]
          },
          
          { type: "subheading", title: "Enhanced Governance for NFT Holders" },
          {
            type: "list",
            items: [
              "Voting weight boost for FounderNFT holders",
              "Proposal creation and management system",
              "Transparent voting mechanism",
              "Implementation of executable outcomes based on votes"
            ]
          },
          
          { type: "subheading", title: "Whitelist Access System" },
          {
            type: "list",
            items: [
              "Priority access mechanisms for high-demand projects",
              "FounderNFT tier-based allocation system",
              "Fair distribution algorithms",
              "Anti-Sybil mechanisms to prevent gaming the system"
            ]
          },
          
          { type: "heading", title: "Q1 - 2026: Ecosystem Maturity" },
          { type: "subheading", title: "DAO Implementation" },
          {
            type: "list",
            items: [
              "Complete decentralization of platform governance",
              "Multi-tiered proposal and voting system",
              "Treasury management by DAO",
              "Enhanced voting power for FounderNFT holders",
              "Working groups and specialized committees"
            ]
          },
          
          { type: "subheading", title: "Extension Economy" },
          {
            type: "list",
            items: [
              "Marketplace for third-party platform extensions",
              "Developer tools and documentation",
              "Revenue sharing from extension usage to FounderNFT holders",
              "Quality assurance and security processes",
              "Early access to new extensions for FounderNFT holders"
            ]
          },
          
          { type: "subheading", title: "LayerZero Integration" },
          {
            type: "list",
            items: [
              "Cross-chain Project Funding: Investments from multiple chains into single projects",
              "Multi-chain Project Deployment: Simultaneous deployment across networks",
              "Chain-agnostic Governance: Voting capabilities across different blockchains",
              "Omnichain NFT Compatibility: FounderNFTs with cross-chain utility",
              "Cross-chain Fee Distribution: Platform fees distributed regardless of chain"
            ]
          },
          
          { type: "subheading", title: "Decentralized Identity Integration" },
          {
            type: "list",
            items: [
              "Self-sovereign identity solutions",
              "Privacy-preserving verification",
              "Reputation portability across platforms",
              "Credential-based access control",
              "Integration with existing DID standards"
            ]
          },
          
          { type: "subheading", title: "Fiat On-ramp Partnerships" },
          {
            type: "list",
            items: [
              "Direct fiat currency contribution options",
              "Compliant KYC/AML processes",
              "Banking partnerships for seamless transfers",
              "Lower barriers for non-crypto users",
              "Support for multiple currencies and payment methods"
            ]
          },
          
          { type: "subheading", title: "Developer API & SDK" },
          {
            type: "list",
            items: [
              "Comprehensive documentation for integration",
              "Webhooks for platform events",
              "Client libraries in multiple languages",
              "Sample applications and use cases",
              "Developer community support"
            ]
          },
          
          { type: "note", title: "Roadmap Flexibility", text: "This roadmap represents our current development priorities, though we remain agile and responsive to market conditions and community feedback. The Frami team is committed to building a platform that empowers creators, rewards early supporters, and advances the possibilities of decentralized funding." }
        ]
      }
    ]
  },
  {
    id: "start-here",
    title: "Start Here",
    items: [
      {
        id: "welcome-guide",
        title: "Welcome Guide",
        description: "Get started with the Frami platform",
        content: [
          { type: "heading", title: "Introduction to the platform" },
          "Welcome to the Frami Platform, a blockchain-powered crowdfunding ecosystem that brings creative projects to life with the power of Web3 technology. Our platform creates an immersive, interactive space for project creators and backers to discover, fund, and track innovative initiatives.",
          "The Frami platform uses blockchain technology to ensure transparency, security, and efficiency in the crowdfunding process. This creates a trusted environment where creators can showcase their projects and backers can support initiatives with confidence.",

          { type: "heading", title: "Key benefits and value proposition" },
          {
            type: "list",
            items: [
              "Blockchain Security: Smart contract-powered funding ensures all transactions are secure, transparent, and immutable.",
              "Milestone-Based Funding: Project funds are released based on preset milestones, creating accountability and reducing risk.",
              "Community Governance: Backers can participate in project decisions through voting mechanics.",
              "Founder NFTs: Exclusive benefits for early adopters and consistent supporters of the platform.",
              "Transparent Tracking: All project developments and fund allocations are visible on the blockchain.",
            ],
          },

          {
            type: "note",
            title: "New to blockchain?",
            text: "Don't worry if you're new to blockchain technology. Our platform is designed to be user-friendly while leveraging the benefits of blockchain. You'll find helpful guides throughout the documentation to get you up to speed.",
          },
        ],
      },
      {
        id: "quick-start-guide",
        title: "Quick Start Guide",
        content: [
          {
            type: "heading",
            title: "Step-by-step guide to create your first project",
          },
          "Creating a project on Frami is simple. Follow these steps to get started:",

          {
            type: "numbered-list",
            items: [
              "Sign in with your digital wallet by clicking 'Connect Wallet' in the top right corner.",
              "Navigate to 'Create Project' in the main navigation menu.",
              "Fill out the project creation form, including title, description, funding goal, and timeline.",
              "Define your project milestones with clear deliverables and funding requirements.",
              "Add team members if applicable, setting appropriate permission levels.",
              "Upload any supporting media such as images, videos, or documents.",
              "Review and submit your project for approval.",
              "Once approved, share your project with potential backers.",
            ],
          },

          { type: "heading", title: "How to invest in a project" },
          "Backing projects on Frami is straightforward and secure:",

          {
            type: "numbered-list",
            items: [
              "Connect your wallet using the 'Connect Wallet' button.",
              "Browse projects or use search to find initiatives that interest you.",
              "Review the project details, milestones, team, and funding progress.",
              "Click the 'Back This Project' button on the project page.",
              "Enter the amount you wish to contribute.",
              "Confirm the transaction through your connected wallet.",
              "You'll receive a receipt of your contribution and any applicable tokens or rewards.",
            ],
          },

          { type: "heading", title: "Basic platform navigation" },
          "Navigating the Frami platform is intuitive:",

          {
            type: "list",
            items: [
              "Home: Overview of the platform with featured projects and latest updates.",
              "Explore: Browse all projects with filtering options by category, funding stage, and more.",
              "Create Project: Access the project creation flow (requires wallet connection).",
              "Project Page: Detailed view of a specific project, including updates, milestones, and backer information.",
              "Profile: View and manage your backed projects and created initiatives.",
              "Docs: You are here! Comprehensive documentation on using the platform.",
            ],
          },

          {
            type: "warning",
            title: "Important Note",
            text: "Always ensure you're connected to the correct wallet address when backing projects or creating new initiatives. Transactions on the blockchain are irreversible.",
          },
        ],
      },
      {
        id: "platform-overview",
        title: "Platform Overview",
        content: [
          { type: "heading", title: "Platform architecture diagram" },
          "The Frami platform consists of several interconnected components working together to deliver a seamless crowdfunding experience:",

          {
            type: "code",
            code: `
┌─────────────────────────────────────────┐
│              User Interface             │
│  (React.js, TypeScript, Tailwind CSS)   │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Blockchain Integration          │
│  (RainbowKit/Wagmi, Web3.js/Ethers.js)  │
└───────────────┬─────────────────────────┘
                │
    ┌───────────▼───────────┐     ┌────────────────────────┐
    │   Smart Contracts     │     │    Backend Services    │
    │ (Project, Milestones, ├─────┤   (Express, graphQL,   │
    │    Tokens, Voting)    │     │        mongoBD)        │
    └───────────┬───────────┘     └────────────────────────┘
                │
    ┌───────────▼───────────┐
    │     Blockchain        │
    │  (Ethereum, Polygon)  │
    └───────────────────────┘`,
          },

          { type: "heading", title: "Component interactions" },
          {
            type: "list",
            items: [
              "User Interface: Provides an intuitive experience for creating and browsing projects, built with React.js and TypeScript.",
              "Blockchain Integration: Connects user actions to blockchain transactions using RainbowKit/Wagmi and Web3.js/Ethers.js libraries.",
              "Smart Contracts: Handle project creation, milestone management, fund distribution, and voting mechanisms on the blockchain.",
              "Backend Services: Manage data storage, user authentication, and integrate with external services.",
              "Blockchain: The underlying distributed ledger technology that ensures transparency and security of all transactions.",
            ],
          },

          { type: "heading", title: "Key terminology" },
          {
            type: "table",
            headers: ["Term", "Definition"],
            rows: [
              [
                "Project",
                "A creative initiative seeking funding on the platform. Each project has specific goals, milestones, and funding requirements.",
              ],
              [
                "Milestone",
                "A defined checkpoint in a project's development, with specific deliverables that, when verified, trigger the release of a portion of funds.",
              ],
              [
                "Smart Contract",
                "Self-executing code on the blockchain that enforces and automates the rules of project funding and milestone verification.",
              ],
              [
                "Gas Fee",
                "A small fee paid to the blockchain network for processing transactions. Required for operations like backing a project or releasing milestone funds.",
              ],
              [
                "Wallet",
                "A digital tool that stores your cryptocurrency and allows you to interact with blockchain applications.",
              ],
              [
                "FounderNFT",
                "Non-fungible tokens that represent exclusive membership and benefits on the Frami platform.",
              ],
              [
                "Governance",
                "The process by which project backers can participate in voting on milestone completion and other key decisions.",
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    items: [
      {
        id: "smart-contract-architecture",
        title: "Smart Contract Architecture",
        content: [
          {
            type: "heading",
            title: "UUPS (Universal Upgradeable Proxy Standard) explained",
          },
          "The Frami platform utilizes UUPS for its smart contract infrastructure, providing upgradability while maintaining security and data consistency:",

          "UUPS is an upgradeable proxy pattern that allows us to upgrade the logic of our smart contracts without changing the contract address or losing data. This creates a better user experience and enables platform evolution over time.",

          "Key aspects of our UUPS implementation:",

          {
            type: "list",
            items: [
              "Proxy Contract: Maintains the contract's state and delegates calls to the implementation contract.",
              "Implementation Contract: Contains the actual logic that can be upgraded when necessary.",
              "Admin Control: Strict access controls ensure only authorized addresses can perform upgrades.",
              "Transparent Process: All upgrades are visible on the blockchain for full transparency.",
            ],
          },

          { type: "heading", title: "Storage separation pattern" },
          "To ensure data integrity during upgrades, Frami uses a storage separation pattern:",

          {
            type: "list",
            items: [
              "Storage Contracts: Dedicated contracts that only define state variables.",
              "Logic Contracts: Implement the business logic without defining storage layouts.",
              "Inheritance Chain: Logic contracts inherit from storage contracts to access state variables.",
              "Gap Pattern: Reserves storage slots for future variables without breaking existing storage layout.",
            ],
          },

          {
            type: "warning",
            title: "Development Note",
            text: "When creating custom extensions, always follow the storage separation pattern to ensure compatibility with future upgrades.",
          },

          { type: "heading", title: "Contract hierarchy and inheritance" },
          "The Frami smart contract system follows a carefully designed inheritance structure:",

          {
            type: "code",
            code: `
// Simplified contract hierarchy

// Base contracts
├── AccessControl
│   └── Defines roles and permissions
├── StorageSlots
│   └── Core storage variables and slot management
├── Proxiable
│   └── UUPS upgrade functionality

// Main contracts
├── PlatformRegistry
│   ├── Inherits: AccessControl, StorageSlots, Proxiable
│   └── Central registry for all platform components
├── ProjectFactory
│   ├── Inherits: AccessControl, StorageSlots, Proxiable
│   ├── Creates new project instances
│   └── Manages implementation updates
├── Project
│   ├── Inherits: StorageSlots, Proxiable
│   ├── Core project functionality
│   └── Milestone management and fund distribution
└── FounderNFT
    ├── Inherits: ERC721, AccessControl, StorageSlots
    └── Manages platform membership benefits`,
          },
        ],
      },
      {
        id: "extension-system",
        title: "Extension System",
        content: [
          { type: "heading", title: "How extensions work" },
          "The Frami platform features a modular extension system that allows for customizing and enhancing project functionality:",

          "Extensions are additional smart contracts that can be plugged into projects to add specific features or capabilities. This modular approach allows the platform to grow and adapt while maintaining a stable core.",

          "Extensions integrate with projects through a standardized interface and are registered in the PlatformRegistry. This ensures security and compatibility across the ecosystem.",

          { type: "heading", title: "Available extension types" },
          {
            type: "table",
            headers: ["Extension Type", "Purpose", "Core Features"],
            rows: [
              [
                "Payment Extensions",
                "Handle different payment methods",
                "Multiple token support, fiat on-ramps, payment splitting",
              ],
              [
                "Governance Extensions",
                "Enhance project decision-making",
                "Custom voting mechanisms, proposal systems, delegation",
              ],
              [
                "Reward Extensions",
                "Manage backer incentives",
                "Token distributions, NFT rewards, tiered benefits",
              ],
              [
                "Verification Extensions",
                "Validate milestone completion",
                "External data oracles, multi-sig approval, automated checks",
              ],
              [
                "Integration Extensions",
                "Connect to external services",
                "GitHub integration, social media connectivity, analytics",
              ],
            ],
          },

          { type: "heading", title: "Adding custom extensions" },
          "Developers can create and integrate custom extensions to address specific project needs:",

          {
            type: "numbered-list",
            items: [
              "Implement the IFramiExtension interface in your smart contract.",
              "Develop the extension following our development guidelines and security best practices.",
              "Test thoroughly using our extension testing framework.",
              "Submit the extension for verification and approval.",
              "Once approved, the extension becomes available for projects to integrate.",
            ],
          },

          {
            type: "note",
            title: "Developer Resources",
            text: 'For detailed guidance on extension development, refer to the "For Extension Builders" section under Guides.',
          },
        ],
      },
      {
        id: "milestone-funding",
        title: "Milestone-based Funding",
        content: [
          { type: "heading", title: "Creating effective milestones" },
          "Milestone-based funding is a cornerstone of the Frami platform, providing structure and accountability to project development:",

          "Effective milestones should be:",

          {
            type: "list",
            items: [
              "Specific: Clearly defined with measurable deliverables.",
              "Achievable: Realistic given the project's resources and timeline.",
              "Relevant: Directly contributing to the project's overall goals.",
              "Time-bound: Having a defined completion timeframe.",
              "Verifiable: Producing outputs that can be objectively assessed.",
            ],
          },

          "Examples of well-defined milestones:",

          {
            type: "table",
            headers: ["Milestone", "Deliverables", "Funding %"],
            rows: [
              [
                "Prototype Development",
                "Working software prototype with core functionality, GitHub repository, demo video",
                "20%",
              ],
              [
                "Beta Release",
                "Testable beta version, user documentation, initial user testing results",
                "30%",
              ],
              [
                "Launch Preparation",
                "Final product, complete documentation, marketing materials, launch plan",
                "25%",
              ],
              [
                "Public Launch",
                "Live product, user onboarding system, support infrastructure",
                "25%",
              ],
            ],
          },

          { type: "heading", title: "Milestone verification process" },
          "When a project creator claims a milestone is complete, the following verification process occurs:",

          {
            type: "numbered-list",
            items: [
              "Creator submits evidence of milestone completion through the platform.",
              "Verification period begins (typically 3-7 days, set during project creation).",
              "Backers and designated verifiers review the submitted evidence.",
              "Stakeholders cast votes to approve or reject the milestone completion.",
              "If approved by the required threshold, funds for that milestone are released.",
              "If rejected, the creator can address concerns and resubmit for verification.",
            ],
          },

          { type: "heading", title: "Voting mechanics for fund release" },
          "Fund release is determined through a transparent voting system:",

          {
            type: "list",
            items: [
              "Voting Power: Based on the proportion of funds contributed to the project.",
              "Approval Threshold: Typically set at 51% of voting power, but can be customized during project setup.",
              "Voting Period: Limited timeframe during which votes must be cast (default: 5 days).",
              "Delegation: Backers can delegate their voting power to trusted experts or representatives.",
              "Automatic Release: If the verification period expires without sufficient rejection votes, funds are automatically released.",
            ],
          },

          {
            type: "warning",
            title: "Important",
            text: "Once funds are released for a milestone, the transaction cannot be reversed. This ensures finality on the blockchain but makes the verification process critically important.",
          },
        ],
      },
      {
        id: "platform-governance",
        title: "Platform Governance",
        content: [
          { type: "heading", title: "Role-based permissions" },
          "The Frami platform implements a comprehensive role-based permission system to ensure secure and appropriate access for all participants:",

          {
            type: "table",
            headers: ["Role", "Permissions"],
            rows: [
              [
                "Platform Admin",
                "Manage platform settings, approve new extension types, execute emergency controls",
              ],
              [
                "Project Creator",
                "Create and manage projects, define milestones, submit verification evidence, receive funds",
              ],
              [
                "Project Team Member",
                "Access based on creator-assigned permissions (view, edit, submit updates)",
              ],
              [
                "Backer",
                "Contribute funds, vote on milestones, receive project updates, participate in governance",
              ],
              [
                "Verifier",
                "Specialized role for validating milestone completion with enhanced voting power",
              ],
            ],
          },

          { type: "heading", title: "Fee structure" },
          "The Frami platform utilizes a fair and transparent fee structure to maintain sustainability while maximizing value for creators and backers:",

          {
            type: "list",
            items: [
              "Platform Fee: 5% of funds raised, applied only when milestones are successfully completed.",
              "Extension Fees: Vary based on the extensions used, typically 0-2% additional fee.",
              "Gas Optimization: Our smart contracts are designed to minimize blockchain transaction fees.",
              "FounderNFT Discount: Holders of FounderNFTs receive reduced platform fees (up to 40% reduction).",
              "Volume Benefits: Projects raising over certain thresholds may qualify for reduced fees.",
            ],
          },

          { type: "heading", title: "Treasury management" },
          "Collected fees are managed through a transparent treasury system:",

          {
            type: "list",
            items: [
              "Development Allocation: 60% of fees fund ongoing platform development and improvements.",
              "Security: 15% dedicated to security audits and bug bounty programs.",
              "Community Initiatives: 15% for community growth, education, and events.",
              "Ecosystem Grants: 10% to support promising projects and extensions.",
            ],
          },

          { type: "heading", title: "Future DAO governance" },
          "The Frami platform roadmap includes a transition to full DAO (Decentralized Autonomous Organization) governance:",

          {
            type: "list",
            items: [
              "Governance Token: Future introduction of a governance token giving holders voting rights on platform decisions.",
              "Proposal System: Mechanism for community members to suggest and vote on platform changes.",
              "Progressive Decentralization: Phased approach to transitioning platform control to the community.",
              "Governance Mining: Early platform users and FounderNFT holders will receive governance benefits.",
            ],
          },

          {
            type: "note",
            title: "Roadmap Item",
            text: "DAO governance is scheduled for implementation in Phase 3 of our platform roadmap (estimated Q4 2025). Current governance is managed by the founding team with community input.",
          },
        ],
      },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    items: [
      {
        id: "for-project-creators",
        title: "For Project Creators",
        content: [
          { type: "heading", title: "Planning your fundraising campaign" },
          "A successful fundraising campaign on Frami requires careful planning and preparation:",

          {
            type: "numbered-list",
            items: [
              "Define your project scope clearly, with specific goals and deliverables.",
              "Research similar projects for benchmarking funding goals and timelines.",
              "Create a detailed budget breakdown showing how funds will be utilized.",
              "Develop a compelling narrative that communicates your project's value proposition.",
              "Prepare high-quality visuals including images, videos, and possibly prototypes.",
              "Build an audience before launching through social media and community engagement.",
              "Create a marketing plan for driving traffic to your project page.",
              "Plan your milestone structure to align with natural project development phases.",
            ],
          },

          { type: "heading", title: "Setting up effective milestones" },
          "Milestones are critical to project success. Follow these guidelines for creating effective milestones:",

          {
            type: "list",
            items: [
              "Create 3-5 clearly defined milestones for most projects (fewer for smaller projects, more for complex ones).",
              "Allocate funding proportionally to the work involved in each milestone.",
              "Include both development activities and demonstrable outcomes in each milestone.",
              "Set realistic timeframes that account for potential delays.",
              "Define specific, measurable success criteria for milestone completion.",
              "Consider dependencies between milestones and how they affect your timeline.",
              "Include testing and feedback phases in your milestone plan.",
            ],
          },

          {
            type: "note",
            title: "Best Practice",
            text: "Many successful projects allocate a smaller percentage (15-20%) to the first milestone to demonstrate commitment and reduce initial risk for backers.",
          },

          { type: "heading", title: "Managing your team members" },
          "For projects with multiple team members, proper role management is essential:",

          {
            type: "list",
            items: [
              "Invite team members by their wallet addresses through the project dashboard.",
              "Assign appropriate permission levels based on responsibilities.",
              "Document clear responsibilities for each team member within the project.",
              "Establish internal communication and coordination processes.",
              "Create a shared calendar for milestone deadlines and deliverables.",
              "Regularly update team members on project progress and backer feedback.",
              "Implement a review process for all public communications and updates.",
            ],
          },

          { type: "heading", title: "Reporting milestone completion" },
          "When submitting evidence for milestone completion, include the following:",

          {
            type: "list",
            items: [
              "Comprehensive summary of work completed during the milestone period.",
              "Direct links to deliverables (e.g., GitHub repositories, design files, documentation).",
              "Before/after comparisons highlighting progress made.",
              "Video demonstrations of functional components or features.",
              "Test results or performance metrics demonstrating quality.",
              "Explanation of any deviations from the original milestone plan.",
              "Preview of upcoming work in the next milestone phase.",
            ],
          },

          {
            type: "warning",
            title: "Important",
            text: "Submit milestone completion evidence well before you require funds, as the verification process takes time (typically 3-7 days depending on your project settings).",
          },
        ],
      },
      {
        id: "for-investors",
        title: "For Investors",
        content: [
          { type: "heading", title: "Due diligence checklist" },
          "Before backing a project on Frami, consider the following due diligence checklist:",

          {
            type: "list",
            items: [
              "Team background: Verify the experience and credentials of the project team.",
              "Project feasibility: Assess if the project goals are realistic given the team, timeline, and budget.",
              "Milestone quality: Check if milestones are specific, measurable, and properly sequenced.",
              "Budget appropriateness: Evaluate if the funding request aligns with project scope.",
              "Community engagement: Gauge the project's community support and communication quality.",
              "Uniqueness: Consider how the project differentiates from existing solutions.",
              "Market potential: Assess the target market size and growth prospects.",
              "Risk factors: Identify potential challenges that could affect project success.",
            ],
          },

          { type: "heading", title: "Investment mechanics" },
          "Understanding how investments work on Frami will help you make informed decisions:",

          {
            type: "list",
            items: [
              "Contributions are made in cryptocurrency (primarily ETH and supported ERC-20 tokens).",
              "Funds are held in a secure smart contract and released according to milestone completion.",
              "Your contribution is recorded on the blockchain, providing transparent proof of backing.",
              "The minimum contribution amount is set by each project (typically 0.01 ETH or equivalent).",
              "Project backing comes with voting rights proportional to your contribution amount.",
              "Some projects may offer additional rewards or tokens for backers at various levels.",
              "If a project fails to meet a milestone within the specified timeframe, you may be eligible for a partial refund.",
            ],
          },

          { type: "heading", title: "Participating in milestone voting" },
          "As a backer, you play a critical role in project governance through milestone voting:",

          {
            type: "numbered-list",
            items: [
              "You'll receive notifications when a project you've backed submits a milestone for verification.",
              "Review the evidence provided by the project team for milestone completion.",
              "Cast your vote (approve or reject) within the specified voting period.",
              "Your voting power is proportional to your contribution to the project.",
              "If you choose to reject, provide constructive feedback explaining your decision.",
              "Monitor the overall voting progress through the project dashboard.",
              "If you don't vote within the specified period, your vote won't be counted in the final tally.",
            ],
          },

          { type: "heading", title: "Claiming refunds (if applicable)" },
          "In certain circumstances, you may be eligible for a refund of your contribution:",

          {
            type: "list",
            items: [
              "Failed milestone: If a milestone is rejected by the voting process, funds allocated to that milestone remain secured.",
              "Project cancellation: If a project is officially canceled, remaining funds are returned to backers proportionally.",
              "Expired timeline: If a project exceeds its maximum timeline without completing milestones, remaining funds may be eligible for refund.",
              "Emergency intervention: In rare cases of detected fraud, the platform may enable emergency refund mechanisms.",
            ],
          },

          {
            type: "note",
            title: "Important",
            text: "Refunds are processed automatically by the smart contract when conditions are met. No manual claim is needed in most cases.",
          },
        ],
      },
      {
        id: "for-developers",
        title: "For Developers",
        content: [
          { type: "heading", title: "Local development environment setup" },
          "To start developing with or for the Frami platform, set up your local environment:",

          {
            type: "numbered-list",
            items: [
              "Clone the Frami SDK repository: `git clone https://github.com/frami-platform/frami-sdk`",
              "Install dependencies: `npm install`",
              "Create a .env file based on the provided .env.example",
              "Set up a local blockchain environment (we recommend Hardhat)",
              "Deploy local test contracts: `npm run deploy:local`",
              "Run the development interface: `npm run dev`",
              "Connect your development wallet (MetaMask recommended) to your local network",
            ],
          },

          {
            type: "code",
            code: `// Example .env file for local development
PRIVATE_KEY=your_test_wallet_private_key
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGON_SCAN_API_KEY=your_polygonscan_api_key
LOCAL_RPC_URL=http://localhost:8545`,
          },

          { type: "heading", title: "Integration options" },
          "There are several ways to integrate with the Frami platform:",

          {
            type: "list",
            items: [
              "JavaScript SDK: Our comprehensive SDK for web applications",
              "REST API: For backend integrations and data retrieval",
              "Smart Contract Interfaces: Direct interaction with platform contracts",
              "GraphQL API: For efficient data querying (currently in beta)",
              "Webhook System: For event-based integrations",
            ],
          },

          {
            type: "code",
            code: `// Example: Using the Frami SDK to get project details
import { FramiSDK } from '@frami/sdk';

// Initialize the SDK
const frami = new FramiSDK({
  provider: window.ethereum, // or any Web3 provider
  network: 'mainnet' // or 'testnet', 'polygon', etc.
});

// Get project details
async function getProjectDetails(projectId) {
  try {
    const project = await frami.projects.getById(projectId);
    console.log('Project details:', project);
    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
  }
}`,
          },

          { type: "heading", title: "Testing framework" },
          "The Frami platform provides a comprehensive testing framework for developers:",

          {
            type: "list",
            items: [
              "Unit testing suite for smart contract interactions",
              "Integration test helpers for end-to-end workflow testing",
              "Mock data generators for simulating various platform scenarios",
              "Test network connections for Ethereum and Polygon testnets",
              "Gas usage optimization tools and benchmarks",
            ],
          },

          {
            type: "code",
            code: `// Example: Running a test for a custom extension
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { FramiTestHelper } from '@frami/testing';

describe('MyCustomExtension', function() {
  let extension, project, owner, backer;
  
  beforeEach(async function() {
    // Deploy test environment
    const helper = await FramiTestHelper.setup();
    [owner, backer] = await ethers.getSigners();
    
    // Create a test project
    project = await helper.createTestProject(owner.address);
    
    // Deploy your custom extension
    const ExtensionFactory = await ethers.getContractFactory('MyCustomExtension');
    extension = await ExtensionFactory.deploy();
    await extension.initialize(project.address);
  });
  
  it('should correctly integrate with project', async function() {
    // Your test logic here
    await project.connect(owner).addExtension(extension.address);
    expect(await project.hasExtension(extension.address)).to.be.true;
  });
});`,
          },

          { type: "heading", title: "Best practices for contract interaction" },
          {
            type: "list",
            items: [
              "Always use the latest version of the SDK for security updates",
              "Implement proper error handling for all blockchain transactions",
              "Cache data when possible to reduce redundant blockchain calls",
              "Monitor gas costs and optimize transactions for efficiency",
              "Implement retry logic for failed transactions with exponential backoff",
              "Use event listeners for real-time updates rather than polling",
              "Always validate user input before sending transactions to the blockchain",
            ],
          },

          {
            type: "warning",
            title: "Security Note",
            text: "Never store private keys in your application code. Use secure key management solutions and environment variables for sensitive information.",
          },
        ],
      },
    ],
  },
  {
    id: "technical-docs",
    title: "Technical Documentation",
    items: [
      {
        id: "contract-reference",
        title: "Contract Reference",
        content: [
          { type: "heading", title: "PlatformRegistry" },
          "The PlatformRegistry is the central hub of the Frami ecosystem, responsible for managing all platform components and their interactions.",

          { type: "subheading", title: "Methods and events" },
          {
            type: "table",
            headers: ["Method/Event", "Description", "Parameters"],
            rows: [
              [
                "registerExtension",
                "Registers a new extension in the platform registry",
                "address extension, string name, string category",
              ],
              [
                "removeExtension",
                "Removes an extension from the registry",
                "address extension",
              ],
              [
                "getExtensionsByCategory",
                "Returns all extensions in a specific category",
                "string category",
              ],
              [
                "setImplementation",
                "Updates the implementation address for a contract type",
                "string contractType, address implementation",
              ],
              [
                "getImplementation",
                "Gets the current implementation address for a contract type",
                "string contractType",
              ],
              [
                "ExtensionRegistered",
                "Event emitted when a new extension is registered",
                "address extension, string name, string category",
              ],
              [
                "ExtensionRemoved",
                "Event emitted when an extension is removed",
                "address extension",
              ],
              [
                "ImplementationUpdated",
                "Event emitted when a contract implementation is updated",
                "string contractType, address implementation",
              ],
            ],
          },

          { type: "subheading", title: "Storage structure" },
          {
            type: "code",
            code: `// PlatformRegistry storage layout
struct PlatformRegistryStorage {
    // Implementation mappings
    mapping(string => address) implementations;
    
    // Extension registry
    mapping(address => ExtensionInfo) extensions;
    mapping(string => address[]) extensionsByCategory;
    
    // Access control
    mapping(address => bool) admins;
    mapping(address => bool) upgraders;
    
    // Configuration
    uint256 platformFee;
    address treasury;
    
    // Reserved storage slots for future upgrades
    uint256[50] __gap;
}

struct ExtensionInfo {
    string name;
    string category;
    bool active;
}`,
          },

          { type: "subheading", title: "Access control" },
          "The PlatformRegistry implements a robust access control system:",

          {
            type: "list",
            items: [
              "ADMIN_ROLE: Can add/remove extensions and modify platform settings",
              "UPGRADER_ROLE: Can update contract implementations",
              "Multi-sig security for critical operations",
              "Time-locked upgrades for major platform changes",
              "Emergency controls with appropriate checks and balances",
            ],
          },

          { type: "heading", title: "ProjectFactory" },
          "The ProjectFactory creates and manages project instances across the platform.",

          { type: "subheading", title: "Proxy deployment process" },
          "When a new project is created, the ProjectFactory follows this process:",

          {
            type: "numbered-list",
            items: [
              "Validates project parameters against platform requirements",
              "Retrieves the current Project implementation from PlatformRegistry",
              "Deploys a new proxy contract pointing to the implementation",
              "Initializes the proxy with project parameters and creator information",
              "Registers the new project in the platform's project registry",
              "Assigns appropriate roles to the project creator",
              "Emits a ProjectCreated event with project details",
            ],
          },

          { type: "subheading", title: "Project creation parameters" },
          {
            type: "table",
            headers: ["Parameter", "Description", "Validation Rules"],
            rows: [
              ["name", "Project display name", "Non-empty, max 100 characters"],
              [
                "description",
                "Brief project description",
                "Max 1000 characters",
              ],
              [
                "fundingGoal",
                "Total funding target",
                "Greater than minimum (0.1 ETH)",
              ],
              [
                "duration",
                "Maximum project duration in days",
                "Between 1 and 365 days",
              ],
              [
                "milestones",
                "Array of milestone objects",
                "At least 1 milestone, total funding % must equal 100",
              ],
              [
                "category",
                "Project category identifier",
                "Must be from approved list",
              ],
              [
                "creator",
                "Address of project creator",
                "Must be transaction sender or approved delegate",
              ],
            ],
          },

          { type: "subheading", title: "Implementation updates" },
          "The platform supports upgrading the Project implementation to add features and fix bugs:",

          {
            type: "list",
            items: [
              "New implementations must be compatible with existing storage layout",
              "Upgrades are permissioned to platform admins through PlatformRegistry",
              "All projects automatically benefit from implementation upgrades",
              "Upgrade events are transparent and visible on the blockchain",
              "Critical upgrades undergo a security review and public announcement",
            ],
          },
        ],
      },
      {
        id: "project-contract",
        title: "Project Contract",
        content: [
          { type: "heading", title: "Lifecycle states" },
          "A project can exist in one of the following states:",

          {
            type: "table",
            headers: ["State", "Description", "Transitions"],
            rows: [
              [
                "Draft",
                "Initial creation state, not yet published",
                "Can move to Active when published",
              ],
              [
                "Active",
                "Project is published and accepting funds",
                "Can move to Successful, Failed, or Canceled",
              ],
              [
                "Successful",
                "Project reached its funding goal and completed all milestones",
                "Terminal state",
              ],
              [
                "Failed",
                "Project did not reach minimum funding or failed critical milestone",
                "Terminal state",
              ],
              [
                "Canceled",
                "Project was canceled by creator or admin",
                "Terminal state",
              ],
            ],
          },

          { type: "heading", title: "Investment handling" },
          "The Project contract manages investment flows with the following mechanisms:",

          {
            type: "list",
            items: [
              "Secure escrow of all contributed funds in the contract until milestone completion",
              "Support for multiple investment currencies (ETH and approved ERC-20 tokens)",
              "Minimum and maximum investment amounts configurable per project",
              "Investment tracking with detailed records of all backers and amounts",
              "Automatic issuance of backer benefits based on contribution levels",
              "Refund capabilities in case of project failure or cancellation",
            ],
          },

          {
            type: "code",
            code: `// Example investment flow
function invest() external payable {
    // Validate project state
    require(state == ProjectState.Active, "Project not active");
    
    // Validate investment amount
    require(msg.value >= minimumInvestment, "Below minimum investment");
    require(
        totalInvested + msg.value <= fundingGoal, 
        "Exceeds funding goal"
    );
    
    // Record investment
    investments[msg.sender] += msg.value;
    totalInvested += msg.value;
    
    // Update backer status
    if (!isBackerRegistered[msg.sender]) {
        backers.push(msg.sender);
        isBackerRegistered[msg.sender] = true;
    }
    
    // Issue any applicable rewards
    _issueRewards(msg.sender, msg.value);
    
    // Emit event
    emit InvestmentReceived(msg.sender, msg.value);
}`,
          },

          { type: "heading", title: "Milestone management" },
          "Milestones are a critical component of the Project contract:",

          {
            type: "list",
            items: [
              "Each milestone has funding percentage, description, and completion criteria",
              "Milestone funds are locked until verification process completes",
              "Verification requires sufficient positive votes from backers",
              "Voting power is proportional to investment amount",
              "Automatic fund release to project creator upon successful verification",
              "Platform fees are deducted at the time of fund release",
            ],
          },

          {
            type: "code",
            code: `// Simplified milestone verification process
function submitMilestoneForVerification(
    uint256 milestoneIndex,
    string calldata evidenceUri
) external onlyCreator {
    Milestone storage milestone = milestones[milestoneIndex];
    
    require(milestone.status == MilestoneStatus.Pending, "Invalid status");
    require(milestoneIndex == currentMilestoneIndex, "Not current milestone");
    
    milestone.evidenceUri = evidenceUri;
    milestone.status = MilestoneStatus.InVerification;
    milestone.verificationDeadline = block.timestamp + verificationPeriod;
    
    emit MilestoneSubmitted(milestoneIndex, evidenceUri);
}

function voteOnMilestone(
    uint256 milestoneIndex,
    bool approve
) external onlyBacker {
    Milestone storage milestone = milestones[milestoneIndex];
    require(milestone.status == MilestoneStatus.InVerification, "Not in verification");
    require(block.timestamp < milestone.verificationDeadline, "Voting period ended");
    
    uint256 votingPower = investments[msg.sender];
    
    if (approve) {
        milestone.approvalVotes += votingPower;
    } else {
        milestone.rejectionVotes += votingPower;
    }
    
    milestone.hasVoted[msg.sender] = true;
    
    emit MilestoneVoteCast(milestoneIndex, msg.sender, approve, votingPower);
}`,
          },

          { type: "heading", title: "Fund distribution" },
          "Upon successful milestone verification, funds are distributed as follows:",

          {
            type: "list",
            items: [
              "Calculator determines the exact amount based on milestone percentage and total funds raised",
              "Platform fee (default 5%) is deducted and sent to platform treasury",
              "Remaining funds are transferred to the project creator's address",
              "Transfer events are emitted with detailed breakdown",
              "Milestone status is updated to Completed",
              "If all milestones are completed, project state changes to Successful",
            ],
          },

          {
            type: "code",
            code: `// Simplified fund release process
function releaseMilestoneFunds(uint256 milestoneIndex) external {
    Milestone storage milestone = milestones[milestoneIndex];
    
    // Validate milestone can be released
    require(milestone.status == MilestoneStatus.InVerification, "Not in verification");
    require(
        block.timestamp >= milestone.verificationDeadline || 
        _hasSufficientApproval(milestone),
        "Verification not complete"
    );
    require(
        milestone.approvalVotes > milestone.rejectionVotes,
        "Milestone rejected"
    );
    
    // Calculate amounts
    uint256 totalAmount = (totalInvested * milestone.fundingPercentage) / 100;
    uint256 platformFeeAmount = (totalAmount * platformFee) / 10000; // fee in basis points
    uint256 creatorAmount = totalAmount - platformFeeAmount;
    
    // Update milestone status
    milestone.status = MilestoneStatus.Completed;
    if (milestoneIndex < milestones.length - 1) {
        currentMilestoneIndex = milestoneIndex + 1;
    } else {
        state = ProjectState.Successful;
    }
    
    // Transfer funds
    if (platformFeeAmount > 0) {
        payable(platformTreasury).transfer(platformFeeAmount);
    }
    payable(creator).transfer(creatorAmount);
    
    emit MilestoneFundsReleased(
        milestoneIndex, 
        totalAmount, 
        platformFeeAmount, 
        creatorAmount
    );
}`,
          },
        ],
      },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      {
        id: "sdk-api-references",
        title: "SDK & API References",
        content: [
          { type: "heading", title: "JavaScript SDK documentation" },
          "The Frami JavaScript SDK provides a comprehensive set of tools for interacting with the platform:",

          {
            type: "code",
            code: `// Installing the SDK
npm install @frami/sdk

// Basic usage
import { FramiSDK } from '@frami/sdk';

// Initialize with provider
const frami = new FramiSDK({
  provider: window.ethereum, // or any Web3 provider
  network: 'mainnet' // or 'testnet', 'polygon', etc.
});

// Example: Get all projects
const projects = await frami.projects.getAll();

// Example: Get specific project
const project = await frami.projects.getById('project-id');

// Example: Create a project
const newProject = await frami.projects.create({
  name: 'My Amazing Project',
  description: 'This project will change the world',
  fundingGoal: ethers.utils.parseEther('10'), // 10 ETH
  duration: 60, // 60 days
  milestones: [
    {
      title: 'Initial prototype',
      description: 'Develop the first working prototype',
      fundingPercentage: 20
    },
    {
      title: 'Beta release',
      description: 'Launch beta version with core features',
      fundingPercentage: 40
    },
    {
      title: 'Public launch',
      description: 'Full public release with all features',
      fundingPercentage: 40
    }
  ]
});`,
          },

          {
            type: "list",
            items: [
              "Full TypeScript support with comprehensive type definitions",
              "Extensive documentation with code examples for all features",
              "Event subscription system for real-time updates",
              "Comprehensive error handling with detailed error messages",
              "Gas estimation utilities for transaction planning",
              "Caching layer for optimized performance",
              "Wallet connection abstractions supporting multiple providers",
            ],
          },

          { type: "heading", title: "API endpoints" },
          "For developers who prefer direct API integration, Frami offers a RESTful API:",

          {
            type: "table",
            headers: ["Endpoint", "Method", "Description"],
            rows: [
              [
                "/api/projects",
                "GET",
                "List all projects with filtering options",
              ],
              ["/api/projects/:id", "GET", "Get details of a specific project"],
              [
                "/api/projects/:id/milestones",
                "GET",
                "Get milestones for a project",
              ],
              ["/api/projects/:id/backers", "GET", "Get backers of a project"],
              [
                "/api/users/:address/projects",
                "GET",
                "Get projects created by a user",
              ],
              [
                "/api/users/:address/investments",
                "GET",
                "Get investments made by a user",
              ],
              ["/api/stats", "GET", "Get platform statistics and metrics"],
            ],
          },

          {
            type: "code",
            code: `// Example API request using fetch
async function getProject(projectId) {
  const response = await fetch(
    \`https://api.frami.io/api/projects/\${projectId}\`,
    {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }
  
  return await response.json();
}`,
          },

          {
            type: "note",
            title: "API Access",
            text: "To use the Frami API, you need to register for an API key through the developer portal. API usage is subject to rate limits based on your subscription tier.",
          },
        ],
      },
      {
        id: "community-guidelines",
        title: "Community Guidelines",
        content: [
          { type: "heading", title: "Code of conduct" },
          "The Frami community adheres to a code of conduct that promotes a positive, inclusive environment for all participants:",

          {
            type: "list",
            items: [
              "Respect: Treat all community members with respect, regardless of background, identity, or experience level.",
              "Inclusivity: Foster an inclusive environment where diverse perspectives are welcomed and valued.",
              "Constructive Communication: Provide feedback in a constructive, helpful manner.",
              "Responsibility: Take responsibility for your words and actions within the community.",
              "Safety: Help create a safe space free from harassment, discrimination, and harmful behavior.",
              "Privacy: Respect the privacy and confidentiality of other community members.",
              "Collaboration: Work together to solve problems and advance the platform's goals.",
            ],
          },

          {
            type: "warning",
            title: "Enforcement",
            text: "Violations of the code of conduct may result in warnings, temporary suspension, or permanent removal from the platform, depending on the severity and context of the violation.",
          },

          { type: "heading", title: "Contribution guidelines" },
          "We welcome contributions to the Frami ecosystem. Here's how you can contribute effectively:",

          {
            type: "list",
            items: [
              "Start Small: Begin with smaller issues or improvements to familiarize yourself with the codebase.",
              "Follow Standards: Adhere to the coding standards and guidelines documented in the repository.",
              "Test Thoroughly: Ensure all contributions include appropriate tests.",
              "Document Changes: Provide clear documentation for any new features or changes.",
              "Submit PRs: Create pull requests with concise descriptions of the changes and their purpose.",
              "Review Process: Be open to feedback during the code review process.",
              "Licensing: All contributions must be licensed under the project's open source license.",
            ],
          },

          { type: "heading", title: "Support channels" },
          "Get help and connect with the Frami community through these official channels:",

          {
            type: "table",
            headers: ["Channel", "Purpose", "Link"],
            rows: [
              [
                "Discord",
                "Real-time community discussions and support",
                "discord.gg/frami",
              ],
              [
                "Forum",
                "Detailed discussions, proposals, and community governance",
                "forum.frami.io",
              ],
              [
                "GitHub",
                "Code contributions, issue tracking, and technical discussions",
                "github.com/frami-platform",
              ],
              [
                "Developer Chat",
                "Technical support for developers building on Frami",
                "dev.frami.io/chat",
              ],
              [
                "Twitter",
                "Platform announcements and updates",
                "twitter.com/FramiPlatform",
              ],
              [
                "Help Center",
                "Knowledge base with guides and troubleshooting",
                "help.frami.io",
              ],
            ],
          },
        ],
      },
      {
        id: "faqs",
        title: "FAQs",
        content: [
          { type: "heading", title: "Platform mechanics" },

          { type: "subheading", title: "What is milestone-based funding?" },
          "Milestone-based funding is a method where project funds are released in stages as specific development milestones are achieved and verified. This creates accountability for creators and reduces risk for backers, as funds are only released when tangible progress is demonstrated.",

          { type: "subheading", title: "How does verification work?" },
          "When a creator submits evidence of completing a milestone, backers review the evidence and vote to approve or reject it. If approved by a sufficient majority, the funds allocated to that milestone are released to the creator. This creates a transparent, community-driven verification process.",

          { type: "subheading", title: "Can I use fiat currency?" },
          "Currently, the platform primarily supports cryptocurrency transactions (ETH and select ERC-20 tokens). However, we plan to add fiat on-ramps in the future to make the platform more accessible to non-crypto users.",

          { type: "subheading", title: "What happens if a project fails?" },
          "If a project fails to complete its milestones or is abandoned, any unreleased funds (those allocated to incomplete milestones) can be reclaimed by backers through the platform's refund mechanism.",

          { type: "heading", title: "Fees and payments" },

          { type: "subheading", title: "What fees does Frami charge?" },
          "Frami charges a 5% platform fee on funds successfully raised (applied only when milestone funds are released). Additional fees may apply for certain extensions or special features. FounderNFT holders receive fee discounts of up to 40%.",

          { type: "subheading", title: "How are gas fees handled?" },
          "Users are responsible for paying the gas fees for their own transactions on the blockchain. The platform is optimized to minimize gas costs where possible, and we provide gas estimation tools to help users understand potential costs before confirming transactions.",

          { type: "subheading", title: "When do creators receive funds?" },
          "Creators receive funds incrementally as milestones are completed and verified. Once a milestone is approved through the verification process, the corresponding portion of the project funding is immediately transferred to the creator's wallet.",

          { type: "heading", title: "Security concerns" },

          { type: "subheading", title: "How secure is the platform?" },
          "The Frami platform undergoes regular security audits by leading blockchain security firms. Our smart contracts implement best practices for secure contract development, including formal verification where applicable. We also maintain a bug bounty program to incentivize responsible disclosure of potential vulnerabilities.",

          {
            type: "subheading",
            title: "What happens if I lose access to my wallet?",
          },
          "If you lose access to your wallet, we cannot recover your account or funds directly due to the decentralized nature of blockchain. We strongly recommend using wallet recovery options like seed phrases and hardware wallets. For creators, we offer optional multi-sig project control that can help mitigate single points of failure.",

          { type: "subheading", title: "Are smart contracts audited?" },
          "Yes, all core smart contracts are audited by independent security firms before deployment. Audit reports are published on our website and GitHub repository. Extensions undergo a thorough review process before being approved for the platform.",

          { type: "heading", title: "Troubleshooting" },

          { type: "subheading", title: "Transaction failed or stuck pending" },
          "If your transaction is stuck or failed, it may be due to insufficient gas, network congestion, or wallet issues. Try increasing the gas price (for stuck transactions), ensure your wallet has sufficient funds, or check the network status. If problems persist, visit our Help Center or contact support.",

          { type: "subheading", title: "Cannot connect wallet" },
          "Wallet connection issues may be caused by browser extensions, privacy settings, or wallet compatibility. Try refreshing the page, ensuring your wallet is unlocked, using a different browser, or checking for wallet updates. We support MetaMask, WalletConnect, and several other popular wallet providers.",

          { type: "subheading", title: "Milestone verification issues" },
          "If you're experiencing problems with milestone verification, check that you've provided comprehensive evidence, the verification period hasn't expired, and you've met all the criteria specified in the milestone description. For project backers, ensure your wallet is properly connected when attempting to vote on milestones.",
        ],
      },
    ],
  },
];
