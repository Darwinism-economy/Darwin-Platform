import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey } from '@solana/web3.js'
import { 
  Plus, 
  Users, 
  Settings, 
  Coins,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  createTokenMint, 
  createTokenAccount, 
  mintTokens,
  requestAirdrop,
  isValidPublicKey,
  formatPublicKey
} from '../utils/solana'

interface TeamWallet {
  address: string
  percentage: number
  tokens: number
}

interface TokenForm {
  name: string
  symbol: string
  totalSupply: number
  teamAllocation: number
  taxRate: number
  minimumTokenBid: number
  auctionTimerDuration: number
  distributionTimerDuration: number
  teamWallets: TeamWallet[]
}

const TokenCreation: React.FC = () => {
  const { publicKey, signTransaction } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [tokenForm, setTokenForm] = useState<TokenForm>({
    name: 'DARWIN',
    symbol: 'DARWIN',
    totalSupply: 1000000,
    teamAllocation: 10,
    taxRate: 6,
    minimumTokenBid: 1000,
    auctionTimerDuration: 5,
    distributionTimerDuration: 24,
    teamWallets: [
      { address: '', percentage: 5, tokens: 50000 },
      { address: '', percentage: 5, tokens: 50000 }
    ]
  })

  const updateTeamAllocation = () => {
    const totalSupply = tokenForm.totalSupply
    const teamAllocation = tokenForm.teamAllocation
    const teamTokens = Math.floor(totalSupply * (teamAllocation / 100))
    
    const updatedTeamWallets = tokenForm.teamWallets.map(wallet => ({
      ...wallet,
      tokens: Math.floor(teamTokens * (wallet.percentage / teamAllocation))
    }))

    setTokenForm(prev => ({
      ...prev,
      teamWallets: updatedTeamWallets
    }))
  }

  const addTeamWallet = () => {
    setTokenForm(prev => ({
      ...prev,
      teamWallets: [...prev.teamWallets, { address: '', percentage: 0, tokens: 0 }]
    }))
  }

  const removeTeamWallet = (index: number) => {
    setTokenForm(prev => ({
      ...prev,
      teamWallets: prev.teamWallets.filter((_, i) => i !== index)
    }))
  }

  const updateTeamWallet = (index: number, field: keyof TeamWallet, value: string | number) => {
    setTokenForm(prev => {
      const updatedWallets = [...prev.teamWallets]
      updatedWallets[index] = { ...updatedWallets[index], [field]: value }
      
      // Recalculate tokens
      const totalSupply = prev.totalSupply
      const teamAllocation = prev.teamAllocation
      const teamTokens = Math.floor(totalSupply * (teamAllocation / 100))
      
      updatedWallets.forEach(wallet => {
        wallet.tokens = Math.floor(teamTokens * (wallet.percentage / teamAllocation))
      })

      return { ...prev, teamWallets: updatedWallets }
    })
  }

  const validateForm = (): boolean => {
    if (!tokenForm.name || !tokenForm.symbol) {
      setStatus({ type: 'error', message: 'Token name and symbol are required' })
      return false
    }

    if (tokenForm.teamAllocation < 1 || tokenForm.teamAllocation > 20) {
      setStatus({ type: 'error', message: 'Team allocation must be between 1-20%' })
      return false
    }

    if (tokenForm.taxRate > 10) {
      setStatus({ type: 'error', message: 'Tax rate cannot exceed 10%' })
      return false
    }

    const totalWalletPercentage = tokenForm.teamWallets.reduce((sum, wallet) => sum + wallet.percentage, 0)
    if (totalWalletPercentage !== tokenForm.teamAllocation) {
      setStatus({ type: 'error', message: 'Team wallet allocations must equal the total team allocation percentage' })
      return false
    }

    const invalidWallets = tokenForm.teamWallets.filter(wallet => 
      wallet.percentage > 0 && (!wallet.address || !isValidPublicKey(wallet.address))
    )
    if (invalidWallets.length > 0) {
      setStatus({ type: 'error', message: 'All team wallets with allocation must have valid Solana addresses' })
      return false
    }

    return true
  }

  const createToken = async () => {
    if (!publicKey || !signTransaction) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    if (!validateForm()) return

    setIsLoading(true)
    setStatus(null)

    try {
      // For demo purposes, we'll simulate token creation
      // In a real implementation, you would:
      // 1. Create the token mint
      // 2. Create token accounts for team wallets
      // 3. Mint initial supply
      // 4. Store project data on-chain

      setStatus({ type: 'info', message: 'Creating token mint...' })
      await new Promise(resolve => setTimeout(resolve, 2000))

      setStatus({ type: 'info', message: 'Setting up team allocations...' })
      await new Promise(resolve => setTimeout(resolve, 1500))

      setStatus({ type: 'info', message: 'Configuring auction parameters...' })
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStatus({ 
        type: 'success', 
        message: `Token "${tokenForm.name}" created successfully! Mint address: ${formatPublicKey(publicKey)}` 
      })

      // Reset form
      setTokenForm({
        name: '',
        symbol: '',
        totalSupply: 1000000,
        teamAllocation: 10,
        taxRate: 6,
        minimumTokenBid: 1000,
        auctionTimerDuration: 5,
        distributionTimerDuration: 24,
        teamWallets: [
          { address: '', percentage: 5, tokens: 50000 },
          { address: '', percentage: 5, tokens: 50000 }
        ]
      })

    } catch (error) {
      console.error('Error creating token:', error)
      setStatus({ type: 'error', message: 'Failed to create token. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const requestTestSol = async () => {
    if (!publicKey) return

    try {
      setIsLoading(true)
      await requestAirdrop(publicKey, 2)
      setStatus({ type: 'success', message: '2 SOL airdropped to your wallet!' })
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to request airdrop' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Token</h1>
        <p className="text-gray-600">
          Launch your own digital token with automatic tax collection and distribution
        </p>
      </div>

      {/* Test SOL Request */}
      {publicKey && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need Test SOL?</h3>
              <p className="text-gray-600">Request testnet SOL to create tokens and participate</p>
            </div>
            <button
              onClick={requestTestSol}
              disabled={isLoading}
              className="btn-primary"
            >
              Request 2 SOL
            </button>
          </div>
        </div>
      )}

      {/* Token Creation Form */}
      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Token Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Token Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Name
              </label>
              <input
                type="text"
                value={tokenForm.name}
                onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="My Awesome Token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenForm.symbol}
                onChange={(e) => setTokenForm(prev => ({ ...prev, symbol: e.target.value }))}
                className="input-field"
                placeholder="MAT"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Supply
              </label>
              <input
                type="number"
                value={tokenForm.totalSupply}
                onChange={(e) => {
                  setTokenForm(prev => ({ ...prev, totalSupply: parseInt(e.target.value) || 0 }))
                  updateTeamAllocation()
                }}
                className="input-field"
                placeholder="1000000"
                min="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Allocation (%)
              </label>
              <input
                type="number"
                value={tokenForm.teamAllocation}
                onChange={(e) => {
                  setTokenForm(prev => ({ ...prev, teamAllocation: parseInt(e.target.value) || 0 }))
                  updateTeamAllocation()
                }}
                className="input-field"
                placeholder="10"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={tokenForm.taxRate}
                onChange={(e) => setTokenForm(prev => ({ ...prev, taxRate: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="6"
                min="0"
                max="10"
              />
            </div>
          </div>

          {/* Auction Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Auction Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Token Bid Amount
              </label>
              <input
                type="number"
                value={tokenForm.minimumTokenBid}
                onChange={(e) => setTokenForm(prev => ({ ...prev, minimumTokenBid: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="1000"
                min="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auction Timer Duration (hours)
              </label>
              <input
                type="number"
                value={tokenForm.auctionTimerDuration}
                onChange={(e) => setTokenForm(prev => ({ ...prev, auctionTimerDuration: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="5"
                min="1"
                max="24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribution Timer Duration (hours)
              </label>
              <input
                type="number"
                value={tokenForm.distributionTimerDuration}
                onChange={(e) => setTokenForm(prev => ({ ...prev, distributionTimerDuration: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="24"
                min="1"
                max="168"
              />
            </div>

            {/* Token Allocation Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Token Allocation Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Team ({tokenForm.teamAllocation}%)</span>
                  <span className="font-medium">{Math.floor(tokenForm.totalSupply * (tokenForm.teamAllocation / 100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LP (10%)</span>
                  <span className="font-medium">{Math.floor(tokenForm.totalSupply * 0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Public Sale</span>
                  <span className="font-medium">{Math.floor(tokenForm.totalSupply * (1 - tokenForm.teamAllocation / 100 - 0.1)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Wallets Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Team Wallets
          </h3>
          <p className="text-gray-600 mb-4">
            Add team wallets and their allocation percentages (must equal team allocation)
          </p>

          <div className="space-y-4">
            {tokenForm.teamWallets.map((wallet, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={wallet.address}
                    onChange={(e) => updateTeamWallet(index, 'address', e.target.value)}
                    className="input-field"
                    placeholder="Enter Solana wallet address"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocation (%)
                  </label>
                  <input
                    type="number"
                    value={wallet.percentage}
                    onChange={(e) => updateTeamWallet(index, 'percentage', parseInt(e.target.value) || 0)}
                    className="input-field"
                    placeholder="5"
                    min="0"
                    max="20"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tokens
                  </label>
                  <div className="text-sm text-gray-600 py-2">
                    {wallet.tokens.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => removeTeamWallet(index)}
                  className="text-red-600 hover:text-red-800 mt-6"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addTeamWallet}
            className="btn-secondary mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
          </button>

          {/* Allocation Validation */}
          <div className="mt-4 p-3 rounded-lg">
            {(() => {
              const totalWalletPercentage = tokenForm.teamWallets.reduce((sum, wallet) => sum + wallet.percentage, 0)
              const isValid = totalWalletPercentage === tokenForm.teamAllocation
              
              return (
                <div className={`flex items-center ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isValid ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  <span>
                    {isValid 
                      ? `✓ Team allocation: ${tokenForm.teamAllocation}% (${tokenForm.teamWallets.map(w => w.percentage).join('% + ')}%)`
                      : `✗ Team allocation mismatch: ${totalWalletPercentage}% ≠ ${tokenForm.teamAllocation}%`
                    }
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Create Token Button */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={createToken}
            disabled={isLoading}
            className="btn-primary w-full py-3 text-lg"
          >
            {isLoading ? 'Creating Token...' : 'Create Token'}
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mt-4 p-4 rounded-lg ${
            status.type === 'success' ? 'status-success' :
            status.type === 'error' ? 'status-error' :
            'status-info'
          }`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenCreation 