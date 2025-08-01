import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Rocket, Home, Plus, TrendingUp, Trophy, Gavel } from 'lucide-react'

const Header: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/create', label: 'Create Token', icon: Plus },
    { path: '/fundraising', label: 'Fundraising', icon: TrendingUp },
    { path: '/winning-view', label: 'WinningView', icon: Trophy },
    { path: '/auction', label: 'Auction', icon: Gavel },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Rocket className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Darwin Launchpad</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="btn-primary" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 border-t border-gray-200">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header 