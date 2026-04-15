import React, { useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { ThemeContext } from './context/ThemeContext'
import Navbar from './components/Navbar'
import SupportWidget from './components/SupportWidget'

import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardPage from './pages/DashboardPage'
import Lectures from './pages/Lectures'
import LectureStreaming from './pages/LectureStreaming'
import InteractiveNotes from './pages/InteractiveNotes'
import LecturePlayer from './pages/LecturePlayer'
import CourseListing from './pages/CourseListing'
import CoursePage from './pages/CoursePage'
import Subscription from './pages/Subscription'
import Contact from './pages/Contact'
import Invite from './pages/Invite'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Services from './pages/Services'
import Blog from './pages/Blog'
import Info from './pages/Info'
import Features from './pages/Features'
import Feedback from './pages/Feedback'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import ProgressPage from './pages/ProgressPage'
import TokenHistoryPage from './pages/TokenHistoryPage'
import Support247 from './pages/Support247'
import LearnAnything from './pages/LearnAnything'
import SkillDetail from './pages/SkillDetail'
import MySessions from './pages/MySessions'
import BecomeaMentor from './pages/BecomeaMentor'
import MentorProfile from './pages/MentorProfile'
import VideoUpload from './pages/VideoUpload'
import VideoList from './pages/VideoList'
import VideoPlayer from './pages/VideoPlayer'
import AdminVideoPanel from './pages/AdminVideoPanel'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext)

  if (loading) return <div>Loading...</div>
  return isAuthenticated ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext)

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" />

  const isAllowed = user?.role === 'admin'
  return isAllowed ? children : <Navigate to="/videos" />
}

const AppRoutes = () => {
  const { isAuthenticated } = useContext(AuthContext)
  const { isDark } = useContext(ThemeContext)
  const location = useLocation()
  const navigate = useNavigate()
  const hideBackBar =
    location.pathname === '/' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register')

  const handleGlobalBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }

    if (isAuthenticated) {
      navigate('/')
      return
    }

    navigate('/login')
  }

  return (
    <div className="site-bg-animated min-h-screen relative overflow-hidden">
      <div className="site-bg-mandala" />
      <div className="site-bg-layer site-bg-layer-one" />
      <div className="site-bg-layer site-bg-layer-two" />
      <div className="site-bg-orb site-bg-orb-one" />
      <div className="site-bg-orb site-bg-orb-two" />
      <div className="site-bg-wave" />
      <div className="site-bg-grid" />
      <div className="site-bg-vignette" />

      <div className="relative z-30">
        {isAuthenticated && <Navbar />}
        {isAuthenticated && <SupportWidget />}

        {!hideBackBar && (
          <div className={`${isDark ? 'bg-slate-900/55 border-b border-white/10' : 'bg-white/80 border-b border-slate-200'} backdrop-blur-md`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-start">
              <button
                type="button"
                onClick={handleGlobalBack}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
                  isDark
                    ? 'bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                    : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                }`}
                title="Go back"
              >
                <span aria-hidden="true">←</span>
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        <div key={location.pathname} className="page-transition-fade">
      <Routes>
        {/* Public Routes - Only accessible before login */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

        {/* Home Route - Redirect to login if not authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Routes - Only accessible after login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lectures"
          element={
            <ProtectedRoute>
              <Lectures />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecture-streaming"
          element={
            <ProtectedRoute>
              <LectureStreaming />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interactive-notes"
          element={
            <ProtectedRoute>
              <InteractiveNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecture/:id"
          element={
            <ProtectedRoute>
              <LecturePlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CourseListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/how-it-works"
          element={
            <ProtectedRoute>
              <HowItWorks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invite"
          element={
            <ProtectedRoute>
              <Invite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog"
          element={
            <ProtectedRoute>
              <Blog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/info"
          element={
            <ProtectedRoute>
              <Info />
            </ProtectedRoute>
          }
        />
        <Route
          path="/features"
          element={
            <ProtectedRoute>
              <Features />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <PublicProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/user/:userId"
          element={
            <ProtectedRoute>
              <PublicProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/token-history"
          element={
            <ProtectedRoute>
              <TokenHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support247 />
            </ProtectedRoute>
          }
        />

        {/* Peer-to-Peer Learning Routes */}
        <Route
          path="/learn-anything"
          element={
            <ProtectedRoute>
              <LearnAnything />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill/:id"
          element={
            <ProtectedRoute>
              <SkillDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/become-mentor"
          element={
            <ProtectedRoute>
              <BecomeaMentor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-sessions"
          element={
            <ProtectedRoute>
              <MySessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/:mentorId"
          element={
            <ProtectedRoute>
              <MentorProfile />
            </ProtectedRoute>
          }
        />

        {/* Video Routes */}
        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <VideoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/:id"
          element={
            <ProtectedRoute>
              <VideoPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-video"
          element={
            <ProtectedRoute>
              <VideoUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/videos"
          element={
            <AdminRoute>
              <AdminVideoPanel />
            </AdminRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
