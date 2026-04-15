import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

const Info = () => {
  const { isDark } = useContext(ThemeContext)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 transition-colors`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent inline-block w-full">
            Platform Information
          </h1>
          <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-full max-w-xs mx-auto mt-4" />
        </div>

        <div className={`rounded-3xl shadow-2xl p-10 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} space-y-8 backdrop-blur-sm`}>
          <section>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              🚀 About SkillSwap
            </h2>
            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              SkillSwap is a peer-to-peer learning platform where users can learn, teach, track progress, and exchange value through tokens.
              The goal is simple: make practical learning accessible, measurable, and rewarding for every learner.
            </p>
          </section>

          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

          <section>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              🌟 Platform Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-6 border-2 ${isDark ? 'bg-gray-900/50 border-cyan-500/30' : 'bg-blue-50/50 border-blue-200'} backdrop-blur-sm`}>
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Learning Experience</span>
                </h3>
                <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {['Structured courses with video lectures', 'Interactive notes while learning', 'Weekly activity and contribution heatmap', 'Profile-based progress tracking', 'Token-based motivation system'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`rounded-2xl p-6 border-2 ${isDark ? 'bg-gray-900/50 border-cyan-500/30' : 'bg-blue-50/50 border-blue-200'} backdrop-blur-sm`}>
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Reliability & Safety</span>
                </h3>
                <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {['Secure authentication and protected routes', 'Real-time updates for activity and tokens', 'Consistent profile and progress sync', 'Subscription and access control support', '24/7 support channels for learners'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

          <section>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              🧭 How SkillSwap Works
            </h2>
            <dl className="space-y-4">
              {[
                { title: '1) Discover', desc: 'Browse lectures by category and pick the course you want to learn.' },
                { title: '2) Learn', desc: 'Watch videos, use notes, and complete sessions with tracked time and progress.' },
                { title: '3) Earn & Spend Tokens', desc: 'Tokens are used for premium learning actions and earned through contribution and activity.' },
                { title: '4) Improve', desc: 'Use profile analytics, activity heatmap, and insights to improve consistency.' },
              ].map((item, idx) => (
                <div key={idx} className={`rounded-2xl p-4 border-l-4 ${isDark ? 'bg-gray-900/40 border-cyan-500' : 'bg-blue-50/50 border-blue-500'}`}>
                  <dt className="font-bold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {item.title}
                  </dt>
                  <dd className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

          <section>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              📞 Contact & Support
            </h2>
            <div className={`rounded-2xl p-6 border-2 ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-lg leading-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div><strong className="text-cyan-500">📧 Email:</strong> support@skillswap.com</div>
                <div><strong className="text-cyan-500">📱 Phone:</strong> +91-XXXX-XXXX</div>
                <div><strong className="text-cyan-500">📍 Address:</strong> India</div>
                <div><strong className="text-cyan-500">⏰ Hours:</strong> 24/7 Support Available</div>
              </p>
            </div>
          </section>

          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

          <section>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              📦 Version
            </h2>
            <div className={`rounded-2xl p-6 border-2 ${isDark ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} flex items-center gap-4`}>
              <span className="text-3xl">⚡</span>
              <p className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                SkillSwap <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent font-bold">v1.0.0</span>
                <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
                  Active Build
                </span>
              </p>
            </div>
          </section>

          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

          <section>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              🔐 Compliance
            </h2>
            <dl className="space-y-4">
              {[
                { title: '🔒 Privacy:', desc: 'User data is protected and handled with access controls.' },
                { title: '📋 Terms:', desc: 'Platform usage follows clear usage, conduct, and access rules.' },
                { title: '💳 Payments:', desc: 'Subscription transactions are handled through secure payment providers.' },
              ].map((item, idx) => (
                <div key={idx} className={`rounded-2xl p-4 border-l-4 ${isDark ? 'bg-gray-900/40 border-cyan-500' : 'bg-blue-50/50 border-blue-500'}`}>
                  <dt className="font-bold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {item.title}
                  </dt>
                  <dd className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {item.desc}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Info
