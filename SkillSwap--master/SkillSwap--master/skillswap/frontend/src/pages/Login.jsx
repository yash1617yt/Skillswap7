import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Login = () => {
  const { isDark } = useContext(ThemeContext)
  const { login, googleLogin } = useContext(AuthContext)
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(formData)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      await googleLogin()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Google login failed')
    }
    setIsGoogleLoading(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20, duration: 0.6 },
    },
  }

  const headingVariants = {
    hidden: { opacity: 0, scale: 0.7 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 18, duration: 0.7 },
    },
  }

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`max-w-md w-full rounded-3xl shadow-2xl p-10 border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 0.7 }}
      >
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.h2
            variants={headingVariants}
            className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent animated-gradient-text"
          >
            Welcome Back
          </motion.h2>
          <motion.p variants={itemVariants} className={`text-center text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Login to your SkillSwap account
          </motion.p>

          {error && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-red-100/90 dark:bg-red-900/30 border border-red-300 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 toast-slide-fade font-medium"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <motion.label className="block text-sm font-semibold mb-3 inline-block" whileHover={{ x: 4 }}>
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Email Address
                </span>
              </motion.label>
              <motion.input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                whileFocus={{
                  scale: 1.02,
                  boxShadow: isDark ? '0 0 20px rgba(34, 211, 238, 0.2)' : '0 0 20px rgba(59, 130, 246, 0.2)',
                }}
                required
              />
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <motion.label className="block text-sm font-semibold mb-3 inline-block" whileHover={{ x: 4 }}>
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Password
                </span>
              </motion.label>
              <motion.input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                whileFocus={{
                  scale: 1.02,
                  boxShadow: isDark ? '0 0 20px rgba(34, 211, 238, 0.2)' : '0 0 20px rgba(59, 130, 246, 0.2)',
                }}
                required
              />
            </motion.div>

            {/* Login Button */}
            <motion.div className="flex justify-start">
              <motion.button
                variants={itemVariants}
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-3.5 px-8 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transform transition-all duration-200 soft-pulse gradient-glow ripple-effect shine-sweep smooth-transform relative overflow-hidden shadow-lg"
                whileHover={{ scale: isLoading ? 1 : 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: isLoading ? 1 : 0 }} className="absolute inset-0 flex items-center justify-center">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  ⌛
                </motion.span>
              </motion.span>
              <motion.span animate={{ opacity: isLoading ? 0 : 1 }} className="flex items-center justify-center gap-2">
                🔐 {isLoading ? 'Logging in...' : 'Login'}
              </motion.span>
            </motion.button>
          </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 space-y-3">
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 ripple-effect smooth-transform"
              whileHover={{ scale: isGoogleLoading ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center justify-center gap-2">
                🔵 {isGoogleLoading ? 'Connecting...' : 'Login with Google'}
              </span>
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="relative my-6">
            <div className={`absolute inset-0 flex items-center ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
              <div className="w-full border-t"></div>
            </div>
            <div className={`relative flex justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              <span className={`px-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>or</span>
            </div>
          </motion.div>

          <motion.p variants={itemVariants} className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
            Don't have an account?{' '}
            <motion.a
              href="/register"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent font-bold hover:opacity-80 transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Register here
            </motion.a>
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Login
