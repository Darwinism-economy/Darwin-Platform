import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Gavel, 
  Clock, 
  Users, 
  DollarSign,
  Trophy,
  Timer,
  Coins,
  Award
} from 'lucide-react'
import { getSolBalance, requestAirdrop } from '../utils/solana'

interface AuctionState {
  isActive: boolean
  endTime: number | null
  lastBidder: string | null
  totalBids: number
  currentBid: number
  minimumTokenBid: number
  treasury: number
  participants: string[]
}

const Auction: React.FC = () => {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [tokenAmount, setTokenAmount] = useState(1000)
  const [solBalance, setSolBalance] = useState(0)
  
  const [auction, setAuction] = useState<AuctionState>({
    isActive: false,
    endTime: null,
    lastBidder: null,
    totalBids: 0,
    currentBid: 0,
    minimumTokenBid: 1000,
    treasury: 78.2, // SOL from fundraising
    participants: []
  })

  useEffect(() => {
    if (publicKey) {
      getSolBalance(publicKey).then(setSolBalance)
    }
  }, [publicKey])

  useEffect(() => {
    if (auction.isActive && auction.endTime) {
      const timer = setInterval(() => {
        const now = Date.now()
        if (now >= auction.endTime!) {
          // Auction ended
          setAuction(prev => ({ ...prev, isActive: false }))
          if (prev.lastBidder) {
            setStatus({ 
              type: 'success', 
              message: `Auction ended! ${prev.lastBidder} wins ${prev.treasury} SOL treasury!` 
            })
          } else {
            setStatus({ type: 'info', message: 'Auction ended! No bids placed. Treasury will be distributed to holders.' })
          }
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [auction.isActive, auction.endTime])

  const startAuction = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      // Simulate starting auction
      setStatus({ type: 'info', message: 'Starting Last Man Standing auction...' })
      await new Promise(resolve => setTimeout(resolve, 2000))

      const endTime = Date.now() + (5 * 60 * 60 * 1000) // 5 hours
      setAuction(prev => ({
        ...prev,
        isActive: true,
        endTime,
        lastBidder: null,
        totalBids: 0,
        currentBid: 0,
        participants: []
      }))

      setStatus({ type: 'success', message: 'Auction started! Buy minimum tokens to place a bid.' })

    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to start auction' })
    } finally {
      setIsLoading(false)
    }
  }

  const placeBid = async () => {
    if (!publicKey || !auction.isActive) {
      setStatus({ type: 'error', message: 'Auction is not active' })
      return
    }

    if (tokenAmount < auction.minimumTokenBid) {
      setStatus({ type: 'error', message: `Must buy at least ${auction.minimumTokenBid} tokens to place a bid` })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      // Simulate placing bid
      setStatus({ type: 'info', message: 'Processing bid...' })
      await new Promise(resolve => setTimeout(resolve, 1500))

      const bidder = `User_${Math.floor(Math.random() * 1000)}`
      const newBid = auction.currentBid + 0.1 // Increment bid
      
      setAuction(prev => ({
        ...prev,
        lastBidder: bidder,
        totalBids: prev.totalBids + 1,
        currentBid: newBid,
        participants: prev.participants.includes(bidder) ? prev.participants : [...prev.participants, bidder],
        endTime: Date.now() + (5 * 60 * 60 * 1000) // Reset timer to 5 hours
      }))

      setStatus({ 
        type: 'success', 
        message: `${bidder} bought ${tokenAmount.toLocaleString()} tokens and placed a bid! Timer reset.` 
      })

    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to place bid' })
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
    if (!auction.endTime) return '--:--:--'
    const timeLeft = Math.max(0, auction.endTime - Date.now())
    return formatTime(timeLeft)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Last Man Standing Auction</h1>
        <p className="text-gray-600">
          Buy minimum tokens from LP to place a bid. Last bidder wins the treasury!
        </p>
      </div>

      {/* Test SOL Request */}
      {publicKey && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need Test SOL?</h3>
              <p className="text-gray-600">Request testnet SOL to participate in auctions</p>
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

      {/* Auction Status */}
      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auction Info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Auction Status</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                auction.isActive 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {auction.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Timer */}
            {auction.isActive && (
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Auction Ends In:</span>
                </div>
                <div className="text-2xl font-mono font-bold text-orange-900">
                  {getTimeLeft()}
                </div>
              </div>
            )}

            {/* Treasury Info */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Treasury Prize
              </h4>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                {auction.treasury.toFixed(1)} SOL
              </div>
              <p className="text-sm text-purple-700">
                The last bidder wins the entire treasury!
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Participants</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {auction.participants.length}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Gavel className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Total Bids</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {auction.totalBids}
                </div>
              </div>
            </div>

            {/* Current Bid */}
            {auction.isActive && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Current Bid</h4>
                <div className="text-2xl font-bold text-green-900 mb-1">
                  {auction.currentBid.toFixed(1)} SOL
                </div>
                {auction.lastBidder && (
                  <p className="text-sm text-green-700">
                    Last bidder: {auction.lastBidder}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bidding Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Place Your Bid</h3>

            {/* Auction Rules */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Award className="w-4 h-4 mr-2" />
                How It Works
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Buy minimum tokens from LP to place a bid</li>
                <li>• Each bid resets the timer to 5 hours</li>
                <li>• Last bidder when timer expires wins the treasury</li>
                <li>• Multiple bids from same wallet are allowed</li>
              </ul>
            </div>

            {/* Token Purchase Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buy Tokens from LP (Minimum: {auction.minimumTokenBid.toLocaleString()})
              </label>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="1000"
                min={auction.minimumTokenBid}
                step="100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Estimated cost: ~{(tokenAmount * 0.001).toFixed(3)} SOL
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!auction.isActive ? (
                <button
                  onClick={startAuction}
                  disabled={isLoading}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  <Gavel className="w-5 h-5 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Auction'}
                </button>
              ) : (
                <button
                  onClick={placeBid}
                  disabled={isLoading || tokenAmount < auction.minimumTokenBid}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  {isLoading ? 'Processing...' : 'Buy Tokens & Place Bid'}
                </button>
              )}
            </div>

            {/* Recent Activity */}
            {auction.participants.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Participants</h4>
                <div className="space-y-2">
                  {auction.participants.slice(-5).map((participant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{participant}</span>
                      <span className="text-gray-900 font-medium">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Auction History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction History</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">MEGA Protocol Auction</p>
                <p className="text-sm text-gray-600">Winner: User_456 • Prize: 78.2 SOL</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">DeFi Master Auction</p>
                <p className="text-sm text-gray-600">Winner: User_123 • Prize: 120.0 SOL</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">5 days ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auction 