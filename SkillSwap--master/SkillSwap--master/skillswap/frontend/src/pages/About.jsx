import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { motion } from 'framer-motion'

const About = () => {
  const { isDark } = useContext(ThemeContext)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 20, duration: 0.7 },
    },
  }

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20, duration: 0.5 },
    },
  }

  const sections = [
    {
      title: '🎯 Our Mission',
      color: 'from-blue-500 to-cyan-500',
      emoji: '🚀',
      content: (
        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
          <span className="font-semibold text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text">SkillSwap</span> is dedicated to democratizing education by creating a peer-to-peer learning platform
          where knowledge is exchanged through a <span className="font-semibold text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text">token-based economy</span>. We believe every individual has valuable
          skills to share and infinite potential to learn.
        </p>
      ),
    },
    {
      title: '⚙️ How It Works',
      color: 'from-purple-500 to-pink-500',
      emoji: '🔄',
      content: (
        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
          Users earn tokens by teaching their skills through recorded or live lectures. These tokens can then
          be used to learn from others. This creates a <span className="font-semibold">sustainable ecosystem</span> where education is truly peer-driven.
        </p>
      ),
    },
    {
      title: '💎 Our Values',
      color: 'from-green-500 to-emerald-500',
      emoji: '✨',
      content: (
        <ul className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {[
            { icon: '🌍', label: 'Accessibility', desc: 'Knowledge should be available to everyone', color: 'text-blue-400' },
            { icon: '⚖️', label: 'Equality', desc: 'Every skill has value and deserves recognition', color: 'text-purple-400' },
            { icon: '🏆', label: 'Quality', desc: 'We maintain high standards for content', color: 'text-green-400' },
            { icon: '👥', label: 'Community', desc: 'We foster a supportive learning environment', color: 'text-pink-400' },
          ].map((item, idx) => (
            <motion.li
              key={idx}
              variants={listItemVariants}
              className={`rounded-xl p-3 border-l-4 ${
                isDark ? 'bg-gray-900/40 border-gradient-to-b from-cyan-500 to-blue-500' : 'bg-blue-50/50 border-blue-500'
              }`}
            >
              <span className="font-bold text-lg">{item.icon}</span>
              <span className={`font-bold ml-2 ${item.color}`}>{item.label}:</span>
              <span className="ml-2">{item.desc}</span>
            </motion.li>
          ))}
        </ul>
      ),
    },
    {
      title: '📞 Contact Information',
      color: 'from-pink-500 to-rose-500',
      emoji: '💬',
      content: (
        <div className={`space-y-2 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <span className="font-semibold text-pink-500">📧 Email:</span> support@skillswap.com
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <span className="font-semibold text-pink-500">📱 Phone:</span> +91-XXXX-XXXX
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <span className="font-semibold text-pink-500">📍 Address:</span> India
          </motion.div>
        </div>
      ),
    },
  ]

  return (
    <motion.div
      className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 transition-colors`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Heading */}
        <motion.div className="mb-16" initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 0.8 }}>
          <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-600 bg-clip-text text-transparent animated-gradient-text inline-block w-full">
            About SkillSwap Platform
          </h1>
          <motion.div
            className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-600 rounded-full max-w-xs mx-auto mt-6"
            initial={{ width: 0 }}
            animate={{ width: 220 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className={`text-center text-lg mt-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Democratizing Education Through Peer-to-Peer Learning
          </motion.p>
        </motion.div>

        {/* Sections Container */}
        <motion.div
          className={`rounded-3xl shadow-2xl p-10 border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-100'
          } space-y-8 backdrop-blur-sm`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 25, duration: 0.8 }}
        >
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {sections.map((section, idx) => (
              <motion.section
                key={idx}
                variants={sectionVariants}
                className={`rounded-2xl p-8 border-2 ${
                  isDark
                    ? `bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 border-${section.color.split('-')[1]}-500/30`
                    : `bg-gradient-to-br from-white to-${section.color.split('-')[1]}-50/30 border-${section.color.split('-')[1]}-200`
                } backdrop-blur-sm transition-all`}
                whileHover={{
                  scale: 1.02,
                  boxShadow: isDark
                    ? `0 20px 40px rgba(34, 211, 238, 0.1)`
                    : `0 20px 40px rgba(59, 130, 246, 0.1)`,
                }}
              >
                <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                  <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl">
                    {section.emoji}
                  </motion.span>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r ${section.color} bg-clip-text text-transparent`}>
                    {section.title}
                  </h2>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.6 }}>
                  {section.content}
                </motion.div>
              </motion.section>
            ))}
          </motion.div>

          {/* Bottom Divider Line */}
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />

          {/* Call to Action */}
          <motion.div
            className={`rounded-2xl p-8 bg-gradient-to-r ${
              isDark ? 'from-cyan-500/20 to-blue-500/20' : 'from-blue-100/50 to-cyan-100/50'
            } border-2 border-cyan-500/50 text-center`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.7 }}
          >
            <motion.p
              className={`text-xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Join thousands of learners and educators transforming education through peer-to-peer learning 🌟
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default About
