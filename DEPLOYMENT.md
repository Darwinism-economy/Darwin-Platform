# 🚀 Darwin Platform Deployment Guide

This guide provides step-by-step instructions for deploying the Darwin Platform smart contracts to Solana networks.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **Solana CLI** (latest)
- **Anchor CLI** (latest)

### Installation Commands
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

### Solana Configuration
```bash
# Set Solana to testnet (for testing)
solana config set --url https://api.testnet.solana.com

# Set Solana to mainnet-beta (for production)
solana config set --url https://api.mainnet-beta.solana.com

# Create a new wallet (if needed)
solana-keygen new

# Check your wallet balance
solana balance
```

## 🏗️ Project Structure

```
Darwin-Platform/
├── programs/
│   ├── darwin-token/          # Token & tax contract
│   ├── darwin-treasury/       # Fundraising & auction contract
│   └── darwin-distributor/    # Distribution contract
├── tests/
│   └── darwin-tests.ts        # Integration tests
├── scripts/
│   └── deploy.ts              # Deployment script
├── Anchor.toml                # Anchor workspace config
├── Cargo.toml                 # Rust workspace config
└── package.json               # Node.js dependencies
```

## 🔧 Local Development

### 1. Start Local Validator
```bash
# Start a local Solana validator
solana-test-validator

# In another terminal, set config to localhost
solana config set --url http://localhost:8899
```

### 2. Build Contracts
```bash
# Build all programs
npm run anchor:build

# Or use Anchor directly
anchor build
```

### 3. Run Tests
```bash
# Run all tests
npm run anchor:test

# Or use Anchor directly
anchor test
```

### 4. Deploy to Local Network
```bash
# Deploy all contracts
npm run anchor:deploy:local

# Or use the deployment script
npm run deploy:local
```

## 🧪 Testnet Deployment

### 1. Get Testnet SOL
```bash
# Request SOL airdrop
solana airdrop 2

# Verify balance
solana balance
```

### 2. Deploy to Testnet
```bash
# Build contracts
npm run anchor:build

# Deploy to testnet
npm run deploy:testnet

# Or use Anchor directly
npm run anchor:deploy:testnet
```

### 3. Verify Deployment
```bash
# Check program accounts
solana program show --programs

# Verify specific program
solana program show <PROGRAM_ID>
```

## 🚀 Mainnet Deployment

### ⚠️ Security Checklist (Pre-Mainnet)

Before deploying to mainnet, ensure:

- [ ] **Security Audit Completed** - Third-party audit of all contracts
- [ ] **Test Coverage** - All tests passing (100% coverage)
- [ ] **Code Review** - Peer review of all smart contract code
- [ ] **Documentation** - Complete documentation and guides
- [ ] **Emergency Procedures** - Pause/emergency stop mechanisms
- [ ] **Monitoring** - Real-time monitoring and alerting
- [ ] **Insurance** - Smart contract insurance coverage
- [ ] **Legal Review** - Compliance with regulations

### 1. Mainnet Preparation
```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Verify wallet has sufficient SOL
solana balance

# Ensure you have enough SOL for deployment (recommend 5+ SOL)
```

### 2. Deploy to Mainnet
```bash
# Build optimized contracts
npm run anchor:build

# Deploy to mainnet
npm run deploy:mainnet

# Or use Anchor directly
npm run anchor:deploy:mainnet
```

### 3. Post-Deployment Verification
```bash
# Verify all programs deployed
solana program show --programs

# Test basic functionality
npm run anchor:test

# Monitor for any issues
```

## 📊 Contract Addresses

After deployment, you'll receive a `deployment-info.json` file with:

```json
{
  "network": "https://api.mainnet-beta.solana.com",
  "tokenMint": "Token111111111111111111111111111111111111111",
  "tokenState": "TokenState111111111111111111111111111111111111",
  "treasuryState": "TreasuryState111111111111111111111111111111111",
  "distributorState": "DistributorState111111111111111111111111111111",
  "authority": "Authority111111111111111111111111111111111111111",
  "creator": "Creator111111111111111111111111111111111111111",
  "treasuryWallet": "TreasuryWallet111111111111111111111111111111111",
  "distributorWallet": "DistributorWallet111111111111111111111111111111",
  "deploymentTime": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Frontend Integration

### 1. Update Configuration
Update your frontend configuration with the new contract addresses:

```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  TOKEN_PROGRAM_ID: "Token111111111111111111111111111111111111111",
  TREASURY_PROGRAM_ID: "Treasury111111111111111111111111111111111111",
  DISTRIBUTOR_PROGRAM_ID: "Distributor111111111111111111111111111111111",
  // ... other addresses from deployment-info.json
};
```

### 2. Update RPC Endpoints
```typescript
// src/config/network.ts
export const NETWORK_CONFIG = {
  mainnet: {
    rpc: "https://api.mainnet-beta.solana.com",
    ws: "wss://api.mainnet-beta.solana.com",
  },
  testnet: {
    rpc: "https://api.testnet.solana.com",
    ws: "wss://api.testnet.solana.com",
  },
};
```

## 🛡️ Security Best Practices

### 1. Multi-Signature Wallets
```bash
# Create multi-sig wallet for treasury
spl-token create-multisig <REQUIRED_SIGNERS> <TOTAL_SIGNERS> <SIGNER1> <SIGNER2> ...
```

### 2. Program Upgrades
```bash
# Upgrade program (if needed)
anchor upgrade target/deploy/<PROGRAM_NAME>.so --program-id <PROGRAM_ID>
```

### 3. Emergency Procedures
```bash
# Pause distributor (emergency)
anchor run pause-distribution

# Resume distributor
anchor run resume-distribution
```

## 📈 Monitoring & Maintenance

### 1. Health Checks
```bash
# Check program status
solana program show <PROGRAM_ID>

# Monitor transaction logs
solana logs <PROGRAM_ID>
```

### 2. Performance Monitoring
- Monitor transaction success rates
- Track gas usage and costs
- Monitor treasury balances
- Watch for unusual activity

### 3. Regular Updates
- Keep dependencies updated
- Monitor for security patches
- Regular code audits
- Performance optimizations

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
anchor clean
anchor build
```

#### Deployment Failures
```bash
# Check SOL balance
solana balance

# Check network connection
solana cluster-version

# Retry deployment
npm run deploy:testnet
```

#### Test Failures
```bash
# Run specific test
anchor test --skip-local-validator

# Debug with logs
anchor test --skip-local-validator -- --nocapture
```

### Support Resources
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Discord](https://discord.gg/solana)
- [Anchor Discord](https://discord.gg/8HkmBkA)

## 📞 Emergency Contacts

For critical issues:
- **Security Team**: security@darwinplatform.com
- **Technical Support**: support@darwinplatform.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

---

**⚠️ Important**: This is a production deployment guide. Always test thoroughly on testnet before mainnet deployment. Ensure all security measures are in place and have proper backup procedures.

**🔒 Security**: Never share private keys or sensitive information. Use secure key management practices and consider hardware wallets for production deployments. 