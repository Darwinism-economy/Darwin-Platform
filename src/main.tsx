import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import App from './App.tsx'
import './index.css'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

// Set up Solana connection for testnet
const network = WalletAdapterNetwork.Testnet
const endpoint = clusterApiUrl(network)

// Initialize wallet adapters
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
]

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>,
) 