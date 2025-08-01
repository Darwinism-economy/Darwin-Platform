import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign,
  Award,
  Activity,
  ArrowRight
} from 'lucide-react'

interface Fundraise {
  id: number
  name: string
  status: 'active' | 'auction' | 'completed'
  raised: number
  goal: number
  contributors: number
  timeLeft: number
  startTime: number
  auction: {
    active: boolean
    currentBid: number
    totalBids: number
    endTime: number | null
    winner: string | null
  }
  distribution: {
    totalDistributed: number
    distributionCount: number
    nextDistributionTime: number | null
    tokenLive: boolean
  }
}

const WinningView: React.FC = () => {
  const [fundraises, setFundraises] = useState<Fundraise[]>([])

  useEffect(() => {
    // Initialize with sample data
    const sampleFundraises: Fundraise[] = [
      {
        id: 1,
        name: "DARWIN Token",
        status: "active",
        raised: 45.5,
        goal: 100,
        contributors: 23,
        timeLeft: 18 * 60 * 60 * 1000, // 18 hours
        startTime: Date.now() - (6 * 60 * 60 * 1000), // Started 6 hours ago
        auction: {
          active: false,
          currentBid: 0,
          totalBids: 0,
          endTime: null,
          winner: null
        },
        distribution: {
          totalDistributed: 0,
          distributionCount: 0,
          nextDistributionTime: null,
          tokenLive: false
        }
      },
      {
        id: 2,
        name: "MEGA Protocol",
        status: "auction",
        raised: 78.2,
        goal: 150,
        contributors: 45,
        timeLeft: 0,
        startTime: Date.now() - (25 * 60 * 60 * 1000), // Started 25 hours ago
        auction: {
          active: true,
          currentBid: 5.5,
          totalBids: 12,
          endTime: Date.now() + (3 * 60 * 60 * 1000), // 3 hours left
          winner: null
        },
        distribution: {
          totalDistributed: 1250.5,
          distributionCount: 3,
          nextDistributionTime: Date.now() + (12 * 60 * 60 * 1000), // 12 hours left
          tokenLive: true
        }
      },
      {
        id: 3,
        name: "DeFi Master",
        status: "completed",
        raised: 120,
        goal: 100,
        contributors: 67,
        timeLeft: 0,
        startTime: Date.now() - (30 * 60 * 60 * 1000), // Started 30 hours ago
        auction: {
          active: false,
          currentBid: 0,
          totalBids: 0,
          endTime: null,
          winner: "User_123"
        },
        distribution: {
          totalDistributed: 8900.2,
          distributionCount: 15,
          nextDistributionTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours left
          tokenLive: true
        }
      }
    ]

    setFundraises(sampleFundraises)
  }, [])

  useEffect(() => {
    // Update timers every second
    const timer = setInterval(() => {
      setFundraises(prev => prev.map(fundraise => {
        if (fundraise.status === 'active') {
          const newTimeLeft = Math.max(0, fundraise.timeLeft - 1000)
          return {
            ...fundraise,
            timeLeft: newTimeLeft,
            status: newTimeLeft <= 0 ? 'auction' : 'active'
          }
        }
        return fundraise
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0h 0m'
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'auction':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="w-4 h-4" />
      case 'auction':
        return <Award className="w-4 h-4" />
      case 'completed':
        return <Trophy className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'auction':
        return 'Auction Active'
      case 'completed':
        return 'Completed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          WinningView - Active Fundraises
        </h1>
        <p className="text-gray-600">
          Browse all active fundraises, auctions, and completed projects
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Fundraises</p>
              <p className="text-2xl font-bold text-gray-900">
                {fundraises.filter(f => f.status === 'active').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Auctions</p>
              <p className="text-2xl font-bold text-gray-900">
                {fundraises.filter(f => f.status === 'auction').length}
              </p>
            </div>
            <Award className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {fundraises.filter(f => f.status === 'completed').length}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {fundraises.reduce((sum, f) => sum + f.raised, 0).toFixed(1)} SOL
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Fundraises List */}
      <div className="space-y-6">
        {fundraises.map((fundraise) => {
          const progress = Math.min((fundraise.raised / fundraise.goal) * 100, 100)
          const timeLeft = fundraise.status === 'active' ? formatTime(fundraise.timeLeft) :
                         fundraise.status === 'auction' && fundraise.auction.endTime ? 
                         formatTime(fundraise.auction.endTime - Date.now()) : 'Completed'

          return (
            <div key={fundraise.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{fundraise.name}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(fundraise.status)}`}>
                      {getStatusIcon(fundraise.status)}
                      <span>{getStatusText(fundraise.status)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Raised</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {fundraise.raised.toFixed(1)} SOL
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Contributors</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {fundraise.contributors}
                      </div>
                    </div>

                    {fundraise.distribution.tokenLive && (
                      <>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">Distributed</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {fundraise.distribution.totalDistributed.toFixed(1)} SOL
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Activity className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">Distributions</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {fundraise.distribution.distributionCount}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Goal: {fundraise.goal} SOL
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {fundraise.status === 'active' ? `${timeLeft} left` :
                           fundraise.status === 'auction' ? `${timeLeft} auction left` : 'Fundraising completed'}
                        </span>
                      </div>
                      
                      {fundraise.distribution.tokenLive && fundraise.distribution.nextDistributionTime && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Activity className="w-4 h-4" />
                          <span>
                            Next distribution: {formatTime(fundraise.distribution.nextDistributionTime - Date.now())}
                          </span>
                        </div>
                      )}
                    </div>

                    <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium">
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Auction Info (if active) */}
              {fundraise.status === 'auction' && fundraise.auction.active && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Last Man Standing Auction
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-orange-700">Current Bid:</span>
                        <div className="font-bold text-orange-900">{fundraise.auction.currentBid} SOL</div>
                      </div>
                      <div>
                        <span className="text-sm text-orange-700">Total Bids:</span>
                        <div className="font-bold text-orange-900">{fundraise.auction.totalBids}</div>
                      </div>
                      <div>
                        <span className="text-sm text-orange-700">Time Left:</span>
                        <div className="font-bold text-orange-900">{timeLeft}</div>
                      </div>
                      <div>
                        <span className="text-sm text-orange-700">Prize Pool:</span>
                        <div className="font-bold text-orange-900">{fundraise.raised.toFixed(1)} SOL</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {fundraises.length === 0 && (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Fundraises</h3>
          <p className="text-gray-600">Check back later for new projects launching on Darwin Launchpad</p>
        </div>
      )}
    </div>
  )
}

export default WinningView 