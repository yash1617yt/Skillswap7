import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { ThemeContext } from '../context/ThemeContext'
import inviteService from '../services/inviteService'

const Invite = () => {
  const { isDark } = useContext(ThemeContext)
  const [inviteForm, setInviteForm] = useState({
    recipientName: '',
    recipientEmail: '',
    customMessage: '',
  })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  const handleInviteChange = (event) => {
    const { name, value } = event.target
    setInviteForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSendInvitation = async (event) => {
    event.preventDefault()
    setInviteError('')
    setInviteSuccess('')

    if (!inviteForm.recipientName.trim() || !inviteForm.recipientEmail.trim()) {
      setInviteError('Please enter recipient name and email.')
      return
    }

    setInviteSending(true)
    try {
      const response = await inviteService.sendInvitation({
        recipientName: inviteForm.recipientName.trim(),
        recipientEmail: inviteForm.recipientEmail.trim(),
        customMessage: inviteForm.customMessage.trim(),
      })

      const targetEmail = response?.data?.target || inviteForm.recipientEmail.trim()
      const accepted = Array.isArray(response?.data?.delivery?.accepted)
        ? response.data.delivery.accepted.join(', ')
        : ''
      const successLine = response?.data?.message || 'Invitation sent successfully.'
      setInviteSuccess(accepted
        ? `${successLine} | Target: ${targetEmail} | Accepted: ${accepted}`
        : `${successLine} | Target: ${targetEmail}`)
      setInviteForm({ recipientName: '', recipientEmail: '', customMessage: '' })
    } catch (error) {
      setInviteError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send invitation'
      )
    } finally {
      setInviteSending(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 18, duration: 0.45 },
    },
  }

  const headingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 20, duration: 0.6 },
    },
  }

  return (
    <motion.div
      className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 transition-colors duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className={`rounded-3xl p-8 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-2xl`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 0.6 }}
        >
          <motion.div className="mb-8" variants={containerVariants} initial="hidden" animate="show">
            {/* Animated Heading with Underline */}
            <motion.div variants={headingVariants} className="relative inline-block">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent animated-gradient-text">
                📩 Send Joining Invitation
              </h1>
              <motion.div
                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className={`text-base mt-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Enter friend's name and email. They'll receive a personalized SkillSwap join invitation.
            </motion.p>
          </motion.div>

          <motion.form
            onSubmit={handleSendInvitation}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Name Field */}
            <motion.div variants={itemVariants} className="relative">
              <motion.label
                className="block text-sm font-semibold mb-3 inline-block"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Recipient Name
                </span>
              </motion.label>
              <motion.input
                type="text"
                name="recipientName"
                value={inviteForm.recipientName}
                onChange={handleInviteChange}
                placeholder="e.g. Rahul Sharma"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200 ${
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

            {/* Email Field */}
            <motion.div variants={itemVariants} className="relative">
              <motion.label
                className="block text-sm font-semibold mb-3 inline-block"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Recipient Email
                </span>
              </motion.label>
              <motion.input
                type="email"
                name="recipientEmail"
                value={inviteForm.recipientEmail}
                onChange={handleInviteChange}
                placeholder="friend@email.com"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200 ${
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

            {/* Message Field */}
            <motion.div variants={itemVariants} className="md:col-span-2 relative">
              <motion.label
                className="block text-sm font-semibold mb-3 inline-block"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Message (Optional)
                </span>
              </motion.label>
              <motion.textarea
                name="customMessage"
                rows={3}
                value={inviteForm.customMessage}
                onChange={handleInviteChange}
                placeholder="Let's learn together on SkillSwap!"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200 resize-none ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                whileFocus={{
                  scale: 1.01,
                  boxShadow: isDark ? '0 0 20px rgba(34, 211, 238, 0.2)' : '0 0 20px rgba(59, 130, 246, 0.2)',
                }}
              />
            </motion.div>

            {/* Error Alert with Animation */}
            <motion.div
              animate={{ opacity: inviteError ? 1 : 0, height: inviteError ? 'auto' : 0 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-2 overflow-hidden"
            >
              {inviteError && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-5 py-3 text-sm font-medium toast-slide-fade"
                >
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ x: [0, 4, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      ⚠️
                    </motion.span>
                    {inviteError}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Success Alert with Animation */}
            <motion.div
              animate={{ opacity: inviteSuccess ? 1 : 0, height: inviteSuccess ? 'auto' : 0 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-2 overflow-hidden"
            >
              {inviteSuccess && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="rounded-xl border-2 border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-5 py-3 text-sm font-medium toast-slide-fade"
                >
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                      ✅
                    </motion.span>
                    {inviteSuccess}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Submit & Clear Buttons */}
            <motion.div variants={itemVariants} className="md:col-span-2 flex justify-end gap-3">
              <motion.button
                type="submit"
                disabled={inviteSending}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transform transition-all duration-200 soft-pulse gradient-glow ripple-effect shine-sweep smooth-transform relative overflow-hidden shadow-lg"
                whileHover={{ scale: inviteSending ? 1 : 1.06, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inviteSending ? 1 : 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    ⌛
                  </motion.span>
                </motion.span>
                <motion.span animate={{ opacity: inviteSending ? 0 : 1 }} className="flex items-center gap-2">
                  📤 {inviteSending ? 'Sending...' : 'Send Invitation'}
                </motion.span>
              </motion.button>

              <motion.button
                type="reset"
                onClick={() => setInviteForm({ recipientName: '', recipientEmail: '', customMessage: '' })}
                className={`px-6 py-3.5 rounded-xl border-2 font-semibold transition-all ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Invite
