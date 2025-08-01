# Darwin Platform - Complete Deployment Guide

## 🚀 Overview

Darwin Platform is a **non-custodial, trustless, globally scalable token launchpad** built on Solana. This guide provides complete instructions for deploying and testing the platform on testnet.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Solana CLI** (latest)
- **Anchor Framework** (latest)
- **Git**

### Installation Commands
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Node.js dependencies
npm install
```

### Solana Configuration
```bash
# Set to testnet
solana config set --url https://api.testnet.solana.com

# Create a new wallet (if needed)
solana-keygen new

# Check balance
solana balance

# Get test SOL
solana airdrop 2
```

## 🏗️ Project Structure

```
Darwin-Platform/
├── programs/
│   ├── darwin-token/          # Token & taxation contract
│   ├── darwin-treasury/       # Treasury & auction contract
│   └── darwin-distributor/    # Distribution contract
├── tests/
│   └── darwin-tests.ts        # Comprehensive test suite
├── scripts/
│   └── deploy-complete.ts     # Full deployment script
├── darwin-platform.html       # Complete frontend
├── Anchor.toml               # Anchor configuration
└── package.json              # Dependencies
```

## 🔧 Smart Contracts

### 1. Darwin Token Contract (`darwin-token`)
- **Purpose**: SPL token with transfer taxes
- **Features**:
  - Immutable total supply (non-mintable)
  - Configurable transfer taxes (Treasury 3%, Distributor 4%, Creator 2%)
  - Automatic tax collection on transfers
  - Integration with treasury and distributor contracts

### 2. Darwin Treasury Contract (`darwin-treasury`)
- **Purpose**: Fundraising and Last Man Standing auctions
- **Features**:
  - 24-hour fundraising period (200,000 blocks)
  - Bonding curve token distribution
  - Automatic LP creation (10% SOL + 10% tokens)
  - Creator payment (3% of raised SOL)
  - Last Man Standing auction with block-based timers
  - Automatic treasury distribution to qualified holders

### 3. Darwin Distributor Contract (`darwin-distributor`)
- **Purpose**: Daily token distribution to holders
- **Features**:
  - 24-hour distribution cycles (216,000 blocks)
  - Automatic liquidation of collected taxes
  - Proportional distribution to qualified holders
  - Minimum holding requirements
  - Immutable and trustless operation

## 🚀 Deployment Instructions

### Step 1: Build Contracts
```bash
# Build all programs
anchor build

# Verify build success
anchor verify
```

### Step 2: Run Tests
```bash
# Run comprehensive test suite
anchor test

# Run specific test file
anchor test tests/darwin-tests.ts
```

### Step 3: Deploy to Testnet
```bash
# Deploy all contracts
anchor deploy

# Run complete deployment script
npx ts-node scripts/deploy-complete.ts
```

### Step 4: Verify Deployment
```bash
# Check program IDs
solana program show <PROGRAM_ID>

# Verify account states
anchor account <ACCOUNT_ADDRESS>
```

## 🧪 Testing Guide

### Local Testing
```bash
# Start local validator
solana-test-validator

# Run tests
anchor test --provider.cluster localnet
```

### Testnet Testing
```bash
# Set to testnet
solana config set --url https://api.testnet.solana.com

# Run tests
anchor test --provider.cluster testnet
```

### Frontend Testing
1. Open `darwin-platform.html` in a browser
2. Connect Phantom wallet (testnet enabled)
3. Test all platform features:
   - Token creation
   - Fundraising contributions
   - Auction bidding
   - Distribution simulation

## 📊 Platform Features

### Token Creation
- **Supply Range**: 1 - 1,000,000,000 tokens
- **Team Allocation**: 1-20% of total supply
- **Tax Configuration**: Total must equal 10%
  - Treasury: 3%
  - Distributor: 4%
  - Creator: 2%

### Fundraising Phase
- **Duration**: 200,000 blocks (~24 hours)
- **Currency**: SOL only
- **Bonding Curve**: 0.315% increase per SOL
- **Pro-rata Distribution**: Remaining tokens after fundraising

### Auction Phase
- **Type**: Last Man Standing
- **Timer**: Block-based (configurable)
- **Minimum Bid**: Configurable (default: 1 SOL)
- **Winner**: Last bidder when timer expires
- **Fallback**: Distribution to qualified holders

### Distribution System
- **Frequency**: Every 216,000 blocks (~24 hours)
- **Qualification**: Minimum token holdings
- **Method**: Proportional distribution
- **Automation**: No manual claiming required

## 🔒 Security Features

### Immutable Contracts
- All contracts are immutable after deployment
- No upgrade mechanisms
- Trustless operation

### Block-based Timers
- Uses Solana blockchain blocks for timing
- Prevents frontend manipulation
- Secure auction mechanics

### PDA Security
- Program Derived Addresses for all state
- Deterministic address generation
- Secure account management

### Tax Validation
- Enforced 10% total tax requirement
- Immutable tax configuration
- Automatic collection and distribution

## 🌐 Frontend Integration

### Features
- **Wallet Connection**: Phantom wallet integration
- **Real-time Updates**: Live auction and fundraising data
- **Token Management**: Create and manage tokens
- **Auction Interface**: Bid placement and tracking
- **Distribution Monitoring**: Track daily distributions
- **Testing Tools**: Time acceleration and simulation

### Configuration
```javascript
// Frontend configuration
const config = {
    network: "testnet",
    tokenMint: "<TOKEN_MINT_ADDRESS>",
    treasuryPda: "<TREASURY_PDA>",
    distributorPda: "<DISTRIBUTOR_PDA>",
    programs: {
        darwinToken: "<TOKEN_PROGRAM_ID>",
        darwinTreasury: "<TREASURY_PROGRAM_ID>",
        darwinDistributor: "<DISTRIBUTOR_PROGRAM_ID>"
    }
};
```

## 📈 Monitoring & Analytics

### Key Metrics
- **Total Tokens Launched**: Platform-wide token count
- **Total SOL Raised**: Cumulative fundraising amount
- **Active Auctions**: Current auction count
- **Distribution Volume**: Daily distribution amounts
- **User Participation**: Unique wallet addresses

### Event Tracking
- Token creation events
- Fundraising contributions
- Auction bids and wins
- Distribution executions
- Error and security events

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean and rebuild
anchor clean
anchor build

# Update dependencies
cargo update
npm update
```

#### Deployment Failures
```bash
# Check SOL balance
solana balance

# Get more test SOL
solana airdrop 2

# Verify network configuration
solana config get
```

#### Test Failures
```bash
# Run with verbose output
anchor test --verbose

# Check specific test
anchor test --grep "test name"
```

### Support Resources
- **Solana Docs**: https://docs.solana.com/
- **Anchor Docs**: https://www.anchor-lang.com/
- **SPL Token Docs**: https://spl.solana.com/token

## 🚀 Production Deployment

### Pre-Mainnet Checklist
- [ ] Complete security audit
- [ ] Test all edge cases
- [ ] Verify economic model
- [ ] Set up monitoring
- [ ] Prepare documentation
- [ ] Plan governance structure

### Mainnet Deployment
```bash
# Set to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Deploy with production parameters
npx ts-node scripts/deploy-complete.ts --mainnet
```

## 📞 Support

For technical support or questions:
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README and inline code comments
- **Community**: Join Solana developer communities

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**⚠️ Important**: This is a testnet deployment. For production use, conduct thorough security audits and testing. 