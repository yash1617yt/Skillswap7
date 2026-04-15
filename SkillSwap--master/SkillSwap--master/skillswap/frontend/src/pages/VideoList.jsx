import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeContext } from '../context/ThemeContext'
import { AuthContext } from '../context/AuthContext'
import { useWebSocket } from '../context/WebSocketContext'
import videoService from '../services/videoService'

const VideoList = () => {
  const { isDark } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)
  const { socket, connected } = useWebSocket()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTokenVideos, setShowTokenVideos] = useState(searchParams.get('filter') === 'tokens')
  const [filters, setFilters] = useState({
    search: '',
    skillTag: '',
    level: '',
    location: '',
    isTeacher: '',
    visibility: '',
  })

  const canSeeUploadButton = Boolean(user)
  const MotionLink = motion(Link)

  // Load videos
  const loadVideos = async () => {
    try {
      setLoading(true)
      const response = await videoService.getAllVideos(filters)
      setVideos(response.data.videos)
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [filters])

  // Real-time WebSocket updates
  useEffect(() => {
    if (!socket || !connected) return

    // New video uploaded
    socket.on('video:new', (data) => {
      console.log('New video uploaded:', data)
      setVideos(prev => [data.video, ...prev])
    })

    // Video updated
    socket.on('video:updated', (data) => {
      console.log('Video updated:', data)
      setVideos(prev =>
        prev.map(video =>
          video.id === data.videoId ? { ...video, ...data.video } : video
        )
      )
    })

    // Video deleted
    socket.on('video:deleted', (data) => {
      console.log('Video deleted:', data)
      setVideos(prev => prev.filter(video => video.id !== data.videoId))
    })

    return () => {
      socket.off('video:new')
      socket.off('video:updated')
      socket.off('video:deleted')
    }
  }, [socket, connected])

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value })
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 20, duration: 0.7 },
    },
  }

  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 240, damping: 18 },
    },
  }

  const filterItemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  }

  return (
    <motion.div
      className="relative min-h-screen text-white py-8 px-4 fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 fade-up"
          variants={sectionVariants}
          initial="hidden"
          animate="show"
        >
          <div>
            <motion.h1
              className="text-4xl font-bold mb-2"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.08 }}
              style={{ textShadow: '0 0 28px rgba(59,130,246,0.28)' }}
            >
              Video Library
            </motion.h1>
            <motion.div
              className="h-1 w-28 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 mb-3"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 112, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.18 }}
            />
            <motion.p
              className="text-gray-400"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Learn from expert-created content
            </motion.p>
            {connected && (
              <motion.p
                className="text-xs text-green-400 mt-1"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                🟢 Live - Real-time updates enabled
              </motion.p>
            )}
          </div>
          {canSeeUploadButton && (
            <motion.button
              onClick={() => navigate('/upload-video')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105 transition ripple-effect gradient-glow shine-sweep smooth-transform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.2 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              📤 Upload Video
            </motion.button>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 slide-down shadow-xl shadow-blue-900/20"
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.08 }}
        >
          <motion.div
            className="grid grid-cols-1 md:grid-cols-7 gap-4"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {/* Search */}
            <motion.input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search videos..."
              className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none opacity-transition smooth-transform"
              variants={filterItemVariants}
              whileFocus={{ scale: 1.01 }}
            />

            {/* Skill Tag */}
            <motion.input
              type="text"
              name="skillTag"
              value={filters.skillTag}
              onChange={handleFilterChange}
              placeholder="Filter by skill..."
              className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none opacity-transition smooth-transform"
              variants={filterItemVariants}
              whileFocus={{ scale: 1.01 }}
            />

            {/* Level */}
            <motion.select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none opacity-transition smooth-transform"
              variants={filterItemVariants}
              whileFocus={{ scale: 1.01 }}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </motion.select>

            <motion.input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Location..."
              className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none opacity-transition smooth-transform"
              variants={filterItemVariants}
              whileFocus={{ scale: 1.01 }}
            />

            <motion.select
              name="isTeacher"
              value={filters.isTeacher}
              onChange={handleFilterChange}
              className="bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none opacity-transition smooth-transform"
              variants={filterItemVariants}
              whileFocus={{ scale: 1.01 }}
            >
              <option value="">All Uploaders</option>
              <option value="true">Mentors Only</option>
              <option value="false">Learners Only</option>
            </motion.select>

            {/* Token Videos Filter */}
            <motion.button
              onClick={() => setShowTokenVideos(!showTokenVideos)}
              className={`rounded-lg px-4 py-2 font-semibold transition smooth-transform hover-scale ripple-effect ${
                showTokenVideos
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              variants={filterItemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              💎 Token Videos {showTokenVideos && '✓'}
            </motion.button>

            {/* Clear Filters */}
            <motion.button
              onClick={() => {
                setFilters({ search: '', skillTag: '', level: '', location: '', isTeacher: '', visibility: '' })
                setShowTokenVideos(false)
              }}
              className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 font-semibold transition smooth-transform hover-scale ripple-effect"
              variants={filterItemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Videos Grid */}
        {loading ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-blue-400/30 border-t-blue-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
            </motion.div>
            <p className="text-gray-400">Loading videos...</p>
          </motion.div>
        ) : (() => {
          const filteredVideos = showTokenVideos 
            ? videos.filter(video => video.tokensRequired > 0)
            : videos
          
          return filteredVideos.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="text-6xl mb-4">📹</div>
              <p className="text-gray-400 mb-4">
                {showTokenVideos ? 'No token videos found' : 'No videos found'}
              </p>
              {canSeeUploadButton && (
                <motion.button
                  onClick={() => navigate('/upload-video')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Upload Your First Video
                </motion.button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${showTokenVideos}-${filters.search}-${filters.skillTag}-${filters.level}`}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-reveal"
                variants={gridVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 10, filter: 'blur(4px)', transition: { duration: 0.2 } }}
              >
                {filteredVideos.map((video) => (
                <MotionLink
                  key={video.id}
                  to={`/videos/${video.id}`}
                  className="group backdrop-blur-2xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/60 transition-all smooth-transform shadow-lg shadow-blue-900/20"
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.015, boxShadow: '0 26px 70px rgba(59,130,246,0.28)' }}
                  whileTap={{ scale: 0.99 }}
                >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎥
                    </div>
                  )}
                  
                  {/* Duration Badge */}
                  {video.duration > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold">
                      {formatDuration(video.duration)}
                    </div>
                  )}

                  {/* Premium Badge */}
                  {video.visibility === 'premium' && (
                    <div className="absolute top-2 right-2 bg-yellow-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                      💎 {video.tokensRequired} tokens
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45">
                    <motion.div
                      className="w-16 h-16 bg-blue-600/90 rounded-full flex items-center justify-center text-2xl"
                      initial={{ scale: 0.86 }}
                      whileHover={{ scale: 1.06 }}
                    >
                      ▶
                    </motion.div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition slide-underline">
                    {video.title}
                  </h3>

                  {/* Uploader */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {video.uploader?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm text-gray-400">{video.uploader?.name || 'Unknown'}</span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>👁 {video.views || 0} views</span>
                    <span>❤️ {video.likes || 0} likes</span>
                  </div>

                  {/* Skill Tag & Level */}
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold">
                      {video.skillTag}
                    </span>
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-semibold">
                      {video.level}
                    </span>
                  </div>
                </div>
                </MotionLink>
                ))}
              </motion.div>
            </AnimatePresence>
          )
        })()}
      </div>
    </motion.div>
  )
}

export default VideoList
