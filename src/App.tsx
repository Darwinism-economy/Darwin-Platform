import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Rocket } from 'lucide-react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import TokenCreation from './pages/TokenCreation'
import Fundraising from './pages/Fundraising'
import WinningView from './pages/WinningView'
import Auction from './pages/Auction'

function App() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="card max-w-md">
              <Rocket className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Darwin Launchpad
              </h1>
              <p className="text-gray-600 mb-6">
                Non-custodial, trustless, globally scalable token launchpad on Solana
              </p>
              <WalletMultiButton className="btn-primary" />
              <p className="text-sm text-gray-500 mt-4">
                Connect your wallet to get started
              </p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<TokenCreation />} />
            <Route path="/fundraising" element={<Fundraising />} />
            <Route path="/winning-view" element={<WinningView />} />
            <Route path="/auction" element={<Auction />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App 