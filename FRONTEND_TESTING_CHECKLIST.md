# Frontend Testing Checklist

**Frami** - Blockchain Crowdfunding Platform
Last Updated: 2025-11-28

---

## 🔴 Critical Tests (Core Functionality)

### Wallet & Blockchain Integration
- [ ] Connect wallet (MetaMask, RainbowKit)
- [ ] Disconnect wallet
- [ ] Switch between networks (Anvil, Sepolia, Mainnet, Polygon, BSC)
- [ ] Handle wallet connection errors and rejections
- [ ] Persist wallet state across page refreshes

### Founder NFT System
- [ ] Mint NFTs with quantity selection
- [ ] Calculate price & gas estimates correctly
- [ ] Enforce supply limits (maxSupply check)
- [ ] Display user NFT balance accurately
- [ ] Transaction success/failure handling
- [ ] Show total supply and max supply

### Staking Dashboard
- [ ] Stake NFT transactions
- [ ] Unstake NFT transactions
- [ ] Display staked vs unstaked NFTs correctly
- [ ] Calculate and display rewards accurately
- [ ] Claim rewards functionality
- [ ] Enforce minimum staking period
- [ ] Show real-time reward updates
- [ ] Display staking history
- [ ] Show next unstake date accurately

### Project Management
- [ ] Create project with 5-step wizard
  - [ ] Step 1: Basic Info (title, description, tagline, thumbnail)
  - [ ] Step 2: Team (add/remove team members)
  - [ ] Step 3: NFT Rewards configuration
  - [ ] Step 4: Funding (goal, duration, flexible funding)
  - [ ] Step 5: Review and submit
- [ ] Navigate between form steps
- [ ] View project details page
- [ ] Display funding progress correctly
- [ ] Calculate days remaining accurately
- [ ] Save/bookmark projects
- [ ] Display save status toggle

---

## 🟡 Important Tests (User Experience)

### Forms & Validation
- [ ] Title validation (5-80 characters)
- [ ] Description validation (20-200 characters)
- [ ] Story validation (100+ characters)
- [ ] URL validation for thumbnails
- [ ] Goal amount minimum ($100)
- [ ] Campaign duration (1-90 days)
- [ ] Category selection required
- [ ] Team member address validation (0x format)
- [ ] Add/remove team members
- [ ] Contact form submission
- [ ] Profile edit form submission

### Data Display & API Integration
- [ ] Fetch all projects
- [ ] Fetch featured projects
- [ ] Fetch trending projects
- [ ] View featured projects carousel
- [ ] Filter projects by category
- [ ] Search projects by title/description
- [ ] Sort projects (trending, newest, most funded)
- [ ] Fetch project by slug
- [ ] Fetch categories
- [ ] Fetch user profiles
- [ ] Error handling for failed API requests
- [ ] Pagination handling

### GraphQL/Subgraph Queries
- [ ] Query user dashboard data
- [ ] Query platform stats
- [ ] Fetch staking history
- [ ] Fetch rewards claimed data
- [ ] Real-time data sync with blockchain

### UI/UX Interactions
- [ ] Theme switching (dark/light mode)
- [ ] Modal dialogs open/close correctly
- [ ] Toast notifications display
- [ ] Navigation between pages
- [ ] Internal links working
- [ ] External links (Twitter, docs)
- [ ] Mobile hamburger menu toggle
- [ ] Carousel scroll functionality

### Data Formatting
- [ ] User address formatting (shortenAddress)
- [ ] Currency formatting
- [ ] Progress percentage calculation
- [ ] Earned rewards calculation display
- [ ] Staking duration display
- [ ] Category icons display
- [ ] Creator avatar display
- [ ] Project thumbnail loading/fallback

---

## 🟢 Secondary Tests (Polish & Compatibility)

### Responsive Design
- [ ] Mobile layout (< 768px)
  - [ ] Touch interactions
  - [ ] Form input sizing
  - [ ] Image responsiveness
- [ ] Tablet layout (768px - 1024px)
- [ ] Desktop layout (> 1024px)
- [ ] Grid responsiveness (1 col mobile → 4 cols desktop)

### State Management
- [ ] Wallet context updates properly
- [ ] Query cache invalidation
- [ ] Form state persistence between steps
- [ ] Navigation state transitions
- [ ] Error state display
- [ ] Loading state spinners

### Performance
- [ ] Load time for featured projects
- [ ] Carousel scroll performance
- [ ] GSAP animation frame rates
- [ ] Large project list rendering
- [ ] Query deduplication
- [ ] Memory leak prevention
- [ ] Image lazy loading optimization

### Error Handling
- [ ] Display error messages for failed API calls
- [ ] Handle wallet connection errors
- [ ] Handle transaction failures
- [ ] Display validation errors
- [ ] Network error recovery
- [ ] Timeout handling

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] ARIA labels
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] Form label associations

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Testing Environment Requirements

### Environment Variables
```env
VITE_RPC_URL=http://localhost:8545
VITE_WALLET_CONNECT_PROJECT_ID=<project_id>
VITE_SUBGRAPH_ENDPOINT=http://localhost:8000/subgraphs/id/...
```

### Smart Contracts
- **FounderNFT Proxy:** `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **Implementation:** `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Network:** Anvil Localhost (Chain ID: 31337)

### Test Wallets Needed
- [ ] Wallet with ETH for gas fees
- [ ] Wallet with minted FounderNFTs
- [ ] Wallet with staked NFTs
- [ ] Empty wallet for new user flow

---

## Summary

**Total Test Cases:** ~60 tests
**Priority Order:** 🔴 Critical → 🟡 Important → 🟢 Secondary

### Testing Tools Suggested
- **Unit/Integration:** Vitest + React Testing Library
- **E2E:** Playwright or Cypress
- **Wallet Testing:** Mock providers or Tenderly
- **Accessibility:** axe DevTools
- **Performance:** Lighthouse, Web Vitals

---

## Notes
- Start with 🔴 Critical tests as they cover core blockchain functionality
- Blockchain tests may require local Anvil/Hardhat node running
- GraphQL tests require subgraph deployment
- Some features (profile edit, contact form) currently have mock submissions
