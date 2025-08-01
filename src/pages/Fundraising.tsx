import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign,
  Play,
  Pause,
  Coins,
  Timer
} from 'lucide-react'
import { getSolBalance, requestAirdrop } from '../utils/solana'

interface FundraisingState {
  isActive: boolean
  totalRaised: number
  contributors: number
  endTime: number | null
  goal: number
  lastContribution: number
}

const Fundraising: React.FC = () => {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [contributionAmount, setContributionAmount] = useState(1)
  const [solBalance, setSolBalance] = useState(0)
  
  const [fundraising, setFundraising] = useState<FundraisingState>({
    isActive: false,
    totalRaised: 0,
    contributors: 0,
    endTime: null,
    goal: 100, // 100 SOL goal
    lastContribution: 0
  })

  useEffect(() => {
    if (publicKey) {
      getSolBalance(publicKey).then(setSolBalance)
    }
  }, [publicKey])

  useEffect(() => {
    if (fundraising.isActive && fundraising.endTime) {
      const timer = setInterval(() => {
        const now = Date.now()
        if (now >= fundraising.endTime!) {
          // Fundraising ended
          setFundraising(prev => ({ ...prev, isActive: false }))
          setStatus({ type: 'info', message: 'Fundraising period has ended!' })
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [fundraising.isActive, fundraising.endTime])

  const calculateTokens = (amount: number): number => {
    if (!fundraising.isActive) return 0
    
    // Bonding curve: price increases by 0.33% per 1 SOL
    const basePrice = 0.0001 // Starting price
    const priceIncrease = 0.0033 // 0.33% per SOL
    
    // Calculate current price based on total raised
    const currentPrice = basePrice * Math.pow(1 + priceIncrease, fundraising.totalRaised)
    const tokensReceived = amount / currentPrice
    
    return tokensReceived
  }

  const calculateNextPrice = (): number => {
    if (!fundraising.isActive) return 0
    
    const basePrice = 0.0001
    const priceIncrease = 0.0033
    const currentPrice = basePrice * Math.pow(1 + priceIncrease, fundraising.totalRaised)
    const nextPrice = basePrice * Math.pow(1 + priceIncrease, fundraising.totalRaised + 1)
    
    return ((nextPrice - currentPrice) / currentPrice * 100)
  }

  const startFundraising = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      // Simulate starting fundraising
      setStatus({ type: 'info', message: 'Starting fundraising...' })
      await new Promise(resolve => setTimeout(resolve, 2000))

      const endTime = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      setFundraising(prev => ({
        ...prev,
        isActive: true,
        endTime,
        totalRaised: 0,
        contributors: 0
      }))

      setStatus({ type: 'success', message: 'Fundraising started! 24-hour period begins now.' })

    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to start fundraising' })
    } finally {
      setIsLoading(false)
    }
  }

  const contribute = async () => {
    if (!publicKey || !fundraising.isActive) {
      setStatus({ type: 'error', message: 'Fundraising is not active' })
      return
    }

    if (contributionAmount <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' })
      return
    }

    if (contributionAmount > solBalance) {
      setStatus({ type: 'error', message: 'Insufficient SOL balance' })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      // Simulate contribution
      setStatus({ type: 'info', message: 'Processing contribution...' })
      await new Promise(resolve => setTimeout(resolve, 1500))

      const tokensReceived = calculateTokens(contributionAmount)
      
      setFundraising(prev => ({
        ...prev,
        totalRaised: prev.totalRaised + contributionAmount,
        contributors: prev.contributors + 1,
        lastContribution: tokensReceived
      }))

      setStatus({ 
        type: 'success', 
        message: `Contributed ${contributionAmount} SOL! Received ${tokensReceived.toLocaleString()} tokens.` 
      })

    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to contribute' })
    } finally {
      setIsLoading(false)
    }
  }

  const requestTestSol = async () => {
    if (!publicKey) return

    try {
      setIsLoading(true)
      await requestAirdrop(publicKey, 2)
      setSolBalance(prev => prev + 2)
      setStatus({ type: 'success', message: '2 SOL airdropped to your wallet!' })
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to request airdrop' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeLeft = (): string => {
    if (!fundraising.endTime) return '--:--:--'
    const timeLeft = Math.max(0, fundraising.endTime - Date.now())
    return formatTime(timeLeft)
  }

  const progress = Math.min((fundraising.totalRaised / fundraising.goal) * 100, 100)
  const tokensReceived = calculateTokens(contributionAmount)
  const priceIncrease = calculateNextPrice()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fundraising</h1>
        <p className="text-gray-600">
          Raise funds through a 24-hour SOL-only fundraising period with bonding curve pricing
        </p>
      </div>

      {/* Test SOL Request */}
      {publicKey && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need Test SOL?</h3>
              <p className="text-gray-600">Request testnet SOL to participate in fundraising</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Balance: {solBalance.toFixed(4)} SOL</span>
              <button
                onClick={requestTestSol}
                disabled={isLoading}
                className="btn-primary"
              >
                Request 2 SOL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fundraising Status */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fundraising Info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Fundraising Status</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                fundraising.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {fundraising.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Timer */}
            {fundraising.isActive && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Fundraising Ends In:</span>
                </div>
                <div className="text-2xl font-mono font-bold text-blue-900">
                  {getTimeLeft()}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Total Raised</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {fundraising.totalRaised.toFixed(2)} SOL
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Contributors</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {fundraising.contributors}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Goal: {fundraising.goal} SOL
              </div>
            </div>
          </div>

          {/* Contribution Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Contribute SOL</h3>

            {/* Bonding Curve Info */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Bonding Curve Pricing
              </h4>
              <p className="text-sm text-purple-700">
                Token price increases by 0.33% per 1 SOL deposited. Early contributors get better rates!
              </p>
            </div>

            {/* Contribution Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Amount (SOL)
              </label>
              <input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                className="input-field"
                placeholder="1"
                step="0.1"
                min="0.1"
                max={solBalance}
              />
            </div>

            {/* Token Calculation */}
            {fundraising.isActive && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">You Will Receive:</h4>
                <div className="text-2xl font-bold text-green-900 mb-2">
                  {tokensReceived.toLocaleString()} DARWIN
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>Price: 1 SOL = {(1 / (0.0001 * Math.pow(1.0033, fundraising.totalRaised))).toLocaleString()} DARWIN</div>
                  <div>Next 1 SOL will cost {priceIncrease.toFixed(2)}% more</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!fundraising.isActive ? (
                <button
                  onClick={startFundraising}
                  disabled={isLoading}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Fundraising'}
                </button>
              ) : (
                <button
                  onClick={contribute}
                  disabled={isLoading || contributionAmount <= 0}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  {isLoading ? 'Contributing...' : 'Contribute SOL'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mt-6 p-4 rounded-lg ${
            status.type === 'success' ? 'status-success' :
            status.type === 'error' ? 'status-error' :
            'status-info'
          }`}>
            {status.message}
          </div>
        )}
      </div>

      {/* Last Contribution */}
      {fundraising.lastContribution > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Contribution</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-900 mb-2">
                {fundraising.lastContribution.toLocaleString()} DARWIN
              </div>
              <p className="text-green-700">Successfully received!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fundraising 