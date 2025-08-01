# 🚀 Darwin Platform - Complete Solana Launchpad

A **non-custodial, trustless, globally scalable token launchpad** built on Solana with native $WIN token infrastructure.

## 🌟 Platform Overview

Darwin Platform enables creators to launch custom tokens with:
- **Automated token creation** with immutable supply and configurable taxes
- **24-hour SOL fundraising** with bonding curve pricing
- **Last Man Standing auctions** with block-based timers
- **Automatic daily distributions** to token holders
- **Burned liquidity pools** on Jupiter

## 🏗️ Architecture

### Smart Contracts (Anchor-based)
1. **Darwin Token** - SPL token with transfer taxes
2. **Darwin Treasury** - Fundraising and auction management
3. **Darwin Distributor** - Daily liquidations and distributions

### Frontend (React + TypeScript)
- **Token Creation** - Configure token parameters
- **Fundraising Dashboard** - Real-time progress tracking
- **Auction Interface** - Live bidding and timer display
- **WinningView** - Active projects and results

## 🚀 Quick Start

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Node.js dependencies
npm install
```

### Local Development
```bash
# Start local validator
solana-test-validator

# Build smart contracts
npm run anchor:build

# Run tests
npm run anchor:test

# Deploy to local network
npm run deploy:local

# Start frontend
npm run dev
```

### Testnet Deployment
```bash
# Switch to testnet
solana config set --url https://api.testnet.solana.com

# Get testnet SOL
solana airdrop 2

# Deploy contracts
npm run deploy:testnet

# Start frontend
npm run dev
```

## 📁 Project Structure

```
Darwin-Platform/
├── programs/                    # Smart Contracts
│   ├── darwin-token/           # Token & tax logic
│   ├── darwin-treasury/        # Fundraising & auctions
│   └── darwin-distributor/     # Daily distributions
├── src/                        # Frontend Application
│   ├── components/             # React components
│   ├── pages/                  # Main application pages
│   └── utils/                  # Utility functions
├── tests/                      # Integration tests
├── scripts/                    # Deployment scripts
├── Anchor.toml                 # Anchor workspace config
├── Cargo.toml                  # Rust workspace config
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

## 🔧 Smart Contracts

### Darwin Token Contract
- **Immutable Supply**: Fixed total supply, non-mintable after creation
- **Transfer Taxes**: Configurable treasury, distributor, and creator taxes
- **Automatic Collection**: Taxes collected on every transfer

```rust
// Initialize token with tax configuration
pub fn initialize_token(
    name: String,
    symbol: String,
    total_supply: u64,
    treasury_tax: u8,
    distributor_tax: u8,
    creator_tax: u8,
) -> Result<()>
```

### Darwin Treasury Contract
- **Fundraising**: 24-hour SOL-only fundraising with bonding curve
- **Last Man Standing**: Block-based auction timer with minimum bids
- **Automatic LP**: 10% SOL + 10% tokens to burned Jupiter LP
- **Creator Distribution**: 3% SOL to creator wallet

```rust
// Contribute SOL during fundraising
pub fn contribute_sol(amount: u64) -> Result<()>

// Place bid in auction
pub fn place_bid(bid_amount: u64) -> Result<()>

// End auction and distribute treasury
pub fn end_auction() -> Result<()>
```

### Darwin Distributor Contract
- **Daily Liquidations**: Every 216,000 blocks (~24 hours)
- **Proportional Distribution**: To holders with minimum tokens
- **Emergency Controls**: Pause/resume functionality

```rust
// Execute daily distribution
pub fn execute_distribution() -> Result<()>

// Emergency pause
pub fn pause_distribution() -> Result<()>
```

## 🎨 Frontend Features

### Token Creation
- Configure token name, symbol, and supply
- Set team allocation percentages
- Configure tax rates (treasury, distributor, creator)
- Set auction parameters (minimum bid, timer duration)

### Fundraising Dashboard
- Real-time progress tracking
- Bonding curve price display
- Contributor statistics
- Time remaining countdown

### Live Auctions
- **Minimum Bid**: Displayed in native token/SOL
- **Time Alive**: How long auction has been running
- **Treasury**: Accumulated SOL amount
- **Timer**: Countdown to auction end

### WinningView
- Active fundraising campaigns
- Live auction status
- Historical results
- Distribution schedules

## 🔒 Security Features

### Smart Contract Security
- **Immutable Contracts**: No upgrade mechanism after deployment
- **Block-based Timers**: Resistant to frontend manipulation
- **Non-custodial**: Users maintain control of funds
- **Trustless**: No central authority required

### Frontend Security
- **Wallet Integration**: Secure Phantom/Solflare connection
- **Transaction Validation**: Real-time blockchain verification
- **Input Validation**: Comprehensive form validation
- **Error Handling**: Graceful error recovery

## 📊 Tokenomics

### Native Token ($WIN)
- **Total Supply**: 1,000,000 (fixed, non-mintable)
- **Platform Fee**: 1% on all transactions
- **Distribution**: Pro-rata to qualified holders

### Project Token Economics
- **Fundraising**: SOL-only with bonding curve pricing
- **LP Creation**: 10% SOL + 10% tokens (burned)
- **Creator Fee**: 3% of raised SOL
- **Auction**: Last Man Standing with minimum bids

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
npm run anchor:test

# Run specific test file
anchor test tests/darwin-tests.ts

# Test with logs
anchor test --skip-local-validator -- --nocapture
```

### Frontend Tests
```bash
# Run frontend tests
npm test

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Local Development
```bash
# Start local validator
solana-test-validator

# Deploy contracts
npm run deploy:local

# Start frontend
npm run dev
```

### Testnet Deployment
```bash
# Deploy to testnet
npm run deploy:testnet

# Verify deployment
solana program show --programs
```

### Mainnet Deployment
```bash
# ⚠️ Complete security audit first
npm run deploy:mainnet

# Verify on Solana Explorer
# https://explorer.solana.com/
```

## 📈 Monitoring

### Smart Contract Monitoring
- Transaction success rates
- Gas usage optimization
- Treasury balance tracking
- Distribution execution logs

### Frontend Monitoring
- User interaction analytics
- Error tracking and reporting
- Performance metrics
- Wallet connection success rates

## 🛠️ Development

### Adding New Features
1. **Smart Contract**: Add to appropriate program
2. **Tests**: Create comprehensive test coverage
3. **Frontend**: Update UI components
4. **Documentation**: Update guides and README

### Code Standards
- **Rust**: Follow Rust formatting guidelines
- **TypeScript**: Use strict type checking
- **React**: Follow React best practices
- **Testing**: Maintain 90%+ test coverage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/darwin-platform.git
cd darwin-platform

# Install dependencies
npm install

# Setup development environment
npm run setup:dev

# Start development
npm run dev
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [Smart Contract API](docs/contracts.md) - Contract function documentation
- [Frontend Guide](docs/frontend.md) - UI component documentation
- [Security Guide](docs/security.md) - Security best practices

## 🆘 Support

### Resources
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [React Documentation](https://reactjs.org/docs/)

### Community
- [Discord](https://discord.gg/darwinplatform)
- [Telegram](https://t.me/darwinplatform)
- [Twitter](https://twitter.com/darwinplatform)

### Technical Support
- **Email**: support@darwinplatform.com
- **GitHub Issues**: [Create Issue](https://github.com/your-org/darwin-platform/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **Anchor Team** - Smart contract framework
- **Jupiter Team** - DEX integration
- **Open Source Community** - Tools and libraries

---

**🚀 Ready to launch?** Start with the [Deployment Guide](DEPLOYMENT.md) to get your Darwin Platform instance running!

**🔒 Security First**: Always conduct thorough testing and security audits before mainnet deployment. 