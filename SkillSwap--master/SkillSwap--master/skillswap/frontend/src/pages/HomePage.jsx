import React, { useContext } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import skillswapLogo from '../assets/skillswap-logo.svg'

const HomePage = () => {
  const { isDark } = useContext(ThemeContext)
  const navigate = useNavigate()

  const featureRouteMap = {
    'Explore Courses': '/courses',
    'Interactive Notes': '/interactive-notes',
    'Track Progress': '/progress',
    'Earn Tokens': '/token-history',
    'Share Feedback': '/feedback',
    '24/7 Support': '/support',
  }

  const footerFeatureRouteMap = {
    'Browse Lectures': '/courses',
    'Subscription Plans': '/subscription',
    'Your Dashboard': '/dashboard',
    'Profile & Progress': '/profile',
  }

  const footerAboutRouteMap = {
    'About Us': '/about',
    'How It Works': '/how-it-works',
    'Platform Info': '/info',
    'News & Blog': '/blog',
    'Our Services': '/services',
  }

  const features = [
    {
      icon: '🧭',
      title: 'Explore Courses',
      desc: 'Browse curated courses across web, data, design, and more'
    },
    {
      icon: '💰',
      title: 'Earn Tokens',
      desc: 'Teach your skills and earn tokens for learning new ones'
    },
    {
      icon: '📊',
      title: 'Track Progress',
      desc: 'Monitor your learning journey with detailed analytics'
    },
    {
      icon: '🤝',
      title: '24/7 Support',
      desc: 'Get help anytime through chat, calls, or contact forms'
    },
    {
      icon: '📝',
      title: 'Interactive Notes',
      desc: 'Take and organize notes while watching lectures'
    },
    {
      icon: '💬',
      title: 'Share Feedback',
      desc: 'Help us improve by sharing your thoughts and suggestions'
    },
  ]

  const homeShowcaseImages = [
    {
      title: 'Focused Learning Sessions',
      desc: 'Structured digital learning experiences with guided outcomes.',
      src: 'https://picsum.photos/id/180/900/560',
    },
    {
      title: 'Collaborative Skill Sharing',
      desc: 'Learners and mentors collaborating in a practical ecosystem.',
      src: 'https://picsum.photos/id/20/900/560',
    },
    {
      title: 'Progress And Analytics',
      desc: 'Track growth with clear progress metrics and activity insights.',
      src: 'https://picsum.photos/id/119/900/560',
    },
    {
      title: 'Certificate And Achievement',
      desc: 'Celebrate completed learning milestones with course certificates.',
      src: 'https://picsum.photos/id/48/900/560',
    },
    {
      title: 'Mentor-Led Guidance',
      desc: 'Learn directly from experienced mentors and practitioners.',
      src: 'https://picsum.photos/id/64/900/560',
    },
    {
      title: 'Interactive Notes',
      desc: 'Capture key points and revise quickly with structured notes.',
      src: 'https://picsum.photos/id/1062/900/560',
    },
    {
      title: 'Project-Based Practice',
      desc: 'Apply concepts in mini projects for practical skill retention.',
      src: 'https://picsum.photos/id/3/900/560',
    },
    {
      title: 'Community Learning',
      desc: 'Grow together with feedback, discussion, and collaboration.',
      src: 'https://picsum.photos/id/29/900/560',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  }

  const heroVariants = {
    hidden: { opacity: 0, y: -40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 20, duration: 0.8 },
    },
  }

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 18, duration: 0.6 },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 18, duration: 0.6 },
    },
  }

  return (
    <motion.div
      className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.div
        className={`${isDark ? 'bg-gray-800' : 'hero-gradient-animated'} text-white py-20 relative overflow-hidden`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Hero Base Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/id/1015/2200/1400"
            alt=""
            className="w-full h-full object-cover opacity-45"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/35 via-blue-500/30 to-indigo-700/45" />
        </div>

        {/* Animated Blobs */}
        <motion.div
          className="absolute -top-10 left-1/4 w-60 h-60 rounded-full bg-blue-400/30 blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10, delay: 1 }}
        />

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-white/15 border border-white/30 mb-5 backdrop-blur-ui"
          >
            <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 3 }}>
              ✨
            </motion.span>
            <span>Modern Peer Learning Platform</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={heroVariants} initial="hidden" animate="show">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 animated-gradient-text inline-block w-full">
              Welcome to SkillSwap
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-2xl mb-8 text-blue-50"
          >
            Learn new skills today, teach your expertise tomorrow
          </motion.p>

          {/* Platform Description */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20, duration: 0.8 }}
            className="mb-10 -mx-4 md:-mx-8 lg:-mx-12"
          >
            <motion.div
              className="glass-modern relative overflow-hidden p-12 md:p-16 lg:p-20 text-white shadow-2xl rounded-2xl"
              whileHover={{ scale: 1.01, boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/45 via-blue-500/35 to-indigo-700/50" />

              <div className="relative z-10 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-4xl md:text-5xl font-extrabold mb-10 text-center animated-gradient-text slide-underline inline-block w-full"
                >
                  About SkillSwap Platform
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="space-y-6 stagger-reveal"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="mb-10 leading-loose text-xl md:text-2xl font-medium fade-up"
                  >
                    <strong className="font-bold animated-gradient-text">SkillSwap – Peer to Peer Learning Platform</strong> is a digital learning and educational management platform designed to facilitate peer-to-peer knowledge sharing and skill development. SkillSwap functions as a centralized online system that enables registered users to efficiently access, deliver, and manage educational content, including online and pre-recorded lectures, learning tasks, and progress tracking.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
                    className="mb-10 leading-loose text-xl md:text-2xl font-medium fade-up"
                  >
                    The platform allows individual learners and peer educators to securely register, create profiles, and participate in skill-based learning activities using a <strong className="font-bold animated-gradient-text">token-based learning mechanism</strong>. SkillSwap supports the exchange of learning tokens between students and teachers, enabling a balanced and transparent learning ecosystem. Users can search lectures, view teacher profiles, attend online courses, and utilize integrated tools such as notes writing, feedback submission, and customer support services.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
                    className="mb-10 leading-loose text-xl md:text-2xl font-medium fade-up"
                  >
                    All user activities, including lecture access, token transactions, subscription details, and learning progress, are recorded and managed through the system in real-time. The collected data is securely stored and processed through the backend infrastructure and monitored through user-level and administrative controls to ensure accuracy, transparency, and reliability.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
                    className="leading-loose text-xl md:text-2xl font-medium fade-up"
                  >
                    This makes SkillSwap a <strong className="font-bold animated-gradient-text">scalable and efficient learning management platform</strong> that supports structured peer-based education and serves as a comprehensive system for skill development, learning analytics, and academic engagement in a digital environment.
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 200, damping: 18, duration: 0.7 }}
          >
            <motion.button
              onClick={() => navigate('/courses')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-xl"
              whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Get Started
            </motion.button>
            <motion.button
              onClick={() => navigate('/how-it-works')}
              className="border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition shadow-lg"
              whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              📚 Learn More
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-20 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-6 left-1/4 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl"></div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`text-3xl md:text-4xl font-bold text-center mb-12 fade-up ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Why Choose SkillSwap?
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => (
            <motion.button
              key={idx}
              type="button"
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.018 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              onClick={() => {
                const route = featureRouteMap[feature.title]
                if (route) {
                  navigate(route)
                }
              }}
              style={{ backfaceVisibility: 'hidden' }}
              className={`group rounded-2xl p-8 text-center smooth-transform opacity-transition feature-card-enhanced border cursor-pointer w-full ${
                isDark ? 'bg-gray-800/90 border-gray-700/50' : 'bg-white/95 border-gray-200'
              } shadow-lg hover:shadow-2xl`}
            >
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}
                className="text-4xl mb-4 micro-bounce transition-transform duration-300 group-hover:scale-125 group-hover:-translate-y-1"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-bold mb-2 slide-underline inline-block">{feature.title}</h3>
              <p className={`${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} opacity-transition`}>
                {feature.desc}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* End Showcase Images */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="relative">
          {/* Decorative blobs for left and right sides */}
          <motion.div
            className="absolute -left-24 top-16 w-60 h-60 rounded-full bg-blue-400/20 blur-3xl z-0"
            animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 10 }}
          />
          <motion.div
            className="absolute -right-24 top-32 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl z-0"
            animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 12, delay: 1 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`rounded-3xl p-6 md:p-8 border shadow-xl relative z-10 ${isDark ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              SkillSwap In Action
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              A quick visual look at how SkillSwap supports learning, mentoring, progress tracking, and achievement.
            </p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory"
            >
              {homeShowcaseImages.map((item) => (
                <motion.figure
                  key={item.title}
                  variants={cardVariants}
                  whileHover={{ y: -6 }}
                  className={`min-w-[290px] sm:min-w-[320px] lg:min-w-[340px] rounded-2xl overflow-hidden border snap-start ${isDark ? 'border-gray-700 bg-gray-900/70' : 'border-gray-200 bg-gray-50'} shadow-lg`}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = skillswapLogo
                      event.currentTarget.classList.remove('object-cover')
                      event.currentTarget.classList.add('object-contain')
                      event.currentTarget.classList.add('p-6')
                    }}
                  />
                  <figcaption className="p-4">
                    <p className="font-semibold mb-1">{item.title}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                  </figcaption>
                </motion.figure>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer - About Section */}
      <motion.footer
        className="bg-[#1c3a57] text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {/* Mission Statement */}
            <motion.div
              className="md:col-span-1"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
            >
              <p className="text-gray-300 mb-4">
                Our mission is to provide a peer-to-peer skill-sharing platform where knowledge is exchanged through tokens.
              </p>
              <p className="text-gray-300 mb-4">
                SkillSwap is dedicated to democratizing education through community-driven learning.
              </p>
              <div className="flex gap-4">
                <motion.a href="/contact" className="text-blue-300 slide-underline" whileHover={{ scale: 1.05 }}>
                  Contact Us
                </motion.a>
                <span className="text-gray-400">|</span>
                <motion.a href="/feedback" className="text-blue-300 slide-underline" whileHover={{ scale: 1.05 }}>
                  Feedback
                </motion.a>
              </div>
            </motion.div>

            {/* About Links */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } },
              }}
            >
              <h3 className="font-bold text-lg mb-4">About</h3>
              <ul className="space-y-2">
                {['About Us', 'How It Works', 'Platform Info', 'News & Blog', 'Our Services'].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <a href={footerAboutRouteMap[item] || `/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-300 hover:text-white slide-underline">
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact & Support */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
              }}
            >
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2">
                <motion.li whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <a href="/contact" className="text-gray-300 hover:text-white slide-underline">
                    Help Center
                  </a>
                </motion.li>
                <li className="text-gray-300">📧 Email: support@skillswap.com</li>
                <li className="text-gray-300">📱 Phone: +91-XXXX-XXXX</li>
              </ul>
            </motion.div>

            {/* Courses/Features */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } },
              }}
            >
              <h3 className="font-bold text-lg mb-4">Features</h3>
              <ul className="space-y-2">
                {['Browse Lectures', 'Subscription Plans', 'Your Dashboard', 'Profile & Progress'].map((item, idx) => (
                  <motion.li key={idx} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <a href={footerFeatureRouteMap[item] || `/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-300 hover:text-white slide-underline">
                      {item}
                    </a>
                  </motion.li>
                ))}
                <li className="text-gray-300">🎥 Live Classes</li>
                <li className="text-gray-300">📝 Notes & Resources</li>
                <li className="text-gray-300">💰 Token System</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div
            className="border-t border-gray-600 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 SkillSwap. All rights reserved. | Made with ❤️ in India
            </div>
            <div className="text-gray-400 text-sm">
              Language: English | Country: 🇮🇳 India
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </motion.div>
  )
}

export default HomePage
