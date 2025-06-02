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
    id: "start-here",
    title: "START HERE",
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
    ],
  },
  {
    id: "roadmap",
    title: "ROAD MAP",
    items: [
      {
        id: "platform-roadmap",
        title: "Platform Development Roadmap",
        description:
          "Detailed timeline of Frami platform development for 2025-2026",
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
              "Integration with Web3 wallets",
            ],
          },

          { type: "subheading", title: "FounderNFT Launch" },
          "Limited collection of NFTs representing early platform supporters",
          { type: "subheading", title: "Exclusive Benefits:" },
          {
            type: "list",
            items: [
              "Priority access to premium projects before public rounds",
              "Enhanced fee sharing (Starting from 50% of all total fees)",
              "Governance voting rights for platform decisions",
            ],
          },

          { type: "subheading", title: "Core Contract Functionality" },
          {
            type: "list",
            items: [
              "Implementation of upgradeable smart contract architecture (UUPS pattern)",
              "Project creation and configuration capabilities",
              "Milestone-based funding with transparent progress tracking",
              "Investor contribution and withdrawal mechanisms",
              "Secure fund management with milestone-based release",
            ],
          },

          { type: "subheading", title: "First 10 Projects Curation" },
          {
            type: "list",
            items: [
              "Selection of diverse, high-quality inaugural projects",
              "Founder-led evaluation process to ensure project viability",
              "Ranging across multiple sectors (technology, creative, social impact)",
              "Special promotion and support for these foundational projects",
            ],
          },

          { type: "subheading", title: "Security Audit" },
          {
            type: "list",
            items: [
              "Comprehensive third-party audit of all smart contracts",
              "Penetration testing of platform infrastructure",
              "Implementation of security recommendations",
              "Publication of audit reports for community transparency",
            ],
          },

          { type: "heading", title: "Q3 - 2025: Feature Expansion" },
          { type: "subheading", title: "Community Building Initiatives" },
          {
            type: "list",
            items: [
              "Ambassador program for community-led growth",
              "Educational webinars on platform usage and benefits",
              "Social media and content strategy implementation",
              "Community forums and support channels establishment",
            ],
          },

          { type: "subheading", title: "Token (ERC20) Creator" },
          {
            type: "list",
            items: [
              "No-code tool for project-specific token creation",
              "Customizable tokenomics parameters",
              "Automated vesting and distribution schedules",
              "Integration with project milestones for token release",
            ],
          },

          { type: "subheading", title: "NFT (ERC721) Creator" },
          {
            type: "list",
            items: [
              "Simple interface for project-related NFT collections",
              "Customizable traits and rarity settings",
              "Metadata and asset management tools",
              "Integration with funding tiers and rewards",
            ],
          },

          { type: "subheading", title: "Multi-Currency Support" },
          {
            type: "list",
            items: [
              "Expansion beyond ETH to include stable coins (USDC, USDT)",
              "Smart contract adaptations for multi-currency handling",
              "Conversion and exchange rate management",
              "Gas optimization for various token standards",
            ],
          },

          { type: "subheading", title: "Analytics Dashboard" },
          {
            type: "list",
            items: [
              "Real-time project performance metrics",
              "Funding progress visualization",
              "Milestone completion statistics",
              "Investor engagement and contribution analytics",
              "Customizable reporting for project creators",
            ],
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
              "Distributed validation to ensure fairness",
            ],
          },

          {
            type: "subheading",
            title: "FounderNFT Staking Rewards Improvement",
          },
          {
            type: "list",
            items: [
              "Staking mechanism for compounding rewards",
              "Fee distribution proportional to stake duration and amount",
              "Special rewards for long-term stakers",
            ],
          },

          { type: "subheading", title: "Cross-Chain Bridge Functionality" },
          {
            type: "list",
            items: [
              "Interoperability between Ethereum and other major chains",
              "Secure bridge contracts for cross-chain asset transfer",
              "Multi-chain project contribution capabilities",
              "Chain-specific optimization for lower fees and faster transactions",
            ],
          },

          { type: "subheading", title: "Reputation System" },
          {
            type: "list",
            items: [
              "Dynamic reputation scoring for project creators",
              "Historical performance metrics",
              "Verification badges and trust indicators",
              "Community feedback integration",
              "Impact on future project parameters (fees, limits)",
            ],
          },

          { type: "subheading", title: "Automated Milestone Verification" },
          {
            type: "list",
            items: [
              "AI-assisted milestone validation",
              "Integration with external data sources for verification",
              "Reduction in manual verification requirements",
              "Transparent verification criteria and processes",
            ],
          },

          { type: "subheading", title: "Risk Assessment System" },
          {
            type: "list",
            items: [
              "AI-powered analysis of project viability",
              "Risk scoring based on multiple factors",
              "Historical data comparison and pattern recognition",
              "Recommendation engine for investors",
              "Due diligence automation and assistance",
            ],
          },

          { type: "subheading", title: "Enhanced Governance for NFT Holders" },
          {
            type: "list",
            items: [
              "Voting weight boost for FounderNFT holders",
              "Proposal creation and management system",
              "Transparent voting mechanism",
              "Implementation of executable outcomes based on votes",
            ],
          },

          { type: "subheading", title: "Whitelist Access System" },
          {
            type: "list",
            items: [
              "Priority access mechanisms for high-demand projects",
              "FounderNFT tier-based allocation system",
              "Fair distribution algorithms",
              "Anti-Sybil mechanisms to prevent gaming the system",
            ],
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
              "Working groups and specialized committees",
            ],
          },

          { type: "subheading", title: "Extension Economy" },
          {
            type: "list",
            items: [
              "Marketplace for third-party platform extensions",
              "Developer tools and documentation",
              "Revenue sharing from extension usage to FounderNFT holders",
              "Quality assurance and security processes",
              "Early access to new extensions for FounderNFT holders",
            ],
          },

          { type: "subheading", title: "LayerZero Integration" },
          {
            type: "list",
            items: [
              "Cross-chain Project Funding: Investments from multiple chains into single projects",
              "Multi-chain Project Deployment: Simultaneous deployment across networks",
              "Chain-agnostic Governance: Voting capabilities across different blockchains",
              "Omnichain NFT Compatibility: FounderNFTs with cross-chain utility",
              "Cross-chain Fee Distribution: Platform fees distributed regardless of chain",
            ],
          },

          { type: "subheading", title: "Decentralized Identity Integration" },
          {
            type: "list",
            items: [
              "Self-sovereign identity solutions",
              "Privacy-preserving verification",
              "Reputation portability across platforms",
              "Credential-based access control",
              "Integration with existing DID standards",
            ],
          },

          { type: "subheading", title: "Fiat On-ramp Partnerships" },
          {
            type: "list",
            items: [
              "Direct fiat currency contribution options",
              "Compliant KYC/AML processes",
              "Banking partnerships for seamless transfers",
              "Lower barriers for non-crypto users",
              "Support for multiple currencies and payment methods",
            ],
          },

          { type: "subheading", title: "Developer API & SDK" },
          {
            type: "list",
            items: [
              "Comprehensive documentation for integration",
              "Webhooks for platform events",
              "Client libraries in multiple languages",
              "Sample applications and use cases",
              "Developer community support",
            ],
          },

          {
            type: "note",
            title: "Roadmap Flexibility",
            text: "This roadmap represents our current development priorities, though we remain agile and responsive to market conditions and community feedback. The Frami team is committed to building a platform that empowers creators, rewards early supporters, and advances the possibilities of decentralized funding.",
          },
        ],
      },
    ],
  },
  {
    id: "guides",
    title: "GUIDES",
    items: [
      {
        id: "for-project-creators",
        title: "For Project Creators",
        content: [
          { type: "heading", title: "Creating a successful funding campaign" },
          "Building a compelling crowdfunding campaign on Frami requires careful planning and execution. Here are key strategies for success:",

          {
            type: "list",
            items: [
              "Define clear, achievable milestones with measurable outcomes",
              "Create engaging project content including high-quality images and videos",
              "Set a realistic funding goal based on your project requirements",
              "Craft an enticing value proposition for potential backers",
              "Develop a comprehensive marketing strategy",
              "Plan for regular project updates throughout the campaign",
            ],
          },

          { type: "heading", title: "Setting up effective milestones" },
          "Milestones are central to Frami's funding model. They help backers track progress and manage risk. When creating milestones:",

          {
            type: "list",
            items: [
              "Break down your project into logical, sequential phases",
              "Define clear deliverables for each milestone",
              "Set realistic timeframes for completion",
              "Align funding needs with each development phase",
              "Include verification methods for milestone completion",
              "Balance detail with flexibility to adapt to changing conditions",
            ],
          },

          { type: "heading", title: "Project page best practices" },
          "Your project page is your pitch to potential backers. Make it count:",

          {
            type: "list",
            items: [
              "Use a clear, compelling project title that communicates your vision",
              "Write a concise but detailed project description",
              "Include high-quality visual assets (images, videos, prototypes)",
              "Highlight your team's expertise and background",
              "Clearly explain the problem you're solving and your solution",
              "Outline key milestones and how funds will be used",
              "Address potential risks and how you plan to mitigate them",
            ],
          },

          { type: "heading", title: "Community engagement strategies" },
          "Building and maintaining an active community around your project is crucial for success:",

          {
            type: "list",
            items: [
              "Respond promptly to questions and feedback",
              "Schedule regular AMAs (Ask Me Anything) sessions",
              "Share behind-the-scenes updates of your development process",
              "Create exclusive content for backers",
              "Recognize and highlight active community members",
              "Use social media to amplify your project's reach",
              "Collect and incorporate community feedback",
            ],
          },

          {
            type: "note",
            title: "Transparency matters",
            text: "Blockchain technology enables unprecedented transparency. Embrace this by being open about your progress, challenges, and how funds are being used. This builds trust with your backers and increases long-term support.",
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
              "Relevant: Directly related to the project's overall goals.",
              "Time-bound: Include clear deadlines for completion.",
              "Verifiable: Include methods to validate completion.",
            ],
          },

          { type: "heading", title: "Milestone verification process" },
          "When a milestone is marked as complete, the following verification process is triggered:",

          {
            type: "numbered-list",
            items: [
              "Creator submits evidence of milestone completion.",
              "Verification method is activated based on project settings (community vote, designated validators, or automated checks).",
              "Verification period begins (typically 3-7 days).",
              "If approved, funds allocated to the milestone are released to the project.",
              "If rejected, the creator can address concerns and resubmit, or dispute the rejection.",
            ],
          },

          { type: "heading", title: "Fund distribution mechanics" },
          "The Frami platform employs a secure and transparent fund distribution system:",

          {
            type: "list",
            items: [
              "Escrow: Funds are held in a smart contract escrow until milestones are verified.",
              "Proportional Release: Each milestone releases a predetermined percentage of the total funds.",
              "Backer Protection: If a project fails to complete milestones within the specified timeframe, unused funds can be returned to backers.",
              "Creator Incentives: Successfully completing milestones on time can unlock bonuses or additional benefits.",
              "Transparent Tracking: All fund movements are recorded on the blockchain and visible to backers.",
            ],
          },

          {
            type: "warning",
            title: "Important Consideration",
            text: "When defining milestones, ensure that early milestones provide demonstrable value to backers. This builds trust and establishes credibility for later, more complex development phases.",
          },
        ],
      },
      {
        id: "for-investors",
        title: "For Investors",
        content: [
          { type: "heading", title: "Evaluating project potential" },
          "Due diligence is essential when investing in blockchain projects. Here's how to assess a project's potential on Frami:",

          {
            type: "list",
            items: [
              "Review the team's background, experience, and track record",
              "Evaluate the project's value proposition and market need",
              "Assess the technology and implementation approach",
              "Examine milestone structure and funding allocation",
              "Check community engagement and social proof",
              "Research the competitive landscape",
              "Consider the tokenomics model (if applicable)",
            ],
          },

          { type: "heading", title: "Understanding risk factors" },
          "All investments carry risk, and blockchain projects have unique considerations:",

          {
            type: "list",
            items: [
              "Execution risk: The team's ability to deliver on promises",
              "Market risk: Demand for the final product or service",
              "Technology risk: Technical feasibility and security concerns",
              "Regulatory risk: Potential legal challenges or changes",
              "Liquidity risk: Ability to exit your investment if needed",
              "Fork risk: Potential for blockchain protocol changes",
            ],
          },

          { type: "heading", title: "Portfolio diversification strategies" },
          "Building a balanced investment portfolio on Frami:",

          {
            type: "list",
            items: [
              "Diversify across different project categories",
              "Allocate capital across various development stages",
              "Mix short-term and long-term investment horizons",
              "Balance high-risk/high-reward with more established projects",
              "Consider geographic diversification",
              "Invest across different blockchain ecosystems",
            ],
          },

          { type: "heading", title: "Monitoring your investments" },
          "Stay informed about your portfolio's performance:",

          {
            type: "list",
            items: [
              "Track milestone completions and project updates",
              "Participate in governance votes for important decisions",
              "Join project communities to gauge sentiment and progress",
              "Set up notifications for major project events",
              "Regularly reassess your investment thesis",
              "Document lessons learned from each investment",
            ],
          },

          {
            type: "warning",
            title: "Investment Disclaimer",
            text: "Investing in blockchain projects involves significant risk. Never invest more than you can afford to lose, and consider consulting with a financial advisor before making investment decisions.",
          },
        ],
      },
    ],
  },
  {
    id: "core-concepts",
    title: "CORE CONCEPTS",
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
        title: "Extension System (Coming Soon)",
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
        id: "platform-governance",
        title: "Platform Governance (Coming Soon)",
        content: [
          { type: "heading", title: "Governance structure" },
          "Frami employs a multi-level governance structure to ensure platform decisions are made fairly and transparently:",

          {
            type: "list",
            items: [
              "FounderNFT Holders: Have primary voting rights on platform upgrades and major decisions.",
              "Active Backers: Can vote on specific project-related matters and milestone verifications.",
              "Project Creators: Have decision-making authority within their own projects, subject to platform rules.",
              "Core Team: Maintains operational oversight during the platform's early stages.",
            ],
          },

          { type: "heading", title: "Voting mechanisms" },
          "Various voting mechanisms are employed based on the type and impact of decisions:",

          {
            type: "table",
            headers: [
              "Decision Type",
              "Voting Mechanism",
              "Required Threshold",
              "Duration",
            ],
            rows: [
              [
                "Protocol Upgrades",
                "FounderNFT Weighted Voting",
                "66% Majority",
                "7 Days",
              ],
              [
                "Parameter Changes",
                "FounderNFT Weighted Voting",
                "51% Majority",
                "5 Days",
              ],
              [
                "Project Milestone Verification",
                "Backer Token-weighted Voting",
                "51% Majority",
                "3 Days",
              ],
              [
                "Community Fund Allocation",
                "Quadratic Voting",
                "51% Majority",
                "5 Days",
              ],
              [
                "Emergency Actions",
                "Multi-sig Council",
                "7/10 Signatures",
                "24 Hours",
              ],
            ],
          },

          { type: "heading", title: "Proposal process" },
          "The governance proposal process follows these steps:",

          {
            type: "numbered-list",
            items: [
              "Proposal Creation: Any FounderNFT holder can create a governance proposal.",
              "Discussion Period: 2-day period for community discussion and proposal refinement.",
              "Voting Period: Voting opens for the duration specified based on proposal type.",
              "Execution: If approved, proposals are executed automatically through smart contracts.",
              "Implementation: Technical changes are implemented according to the proposal timeline.",
            ],
          },

          { type: "heading", title: "Governance evolution" },
          "The Frami governance system will evolve over time toward greater decentralization:",

          {
            type: "list",
            items: [
              "Phase 1 (Launch): Core team maintains veto power for safety and security concerns.",
              "Phase 2 (Stabilization): Transition to community voting with safeguards.",
              "Phase 3 (Decentralization): Full DAO governance with optimistic governance model.",
              "Phase 4 (Maturity): Multi-chain governance allowing cross-chain decision-making.",
            ],
          },

          {
            type: "note",
            title: "Governance Participation",
            text: "Active participation in governance is incentivized through reputation scoring and governance rewards, ensuring ongoing engagement from the community.",
          },
        ],
      },
    ],
  },
  {
    id: "resources",
    title: "RESOURCES",
    items: [
      {
        id: "community-guidelines",
        title: "Community Guidelines",
        content: [
          { type: "heading", title: "Code of Conduct" },
          "Our community is built on respect, transparency, and collaboration. We expect all participants to adhere to these guidelines when interacting on the Frami platform:",

          {
            type: "list",
            items: [
              "Treat all community members with respect and courtesy",
              "Communicate openly and constructively",
              "Provide honest feedback without personal attacks",
              "Respect intellectual property and give proper attribution",
              "Report inappropriate behavior through proper channels",
              "Maintain professionalism in all interactions",
            ],
          },

          { type: "heading", title: "Communication channels" },
          "Frami offers several official communication channels for community engagement:",

          {
            type: "list",
            items: [
              "Platform Forums: Discuss projects, share ideas, and connect with other members",
              "Discord Server: Real-time conversations and community support",
              "Twitter: Latest updates and announcements",
              "Medium Blog: In-depth articles and thought leadership",
              "Project Comment Sections: Project-specific discussions",
            ],
          },

          { type: "heading", title: "Dispute resolution process" },
          "In the event of disagreements or disputes, we follow a structured resolution process:",

          {
            type: "numbered-list",
            items: [
              "Direct Communication: Parties should first attempt to resolve issues directly",
              "Mediation: If needed, a community moderator can facilitate discussion",
              "Formal Review: Unresolved disputes can be escalated to the platform governance team",
              "Governance Vote: For significant disputes, a platform-wide vote may be conducted",
              "Binding Decision: The outcome of the governance vote is final and binding",
            ],
          },

          {
            type: "warning",
            title: "Important",
            text: "Harassment, hate speech, discrimination, and abuse are not tolerated on the Frami platform. Violations may result in temporary or permanent removal from the community.",
          },
        ],
      },
      {
        id: "faqs",
        title: "FAQs",
        content: [
          { type: "heading", title: "General Platform Questions" },

          { type: "subheading", title: "What is Frami?" },
          "Frami is a blockchain-powered crowdfunding platform that enables creators to raise funds for their projects through a transparent, secure, and milestone-based approach. The platform leverages blockchain technology to ensure accountability and align incentives between project creators and backers.",

          {
            type: "subheading",
            title:
              "How does Frami differ from traditional crowdfunding platforms?",
          },
          "Unlike traditional platforms, Frami utilizes blockchain technology for transparent fund management, releases funding based on verified milestone completion, enables community governance through voting mechanisms, and provides exclusive benefits to early supporters through FounderNFTs.",

          {
            type: "subheading",
            title: "Do I need technical blockchain knowledge to use Frami?",
          },
          "No, Frami is designed to be user-friendly for both technical and non-technical users. While understanding blockchain basics can be helpful, our platform handles the technical complexity so you can focus on creating or supporting projects.",

          { type: "heading", title: "Project Creation" },

          { type: "subheading", title: "How do I start a project on Frami?" },
          "To create a project, connect your wallet, navigate to the 'Create Project' section, fill out the required information (project details, funding goals, milestones), and submit for review. Once approved, your project will be live on the platform.",

          {
            type: "subheading",
            title: "What types of projects are allowed on Frami?",
          },
          "Frami supports a wide range of projects including technology, creative arts, community initiatives, and more. Projects must comply with our terms of service and not involve illegal activities, hate speech, or harmful content.",

          { type: "subheading", title: "How are project milestones verified?" },
          "Milestone verification depends on the project's configuration. Options include community voting, designated validators, automated verification through oracles, or a combination of these methods. The verification process is transparent and results are recorded on the blockchain. The first version of Frami will include community voting only, all the other options will be added as the roadmap advances!",

          { type: "heading", title: "Investing & Backing" },

          {
            type: "subheading",
            title: "What currencies can I use to back projects?",
          },
          "Currently, you can back projects using ETH. Select stablecoins (USDC, USDT, etc) will be added in future updates.",

          {
            type: "subheading",
            title: "Can I get a refund if a project fails?",
          },
          "Yes, if a project fails to meet its milestones, unused funds are returned to backers proportionally according to their contribution. This is managed automatically through smart contracts.",

          { type: "subheading", title: "What fees does Frami charge?" },
          "Currently, Frami charges a 5% platform fee on successfully funded projects. There may also be blockchain gas fees for transactions, which vary based on network conditions and are not controlled by Frami. Also, 5% transaction fee on secondary NFT sales.",
        ],
      },
      {
        id: "audits",
        title: "Audits (Coming Soon)",
        content: [
          { type: "heading", title: "Smart contract audit reports" },
          "Our smart contracts will undergo rigorous security audits by independent third-party firms to ensure the highest standards of security and reliability:",

          {
            type: "list",
            items: [
              "CertiK Audit: Comprehensive review of core platform contracts",
              "Trail of Bits Audit: Focused assessment of the milestone verification system",
              "ChainSecurity Review: Complete audit of FounderNFT functionality",
              "OpenZeppelin Security Analysis: Ongoing security monitoring and risk assessment",
            ],
          },

          { type: "heading", title: "Methodology and scope" },
          "Our audit process will include:",

          {
            type: "list",
            items: [
              "Static code analysis to identify potential vulnerabilities",
              "Dynamic testing to validate contract behavior",
              "Formal verification of critical system components",
              "Economic attack vector analysis",
              "Gas optimization assessment",
              "Upgrade mechanism security review",
            ],
          },

          { type: "heading", title: "Findings and resolutions (Example)" },
          "Summary of key findings from our audit reports:",

          {
            type: "table",
            headers: ["Severity", "Issue Type", "Status", "Resolution"],
            rows: [
              [
                "High",
                "Reentrancy vulnerability in fund distribution",
                "Resolved",
                "Implemented checks-effects-interactions pattern and reentrancy guards",
              ],
              [
                "Medium",
                "Timestamp manipulation risk",
                "Resolved",
                "Replaced timestamp dependency with block number-based logic",
              ],
              [
                "Medium",
                "Access control weakness",
                "Resolved",
                "Implemented role-based access control with time locks",
              ],
              [
                "Low",
                "Gas optimization opportunities",
                "Resolved",
                "Refactored code to reduce gas costs by 30%",
              ],
            ],
          },

          {
            type: "note",
            title: "Continuous Security",
            text: "Security is an ongoing process. We maintain a bug bounty program to incentivize responsible disclosure of potential vulnerabilities and perform regular security reviews as the platform evolves.",
          },
        ],
      },
    ],
  },
  {
    id: "tokenomics",
    title: "TOKENOMICS",
    items: [
      {
        id: "foundernft-mechanics",
        title: "FounderNFT Mechanics",
        content: [
          { type: "heading", title: "FounderNFT overview" },
          "FounderNFTs represent special membership and governance rights in the Frami platform. As a limited collection, they provide holders with exclusive benefits and platform participation opportunities.",

          { type: "heading", title: "Token utility" },
          "FounderNFTs provide various utilities within the Frami ecosystem:",

          {
            type: "list",
            items: [
              "Governance voting rights for platform decisions",
              "Fee sharing from platform transaction revenues",
              "Early access to premium projects before public rounds",
              "Priority verification status for milestone validation",
              "Exclusive access to platform features and extensions",
              "Enhanced rewards when staking tokens (coming soon)",
            ],
          },

          { type: "heading", title: "Acquisition methods" },
          "There are several ways to acquire a FounderNFT:",

          {
            type: "list",
            items: [
              "Primary sale during the initial platform launch",
              "Secondary market purchases from existing holders",
              "Special allocations through community contests and contributor rewards",
            ],
          },

          {
            type: "note",
            title: "Value Protection",
            text: "The fixed supply of 1000 FounderNFTs ensures scarcity, while the continuous addition of new platform utilities increases their value proposition over time.",
          },
        ],
      },
      {
        id: "fee-distribution",
        title: "Fee Distribution",
        content: [
          { type: "heading", title: "Platform fee structure" },
          "Frami implements a transparent fee structure to sustain platform operations and reward ecosystem participants:",

          {
            type: "list",
            items: [
              "5% base fee on all successfully funded projects",
              "5-10% transaction fee on secondary NFT sales (if applicable)",
              "0.5% fee on token swaps within the platform (future feature)",
              "Premium feature access fees (optional, varies by feature)",
            ],
          },

          { type: "heading", title: "Treasury allocation" },
          "Collected fees are distributed to various ecosystem components:",

          {
            type: "table",
            headers: ["Allocation", "Percentage", "Purpose"],
            rows: [
              [
                "FounderNFT Holders",
                "50%",
                "Rewards for early platform supporters",
              ],
              [
                "Protocol Treasury",
                "30%",
                "Platform development and maintenance",
              ],
              [
                "Validator Incentives",
                "10%",
                "Rewards for milestone validators",
              ],
              ["Community Fund", "10%", "Community initiatives and grants"],
            ],
          },

          {
            type: "note",
            title: "Distribution Schedule",
            text: "Fee distributions occur automatically every 10 days through smart contracts. Holders can claim their rewards at any time.",
          },
        ],
      },
      {
        id: "staking-system",
        title: "Staking System",
        content: [
          { type: "heading", title: "Staking requirements" },
          "The Frami staking system enables FounderNFT holders to lock their assets for enhanced benefits:",

          {
            type: "list",
            items: [
              "Fist-time staking lock period: 60 days",
              "NFT remains in holder's wallet but with transfer restrictions",
              "Smart contract locking mechanism with on-chain verification",
              "Option to auto-renew staking periods",
            ],
          },

          { type: "heading", title: "Unstaking process" },
          "The process to unstake FounderNFTs follows these steps:",

          {
            type: "numbered-list",
            items: [
              "Select and unstake the NFTs through the platform dashboard interface",
              "NFTs are fully released and transferable",
              "Accumulated unclaimed rewards are automatically distributed to the holder's wallet when unstaked",
            ],
          },

          {
            type: "warning",
            title: "Important Notice",
            text: "All Founder NFTs will be locked for 60 days the first time they are staked (this resets if the NFT is transferred to another wallet), they will not be able to unstake prior to this time. Once the 60 days are complete the NFTs will be able to be staked/unstaked at will without restrictions",
          },
        ],
      },
      {
        id: "governance-token",
        title: "Governance Token (Coming Soon)",
        content: [
          { type: "heading", title: "Future roadmap" },
          "While FounderNFTs currently serve as the primary governance mechanism, Frami plans to introduce a dedicated governance token in the future with the following characteristics:",

          {
            type: "list",
            items: [
              "ERC-20 compatible token with governance and utility functions",
              "Fixed maximum supply with deflationary mechanisms",
              "Gradual distribution to ensure fair allocation across the ecosystem",
              "Integration with existing FounderNFT benefits and rights",
            ],
          },

          { type: "heading", title: "Transition process" },
          "The transition to a dual governance system will be carefully managed:",

          {
            type: "numbered-list",
            items: [
              "Initial token distribution to FounderNFT holders (airdrop based on holding duration)",
              "Liquidity bootstrapping phase with incentivized pools",
              "Governance power sharing between NFT holders and token holders",
              "Gradual shift of certain rights to token governance while preserving FounderNFT value",
            ],
          },

          { type: "heading", title: "Voting mechanics" },
          "The future governance token will enable nuanced voting mechanics:",

          {
            type: "list",
            items: [
              "Token-weighted voting with optional time-locking for increased power",
              "Delegation capabilities for passive holders",
              "Specialized voting for different platform aspects (technical, financial, community)",
              "Quadratic voting for certain community-focused decisions",
              "Combined NFT+Token voting power for critical platform decisions",
            ],
          },

          {
            type: "note",
            title: "Development Timeline",
            text: "The governance token is planned for introduction in Q4 2025, following extensive community discussion and economic modeling to ensure sustainability and alignment of incentives.",
          },
        ],
      },
    ],
  },
];
