import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Rocket, 
  Plus, 
  TrendingUp, 
  Trophy, 
  Gavel, 
  Users, 
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react'
import { getSolBalance, formatPublicKey } from '../utils/solana'

interface PlatformStats {
  totalTokens: number
  totalFundraising: number
  totalAuctions: number
  totalUsers: number
  totalVolume: number
}

const Dashboard: React.FC = () => {
  const { publicKey } = useWallet()
  const [solBalance, setSolBalance] = useState<number>(0)
  const [stats, setStats] = useState<PlatformStats>({
    totalTokens: 12,
    totalFundraising: 8,
    totalAuctions: 5,
    totalUsers: 234,
    totalVolume: 1250.5
  })

  useEffect(() => {
    if (publicKey) {
      getSolBalance(publicKey).then(setSolBalance)
    }
  }, [publicKey])

  const quickActions = [
    {
      title: 'Create Token',
      description: 'Launch your own token with automatic tax collection',
      icon: Plus,
      path: '/create',
      color: 'bg-blue-500'
    },
    {
      title: 'Start Fundraising',
      description: 'Raise funds through 24-hour SOL-only fundraising',
      icon: TrendingUp,
      path: '/fundraising',
      color: 'bg-green-500'
    },
    {
      title: 'View Active Projects',
      description: 'Browse all active fundraises and auctions',
      icon: Trophy,
      path: '/winning-view',
      color: 'bg-purple-500'
    },
    {
      title: 'Join Auction',
      description: 'Participate in Last Man Standing auctions',
      icon: Gavel,
      path: '/auction',
      color: 'bg-orange-500'
    }
  ]

  const statCards = [
    {
      title: 'Total Tokens',
      value: stats.totalTokens,
      icon: Rocket,
      color: 'text-blue-600'
    },
    {
      title: 'Active Fundraises',
      value: stats.totalFundraising,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Completed Auctions',
      value: stats.totalAuctions,
      icon: Gavel,
      color: 'text-orange-600'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Darwin Launchpad
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Non-custodial, trustless, globally scalable token launchpad on Solana testnet
        </p>
      </div>

      {/* Wallet Info */}
      {publicKey && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Wallet</h3>
              <p className="text-gray-600">{formatPublicKey(publicKey)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{solBalance.toFixed(4)} SOL</p>
              <p className="text-sm text-gray-500">Testnet Balance</p>
            </div>
          </div>
        </div>
      )}

      {/* Platform Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.path}
                className="card hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">DARWIN Token fundraising started</p>
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">MEGA Protocol auction completed</p>
                  <p className="text-sm text-gray-600">5 hours ago</p>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">DeFi Master tokens distributed</p>
                  <p className="text-sm text-gray-600">1 day ago</p>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 