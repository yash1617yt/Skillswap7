import React, { useContext, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import WebSocketStatus from './WebSocketStatus'
import skillswapLogo from '../assets/skillswap-logo.svg'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext)
  const { isDark } = useContext(ThemeContext)
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [logoLoadFailed, setLogoLoadFailed] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setShowProfileMenu(false)
  }

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Videos', path: '/videos' },
    { label: 'Contact', path: '/contact' },
    { label: 'Invite', path: '/invite' },
  ]

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`${isDark ? 'dark bg-gray-900/90' : 'bg-white/95 border-b border-orange-200/80'} shadow-lg sticky top-0 z-50 backdrop-blur-ui opacity-transition`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition floating-effect">
            {!logoLoadFailed ? (
              <img
                src={skillswapLogo}
                alt="SkillSwap Logo"
                className="h-10 w-10 rounded-lg bg-white/70 p-1"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center shadow">
                SS
              </div>
            )}
            <span className={`text-2xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]'}`}>
              SkillSwap
            </span>
          </Link>

          {/* Menu */}
          <div className="hidden md:flex gap-8 items-center absolute left-1/2 transform -translate-x-1/2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition ${
                  item.label === 'Invite'
                    ? isDark
                      ? 'px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 soft-pulse gradient-glow ripple-effect shine-sweep smooth-transform'
                      : 'px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-rose-500 text-white font-semibold shadow-md border border-orange-300/60 hover:from-orange-700 hover:to-rose-600 smooth-transform'
                    : isDark
                      ? 'text-gray-300 hover:text-white slide-underline smooth-transform'
                      : 'text-slate-800 hover:text-orange-700 slide-underline smooth-transform'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* WebSocket Status */}
                <WebSocketStatus />
                
                {/* Tokens */}
                <div className={`px-3 py-1 rounded-lg counter-animation smooth-transform ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <span className="text-sm font-semibold">💎 {user?.tokens || 0}</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  {/* User Avatar Button */}
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold hover:scale-110 transition-transform shadow-lg ring-2 ring-blue-500/50 floating-effect smooth-transform overflow-hidden"
                  >
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden z-50 max-h-[85vh] overflow-y-auto custom-scrollbar fade-in slide-down opacity-transition ${
                      isDark 
                        ? 'bg-gray-900/95 border-gray-700' 
                        : 'bg-white/95 border-gray-200'
                    }`}>
                      {/* Profile Header */}
                      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                            {user?.profilePicture ? (
                              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              user?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{user?.name || 'User'}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {user?.email || 'user@email.com'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <div className="flex-1 bg-blue-600/20 px-3 py-2 rounded-lg text-center">
                            <p className="text-xs text-gray-400">Tokens</p>
                            <p className="font-bold text-blue-400">{user?.tokens || 0}</p>
                          </div>
                          <div className="flex-1 bg-purple-600/20 px-3 py-2 rounded-lg text-center">
                            <p className="text-xs text-gray-400">Completed</p>
                            <p className="font-bold text-purple-400">{user?.lecturesCompleted || 0}</p>
                          </div>
                          <div className="flex-1 bg-pink-600/20 px-3 py-2 rounded-lg text-center">
                            <p className="text-xs text-gray-400">Streak</p>
                            <p className="font-bold text-pink-400">7 🔥</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Profile Sections */}
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">👤</span>
                          <div className="flex-1">
                            <p className="font-semibold">View Full Profile</p>
                            <p className="text-xs text-gray-400">See your complete profile</p>
                          </div>
                        </Link>

                        <div className={`my-2 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

                        {/* Other Options */}
                        <Link
                          to="/dashboard"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">📈</span>
                          <span className="font-semibold">Dashboard</span>
                        </Link>

                        {user?.role === 'admin' && (
                          <Link
                            to="/admin/videos"
                            onClick={() => setShowProfileMenu(false)}
                            className={`flex items-center gap-3 px-4 py-3 transition ${
                              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                          >
                            <span className="text-2xl">🛠️</span>
                            <span className="font-semibold">Admin Video Panel</span>
                          </Link>
                        )}

                        <Link
                          to="/courses"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">📚</span>
                          <span className="font-semibold">My Courses</span>
                        </Link>

                        <Link
                          to="/interactive-notes"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">📝</span>
                          <span className="font-semibold">My Notes</span>
                        </Link>

                        <Link
                          to="/subscription"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">💎</span>
                          <span className="font-semibold">Subscription</span>
                        </Link>

                        <div className={`my-2 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

                        {/* AI and Settings */}
                        <Link
                          to="/profile?tab=settings&ai=1"
                          onClick={() => {
                            setShowProfileMenu(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">🤖</span>
                          <div className="flex-1 text-left">
                            <p className="font-semibold">AI Profile Insights</p>
                            <p className="text-xs text-purple-400">Ask AI about your profile</p>
                          </div>
                        </Link>

                        <Link
                          to="/profile?tab=settings"
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">⚙️</span>
                          <span className="font-semibold">Settings & Privacy</span>
                        </Link>

                        <div className={`my-2 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition text-red-500 hover:bg-red-500/10`}
                        >
                          <span className="text-2xl">🚪</span>
                          <span className="font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg transition ripple-effect smooth-transform hover-scale ${
                    isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg border smooth-transform hover-scale opacity-transition ${
                    isDark
                      ? 'border-blue-600 text-blue-600'
                      : 'border-blue-600 text-blue-600'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
