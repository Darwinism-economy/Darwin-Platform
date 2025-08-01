# 🚀 Darwin Launchpad - Solana Testnet Demo

A non-custodial, trustless, globally scalable token launchpad built on Solana testnet.

## 🌟 Features

### Token Creation
- Create custom tokens with configurable parameters
- Team allocation management with multiple wallet support
- Automatic tax collection and distribution system
- Configurable auction and distribution timers

### Fundraising
- 24-hour SOL-only fundraising periods
- Bonding curve pricing (0.33% increase per 1 SOL)
- Real-time progress tracking and contributor statistics
- Automatic LP deployment after fundraising ends

### Last Man Standing Auction
- Buy minimum tokens to place bids
- Timer resets with each bid
- Last bidder wins the entire treasury
- Real-time auction status and participant tracking

### WinningView Dashboard
- Overview of all active fundraises
- Real-time status updates and timers
- Distribution tracking for live projects
- Historical auction results

### Automatic Tax Distribution
- Per-project distribution system
- Configurable distribution intervals
- Real-time distribution tracking
- Automatic tax collection from trading

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Solana (Testnet)
- **Wallet Integration**: Solana Wallet Adapter
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Solana CLI (optional, for development)
- A Solana wallet (Phantom, Solflare, or Backpack)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd darwin-launchpad-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Getting Testnet SOL

1. Connect your wallet to the application
2. Click "Request 2 SOL" on any page
3. Wait for the airdrop to complete (usually takes a few seconds)

## 📱 Usage Guide

### 1. Connect Your Wallet
- Click the "Connect Wallet" button
- Choose your preferred Solana wallet
- Ensure you're connected to Solana Testnet

### 2. Create a Token
- Navigate to "Create Token"
- Fill in token details (name, symbol, supply)
- Configure team allocations and auction parameters
- Click "Create Token"

### 3. Start Fundraising
- Go to "Fundraising" page
- Click "Start Fundraising" to begin the 24-hour period
- Contributors can send SOL and receive tokens based on bonding curve pricing

### 4. Participate in Auctions
- After fundraising ends, auctions become available
- Buy minimum tokens from LP to place bids
- Each bid resets the timer
- Last bidder wins the treasury

### 5. Monitor Projects
- Use "WinningView" to see all active projects
- Track fundraising progress and auction status
- Monitor distribution schedules for live projects

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SOLANA_RPC_URL=https://api.testnet.solana.com
VITE_SOLANA_NETWORK=testnet
```

### Customization
- Modify token parameters in `src/pages/TokenCreation.tsx`
- Adjust auction settings in `src/pages/Auction.tsx`
- Update bonding curve parameters in `src/pages/Fundraising.tsx`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Header.tsx      # Navigation header
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── TokenCreation.tsx
│   ├── Fundraising.tsx
│   ├── WinningView.tsx
│   └── Auction.tsx
├── utils/              # Utility functions
│   └── solana.ts       # Solana blockchain interactions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🔒 Security Features

- Non-custodial design (users maintain control of their funds)
- Trustless smart contract interactions
- Real-time transaction validation
- Secure wallet integration

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify

### Manual Deployment
1. Run `npm run build`
2. Upload the contents of the `dist` folder to your web server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Mainnet deployment
- [ ] Advanced tokenomics features
- [ ] Multi-chain support
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Social features and community tools

## 🙏 Acknowledgments

- Solana Foundation for the blockchain infrastructure
- Solana Labs for the wallet adapter
- The open-source community for the amazing tools and libraries

---

**Note**: This is a demo application running on Solana testnet. For production use, additional security audits and mainnet deployment considerations are required. 