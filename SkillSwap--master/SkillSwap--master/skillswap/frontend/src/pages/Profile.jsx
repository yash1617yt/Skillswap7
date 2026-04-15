import React, { useContext, useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import { AuthContext } from '../context/AuthContext'
import html2pdf from 'html2pdf.js'
import userService from '../services/userService'
import videoService from '../services/videoService'
import { loadActivityLog, logCourseCompletion as logCourseCompletionToStore, logTokenUsage as logTokenUsageToStore } from '../utils/activityStore'
const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney'
]

const getTimezoneOptions = () => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const supportedTimezones = Intl.supportedValuesOf('timeZone')
      if (supportedTimezones?.length) {
        return supportedTimezones
      }
    }
  } catch {
    return FALLBACK_TIMEZONES
  }
  return FALLBACK_TIMEZONES
}

const getDetectedTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

const getSafeTimezone = (timezone) => {
  if (!timezone) return getDetectedTimezone()
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return timezone
  } catch {
    return getDetectedTimezone()
  }
}

const formatTimezoneLabel = (timezone) => {
  const safeTimezone = getSafeTimezone(timezone)
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: safeTimezone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(new Date())
    const offset = parts.find(part => part.type === 'timeZoneName')?.value
    return offset ? `${safeTimezone} (${offset})` : safeTimezone
  } catch {
    return safeTimezone
  }
}

const getTimeForTimezone = (timezone) => {
  const safeTimezone = getSafeTimezone(timezone)
  try {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: safeTimezone
    })
  } catch {
    return new Date().toLocaleTimeString()
  }
}

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getHeatmapLevel = (entry) => {
  if (!entry) return 0

  const timeSpent = Number(entry.timeSpent || 0)
  const coursesCompleted = Number(entry.coursesCompleted || 0)
  const tokensUsed = Number(entry.tokensUsed || 0)
  const tokensEarned = Number(entry.tokensEarned || 0)
  const activityScore = timeSpent + (coursesCompleted * 1.5) + ((tokensUsed + tokensEarned) / 50)

  if (activityScore <= 0) return 0
  if (activityScore < 1.5) return 1
  if (activityScore < 3) return 2
  if (activityScore < 5) return 3
  return 4
}

const normalizeAiInsights = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { strengths: '', suggestions: '', careerPath: '' }
  }

  return {
    strengths: typeof value.strengths === 'string' ? value.strengths : '',
    suggestions: typeof value.suggestions === 'string' ? value.suggestions : '',
    careerPath: typeof value.careerPath === 'string' ? value.careerPath : '',
  }
}

const hasAiInsightsContent = (value) => {
  const normalized = normalizeAiInsights(value)
  return [normalized.strengths, normalized.suggestions, normalized.careerPath].every((item) => item.trim().length > 5)
}

const toProfileSlug = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const buildAboutDataSnapshot = (source = {}, fallback = {}) => ({
  role: source.profileTitle || source.role || fallback.role || 'Full Stack Developer',
  firstName: source.firstName || fallback.firstName || '',
  lastName: source.lastName || fallback.lastName || '',
  displayName: source.displayName || fallback.displayName || '',
  bio: source.bio || fallback.bio || '',
  location: source.location || fallback.location || '',
  tagline: source.tagline || fallback.tagline || '',
  website: source.website || fallback.website || '',
  whatsapp: source.whatsapp || fallback.whatsapp || '',
  telegram: source.telegram || fallback.telegram || '',
  language: source.language || fallback.language || '',
  timezone: getSafeTimezone(source.timezone || fallback.timezone || getDetectedTimezone()),
  joinedDate: source.joinedDate || fallback.joinedDate || '',
})

const Profile = () => {
  const { isDark, toggleTheme, lightTheme, setLightTheme, lightThemes } = useContext(ThemeContext)
  const { user, updateUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Read tab from URL query parameters
  const tabFromUrl = searchParams.get('tab')
  const aiFromUrl = searchParams.get('ai')
  
  // State management
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [savedAboutData, setSavedAboutData] = useState(null)
  const [timezoneOptions] = useState(() => getTimezoneOptions())
  const [currentLocalTime, setCurrentLocalTime] = useState(() => getTimeForTimezone(getDetectedTimezone()))
  const [bioExpanded, setBioExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [triggerAiGenerationFromUrl, setTriggerAiGenerationFromUrl] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [profileSearchName, setProfileSearchName] = useState('')
  const [profileSearchError, setProfileSearchError] = useState('')
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [uploadedVideosCount, setUploadedVideosCount] = useState(0)
  const [ownerVideos, setOwnerVideos] = useState([])
  const [ownerVideosLoading, setOwnerVideosLoading] = useState(false)
  const [ownerVideosError, setOwnerVideosError] = useState('')
  const [editingVideoId, setEditingVideoId] = useState(null)
  const [editingVideoData, setEditingVideoData] = useState({ title: '', skillTag: '', visibility: 'public' })
  const [savingVideoId, setSavingVideoId] = useState(null)
  const [deletingVideoId, setDeletingVideoId] = useState(null)
  const [showConnections, setShowConnections] = useState(false)
  const [connectionsTab, setConnectionsTab] = useState('followers')
  const [connections, setConnections] = useState([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [connectionsError, setConnectionsError] = useState('')
  
  // AI Insights editing state - Start with empty strings
  const [isEditingAI, setIsEditingAI] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiGenerationError, setAiGenerationError] = useState('')
  const aiPanelRef = useRef(null)
  const profilePictureInputRef = useRef(null)
  const [aiInsights, setAiInsights] = useState({ strengths: '', suggestions: '', careerPath: '' })

  // Skills management state
  const [isEditingSkills, setIsEditingSkills] = useState(false)
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, color: '#3B82F6' })
  const [editingSkillId, setEditingSkillId] = useState(null)

  // Social Links editing state
  const [isEditingSocial, setIsEditingSocial] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    twitter: '',
    portfolio: ''
  })

  // Projects management state
  const [isEditingProjects, setIsEditingProjects] = useState(false)
  const [projects, setProjects] = useState([])
  const [newProject, setNewProject] = useState({ title: '', tech: '', image: '', liveUrl: '', githubUrl: '' })
  const [editingProjectId, setEditingProjectId] = useState(null)

  // Real Activity Tracking State
  const [activityLog, setActivityLog] = useState(() => loadActivityLog())
  const normalizedActivityLog = useMemo(() => {
    const aggregatedByDate = new Map()

    ;(Array.isArray(activityLog) ? activityLog : []).forEach((entry) => {
      const date = typeof entry?.date === 'string' ? entry.date : null
      if (!date) return

      const current = aggregatedByDate.get(date) || {
        date,
        coursesCompleted: 0,
        timeSpent: 0,
        tokensEarned: 0,
        tokensUsed: 0
      }

      current.coursesCompleted += Number(entry?.coursesCompleted || 0)
      current.timeSpent += Number(entry?.timeSpent || 0)
      current.tokensEarned += Number(entry?.tokensEarned || 0)
      current.tokensUsed += Number(entry?.tokensUsed || 0)

      aggregatedByDate.set(date, current)
    })

    return Array.from(aggregatedByDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [activityLog])

  // Privacy & Access Control
  const [isOwnProfile] = useState(true) // This is user's own profile
  const [viewerIsOwner] = useState(true) // Viewer is the profile owner

  // Function to check if content should be visible
  const canViewContent = () => {
    if (viewerIsOwner) return true // Owner can always see their own profile
    if (profileVisibility === 'public') return true
    if (profileVisibility === 'private') return false
    return false
  }

  // Get privacy description
  const getPrivacyDescription = (level) => {
    switch(level) {
      case 'public':
        return '🌐 Everyone can see your profile'
      case 'private':
        return '🔒 Only you can see your profile'
      default:
        return ''
    }
  }

  // Copy profile link to clipboard
  const copyProfileLink = () => {
    const link = `${window.location.origin}/profile/${user?.id || 'profile'}`
    navigator.clipboard.writeText(link)
    alert('Profile link copied to clipboard!')
  }

  const handleProfileSearch = async (e) => {
    e.preventDefault()
    const query = profileSearchName.trim()

    if (!query) {
      setProfileSearchError('Enter a profile name to search')
      return
    }

    try {
      const response = await userService.searchProfiles(query)
      const profiles = response?.data?.profiles || []

      if (profiles.length > 0 && profiles[0]?.id) {
        setProfileSearchError('')
        navigate(`/profile/user/${profiles[0].id}`)
        return
      }
    } catch {
    }

    const slug = toProfileSlug(query)
    if (!slug) {
      setProfileSearchError('Invalid candidate')
      return
    }

    setProfileSearchError('')
    navigate(`/profile/${slug}`)
  }

  const loadConnections = async (type = 'followers') => {
    setConnectionsLoading(true)
    setConnectionsError('')

    try {
      const response = type === 'following'
        ? await userService.getFollowing(user?.id)
        : await userService.getFollowers(user?.id)
      setConnections(response?.data?.users || [])
    } catch (error) {
      setConnections([])
      setConnectionsError(error?.response?.data?.message || 'Unable to load list right now')
    } finally {
      setConnectionsLoading(false)
    }
  }

  const openConnections = async (type) => {
    setConnectionsTab(type)
    setShowConnections(true)
    await loadConnections(type)
  }

  // Download profile as PDF
  const downloadProfilePDF = async () => {
    const escapeHtml = (value = '') => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    const sanitizeColor = (value = '#3b82f6') => {
      const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
      return validHex.test(value) ? value : '#3b82f6'
    }
    const truncateText = (value = '', limit = 140) => {
      const normalized = String(value || '').trim()
      if (!normalized) return ''
      return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized
    }

    let pdfContainer

    try {
      pdfContainer = document.createElement('div')
      pdfContainer.style.padding = '18px'
      pdfContainer.style.background = '#f2f4f8'
      pdfContainer.style.color = '#1e293b'
      pdfContainer.style.fontFamily = 'Segoe UI, Arial, sans-serif'
      pdfContainer.style.width = '794px'
      pdfContainer.style.minHeight = '1123px'

      const safeName = escapeHtml(formData.name || 'User')
      const safeUsername = escapeHtml(formData.username || '')
      const safeRole = escapeHtml(formData.role || '')
      const safeBio = escapeHtml(formData.bio || '')
      const safeLocation = escapeHtml(formData.location || '')
      const safeLanguage = escapeHtml(formData.language || '')
      const safeTimezone = escapeHtml(formatTimezoneLabel(formData.timezone) || '')
      const safeVisibility = escapeHtml(profileVisibility || 'public')
      const initials = escapeHtml((formData.name || 'U').trim().charAt(0).toUpperCase())
      const avatarUrl = formData.profilePicture || user?.profilePicture || user?.avatar || user?.profileImage || user?.photoURL || ''
      const safeAvatarUrl = avatarUrl ? escapeHtml(avatarUrl) : ''
      const totalTokens = Number(user?.tokens || 0)
      const completedCount = Number(user?.lecturesCompleted || 0)
      const safeCompletion = Math.max(0, Math.min(100, Number(profileCompletion) || 0))
      const safeTagline = escapeHtml(formData.tagline || 'Passionate learner and builder')
      const safeJoinedDate = escapeHtml(formData.joinedDate || 'N/A')
      const strongestSkill = getStrongestSkill()
      const weakestSkill = getWeakestSkill()
      const avgSkill = calculateAvgSkillLevel()

      const safeStrengths = escapeHtml(truncateText(aiInsights.strengths, 120) || 'Strong consistency in building practical projects and learning new technologies.')
      const safeSuggestions = escapeHtml(truncateText(aiInsights.suggestions, 120) || 'Focus on deeper system design and production-ready architecture practices.')
      const safeCareerPath = escapeHtml(truncateText(aiInsights.careerPath, 120) || 'Progressing toward an advanced full-stack engineering role with leadership potential.')

      const skillsMarkup = (skills || [])
        .slice(0, 6)
        .map((skill) => {
          const level = Math.max(0, Math.min(100, Number(skill.level) || 0))
          const color = sanitizeColor(skill.color)
          return `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <div style="width:28px; height:28px; border-radius:8px; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${escapeHtml((skill.name || 'S').charAt(0).toUpperCase())}</div>
              <div style="width:140px; font-size:14px; color:#334155;">${escapeHtml(skill.name || 'Skill')}</div>
              <div style="flex:1; height:14px; background:#dbe2ea; border-radius:999px; overflow:hidden;">
                <div style="width:${level}%; height:100%; background:linear-gradient(90deg, #60a5fa, #3b82f6);"></div>
              </div>
              <div style="width:44px; text-align:right; font-size:14px; color:#0f172a;">${level}%</div>
            </div>
          `
        })
        .join('')

      const projectsMarkup = (projects || [])
        .slice(0, 6)
        .map((project) => {
          const techList = Array.isArray(project.tech) ? project.tech.join(', ') : (project.tech || '')
          return `
            <div style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:30px; height:30px; border-radius:8px; background:#eef2ff; color:#1d4ed8; display:flex; align-items:center; justify-content:center; font-size:16px;">${escapeHtml(project.image || '•')}</div>
                <div>
                  <div style="font-size:16px; font-weight:700; color:#1e293b;">${escapeHtml(project.title || 'Project')}</div>
                  <div style="font-size:14px; color:#64748b;">${escapeHtml(techList || '-')}</div>
                </div>
              </div>
            </div>
          `
        })
        .join('')

      const connectItems = [
        { label: 'G', value: socialLinks.github },
        { label: 'in', value: socialLinks.linkedin },
        { label: 'X', value: socialLinks.twitter },
        { label: '↗', value: socialLinks.portfolio },
      ]

      const connectMarkup = connectItems
        .filter((item) => item.value)
        .map((item) => `
          <div style="width:38px; height:38px; border-radius:999px; background:linear-gradient(135deg,#2563eb,#60a5fa); color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center;">${escapeHtml(item.label)}</div>
        `)
        .join('')

      const contactRows = [
        { label: 'GitHub', value: socialLinks.github },
        { label: 'LinkedIn', value: socialLinks.linkedin },
        { label: 'Twitter', value: socialLinks.twitter },
        { label: 'Portfolio', value: socialLinks.portfolio },
      ]
      const contactsMarkup = contactRows
        .filter((row) => row.value)
        .map((row) => `<div style="margin-bottom:4px;"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</div>`)
        .join('')

      pdfContainer.innerHTML = `
        <div style="max-width:758px; margin:0 auto; background:#fff; border:1px solid #d9e0ea; border-radius:18px; padding:22px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:20px;">
            <div style="display:flex; align-items:flex-start; gap:18px; flex:1;">
              <div style="width:90px; height:90px; border-radius:999px; border:3px solid #60a5fa; background:linear-gradient(140deg,#93c5fd,#3b82f6); color:#fff; font-size:34px; font-weight:700; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                ${safeAvatarUrl ? `<img src="${safeAvatarUrl}" alt="Profile" style="width:100%; height:100%; object-fit:cover;"/>` : initials}
              </div>
              <div style="flex:1; min-width:0;">
                <h1 style="margin:0; font-size:34px; line-height:1.1; color:#1f2a44;">${safeName}</h1>
                <p style="margin:4px 0 6px; color:#64748b; font-size:20px;">@${safeUsername}</p>
                <p style="margin:0 0 6px; font-size:24px; color:#0f172a; font-weight:700;">${safeRole}</p>
                <p style="margin:0; color:#475569; font-size:16px; line-height:1.4;">${safeBio}</p>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; min-width:130px;">
              <div style="padding:8px 10px; border-radius:10px; background:#eff6ff; border:1px solid #bfdbfe; text-align:center;">
                <div style="font-size:11px; color:#1e40af;">TOKENS</div>
                <div style="font-size:16px; font-weight:700; color:#1d4ed8;">${totalTokens}</div>
              </div>
              <div style="padding:8px 10px; border-radius:10px; background:#f5f3ff; border:1px solid #ddd6fe; text-align:center;">
                <div style="font-size:11px; color:#5b21b6;">COMPLETED</div>
                <div style="font-size:16px; font-weight:700; color:#6d28d9;">${completedCount}</div>
              </div>
              <div style="padding:8px 10px; border-radius:10px; background:#ecfeff; border:1px solid #a5f3fc; text-align:center;">
                <div style="font-size:11px; color:#0e7490;">PROFILE</div>
                <div style="font-size:16px; font-weight:700; color:#0891b2;">${safeCompletion}%</div>
              </div>
            </div>
          </div>

          <div style="margin:14px 0 0; padding-top:10px; border-top:1px solid #e2e8f0; color:#64748b; font-size:14px;">
            📍 ${safeLocation} &nbsp; | &nbsp; 🗨️ ${safeLanguage} &nbsp; | &nbsp; 🕒 ${safeTimezone}
          </div>

          <div style="margin-top:6px; color:#64748b; font-size:13px;">🔒 Visibility: ${safeVisibility}</div>
          <div style="margin-top:4px; color:#475569; font-size:13px;">✨ ${safeTagline}</div>

          <div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:14px; display:grid; grid-template-columns:1.2fr 1fr; gap:16px;">
            <div style="padding-right:18px; border-right:1px solid #e2e8f0;">
              <h2 style="margin:0 0 10px; font-size:20px; color:#1f2a44;">Skills</h2>
              ${skillsMarkup || '<div style="font-size:16px; color:#64748b;">No skills added</div>'}
              <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                <span style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:999px; padding:4px 8px; font-size:11px;">Avg Skill: ${avgSkill}%</span>
                <span style="background:#ecfeff; color:#0e7490; border:1px solid #a5f3fc; border-radius:999px; padding:4px 8px; font-size:11px;">Top: ${escapeHtml(strongestSkill?.name || 'N/A')}</span>
                <span style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; border-radius:999px; padding:4px 8px; font-size:11px;">Focus: ${escapeHtml(weakestSkill?.name || 'N/A')}</span>
              </div>
            </div>
            <div>
              <h2 style="margin:0 0 10px; font-size:20px; color:#1f2a44;">Projects</h2>
              ${projectsMarkup || '<div style="font-size:16px; color:#64748b;">No projects added</div>'}

              <h3 style="margin:12px 0 8px; font-size:17px; color:#1f2a44;">Connect</h3>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${connectMarkup || '<div style="font-size:14px; color:#64748b;">No social links added</div>'}
              </div>
            </div>
          </div>

          <div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#fafcff;">
              <h3 style="margin:0 0 6px; font-size:14px; color:#1f2a44;">Professional Snapshot</h3>
              <div style="font-size:12px; color:#475569; line-height:1.45;">
                <div><strong>Joined:</strong> ${safeJoinedDate}</div>
                <div><strong>Mentor Status:</strong> ${formData.isTeacher ? 'Active Mentor' : 'Learner'}</div>
                <div><strong>Skills Count:</strong> ${skills.length}</div>
                <div><strong>Projects Count:</strong> ${projects.length}</div>
              </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#fafcff;">
              <h3 style="margin:0 0 6px; font-size:14px; color:#1f2a44;">Learning Metrics</h3>
              <div style="font-size:12px; color:#475569; line-height:1.45;">
                <div><strong>Time Spent:</strong> ${escapeHtml(activityStats.timeSpent)}</div>
                <div><strong>Tokens Earned:</strong> ${escapeHtml(String(activityStats.tokensEarned))}</div>
                <div><strong>Tokens Used:</strong> ${escapeHtml(String(activityStats.tokensUsed))}</div>
                <div><strong>Completion Rate:</strong> ${escapeHtml(activityStats.completionRate)}</div>
              </div>
            </div>
          </div>

          <div style="margin-top:10px; border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#fbfdff;">
            <h3 style="margin:0 0 6px; font-size:14px; color:#1f2a44;">AI Insights</h3>
            <div style="font-size:12px; color:#475569; line-height:1.45;">
              <div><strong>Strengths:</strong> ${safeStrengths}</div>
              <div style="margin-top:4px;"><strong>Suggestions:</strong> ${safeSuggestions}</div>
              <div style="margin-top:4px;"><strong>Career Path:</strong> ${safeCareerPath}</div>
            </div>
          </div>

          <div style="margin-top:10px; border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#fbfdff;">
            <h3 style="margin:0 0 6px; font-size:14px; color:#1f2a44;">Contact Links</h3>
            <div style="font-size:12px; color:#475569; line-height:1.45;">
              ${contactsMarkup || 'No social links added'}
            </div>
          </div>

          <div style="margin-top:14px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; color:#94a3b8; font-size:12px;">
            <span>Generated by SkillSwap</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
        </div>
      `

      document.body.appendChild(pdfContainer)

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${(formData.name || 'skillswap-profile').toString().replace(/\s+/g, '-').toLowerCase()}-profile.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(pdfContainer).save()
    } catch (error) {
      console.error('Error generating profile PDF:', error)
      alert('Failed to generate profile PDF. Please try again.')
    } finally {
      if (pdfContainer && document.body.contains(pdfContainer)) {
        document.body.removeChild(pdfContainer)
      }
    }
  }

  // Update activeTab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  useEffect(() => {
    if (aiFromUrl !== '1') return

    setShowAIPanel(true)
    setTriggerAiGenerationFromUrl(true)
    const timerId = setTimeout(() => {
      aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 180)

    const params = new URLSearchParams(searchParams)
    params.delete('ai')
    setSearchParams(params, { replace: true })

    return () => clearTimeout(timerId)
  }, [aiFromUrl, searchParams, setSearchParams])

  useEffect(() => {
    const syncActivityLog = () => {
      setActivityLog(loadActivityLog())
    }
    window.addEventListener('activityLogUpdated', syncActivityLog)
    window.addEventListener('storage', syncActivityLog)

    return () => {
      window.removeEventListener('activityLogUpdated', syncActivityLog)
      window.removeEventListener('storage', syncActivityLog)
    }
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActivityLog(loadActivityLog())
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  // Load profile data from backend on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await userService.getProfile()
        const profileData = response.data.user

        setFormData(prev => ({
          ...prev,
          name: profileData.name || prev.name,
          username: profileData.email?.split('@')[0] || prev.username,
          profilePicture: profileData.profilePicture || prev.profilePicture,
          firstName: profileData.firstName || prev.firstName,
          lastName: profileData.lastName || prev.lastName,
          displayName: profileData.displayName || prev.displayName,
          role: profileData.profileTitle || prev.role,
          bio: profileData.bio || prev.bio,
          location: profileData.location || prev.location,
          tagline: profileData.tagline || prev.tagline,
          website: profileData.website || prev.website,
          whatsapp: profileData.whatsapp || prev.whatsapp,
          telegram: profileData.telegram || prev.telegram,
          language: profileData.language || prev.language,
          timezone: getSafeTimezone(profileData.timezone || prev.timezone),
          joinedDate: profileData.joinedDate || prev.joinedDate,
          isTeacher: profileData.isTeacher !== undefined ? profileData.isTeacher : prev.isTeacher,
        }))

        setSavedAboutData(buildAboutDataSnapshot(profileData))
        setProfileVisibility(profileData.profileVisibility || 'public')
        setFollowersCount(Number(profileData.followersCount || 0))
        setFollowingCount(Number(profileData.followingCount || 0))
        setUploadedVideosCount(Number(profileData.uploadedVideosCount || 0))
        
        // Load skills from backend
        if (profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
          setSkills(profileData.skills)
        }
        
        // Load projects from backend
        if (profileData.projects && Array.isArray(profileData.projects) && profileData.projects.length > 0) {
          setProjects(profileData.projects)
        }
        
        // Load social links from backend
        if (profileData.socialLinks && typeof profileData.socialLinks === 'object') {
          setSocialLinks(profileData.socialLinks)
        }
        
        // Load AI insights from backend
        setAiInsights(normalizeAiInsights(profileData.aiInsights))
      } catch (error) {
        console.error('Error loading profile data:', error)
      }
    }
    
    if (user) {
      loadProfileData()
    }
  }, [user?.id])

  useEffect(() => {
    const loadOwnerVideos = async () => {
      if (!user || !viewerIsOwner) return

      try {
        setOwnerVideosLoading(true)
        setOwnerVideosError('')
        const response = await videoService.getMyVideos()
        const videos = Array.isArray(response?.data?.videos) ? response.data.videos : []
        setOwnerVideos(videos)
      } catch (error) {
        console.error('Error loading owner videos:', error)
        setOwnerVideosError('Failed to load uploaded videos')
      } finally {
        setOwnerVideosLoading(false)
      }
    }

    loadOwnerVideos()
  }, [user?.id, viewerIsOwner])

  useEffect(() => {
    if (!triggerAiGenerationFromUrl) return
    if (isGeneratingAI) return

    if (hasAiInsightsContent(aiInsights)) {
      setTriggerAiGenerationFromUrl(false)
      return
    }

    generateAIInsights()
    setTriggerAiGenerationFromUrl(false)
  }, [triggerAiGenerationFromUrl, aiInsights, isGeneratingAI])

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.email?.split('@')[0] || '',
    profilePicture: user?.profilePicture || user?.photoURL || user?.avatar || user?.profileImage || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    role: '',
    bio: user?.bio || '',
    location: user?.location || '',
    tagline: '',
    website: user?.website || '',
    whatsapp: user?.whatsapp || '',
    telegram: user?.telegram || '',
    language: user?.language || '',
    timezone: getDetectedTimezone(),
    joinedDate: user?.joinedDate || '',
    isTeacher: user?.isTeacher || false,
  })

  useEffect(() => {
    const syncTimeForSelectedTimezone = () => {
      setCurrentLocalTime(getTimeForTimezone(formData.timezone))
    }

    syncTimeForSelectedTimezone()
    const timerId = setInterval(syncTimeForSelectedTimezone, 1000)

    return () => clearInterval(timerId)
  }, [formData.timezone])

  // Sample data for visualization

  // Calculate Real Weekly Activity from actual data
  const getWeeklyActivity = () => {
    const activityByDate = new Map(normalizedActivityLog.map(entry => [entry.date, entry]))
    const today = new Date()

    return Array.from({ length: 7 }).map((_, idx) => {
      const daysBack = 6 - idx
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() - daysBack)
      const dateStr = getLocalDateKey(targetDate)
      const dayEntry = activityByDate.get(dateStr)
      const hours = Number(dayEntry?.timeSpent || 0)

      return {
        day: targetDate.toLocaleDateString(undefined, { weekday: 'short' }),
        hours: parseFloat(hours.toFixed(1)),
        date: dateStr,
        coursesCompleted: Number(dayEntry?.coursesCompleted || 0)
      }
    })
  }

  // Calculate Real Heatmap from activity data
  const getHeatmapData = () => {
    const today = new Date()
    const heatmap = []
    const activityByDate = new Map(normalizedActivityLog.map(entry => [entry.date, entry]))
    
    for (let i = 0; i < 364; i++) {
      const targetDate = new Date()
      targetDate.setDate(today.getDate() - i)
      const dateStr = getLocalDateKey(targetDate)
      
      const dayActivity = activityByDate.get(dateStr)
      const value = getHeatmapLevel(dayActivity)
      
      heatmap.unshift({
        date: dateStr,
        value,
        timeSpent: Number(dayActivity?.timeSpent || 0),
        coursesCompleted: Number(dayActivity?.coursesCompleted || 0),
        tokensUsed: Number(dayActivity?.tokensUsed || 0),
        tokensEarned: Number(dayActivity?.tokensEarned || 0)
      })
    }
    
    return heatmap
  }

  const weeklyActivity = getWeeklyActivity()
  const heatmapData = getHeatmapData()
  const maxWeeklyHours = Math.max(...weeklyActivity.map(day => day.hours), 1)

  // Calculate Real Statistics
  const getActivityStats = () => {
    const stats = {
      totalTimeSpent: 0,
      totalTokensUsed: 0,
      totalTokensEarned: 0,
      totalCoursesCompleted: 0
    }

    normalizedActivityLog.forEach(log => {
      stats.totalTimeSpent += log.timeSpent
      stats.totalTokensUsed += log.tokensUsed
      stats.totalTokensEarned += log.tokensEarned
      stats.totalCoursesCompleted += log.coursesCompleted
    })

    const activeLearningDays = activityLog.filter(log =>
      Number(log.timeSpent || 0) > 0 ||
      Number(log.tokensUsed || 0) > 0 ||
      Number(log.tokensEarned || 0) > 0
    ).length

    const completedDays = normalizedActivityLog.filter(log => Number(log.coursesCompleted || 0) > 0).length
    const backendCompleted = Number(user?.lecturesCompleted || 0)
    const backendTotalLectures = Number(user?.totalLectures || 0)

    let completionRate = 0
    if (backendTotalLectures > 0) {
      completionRate = Math.round((backendCompleted / backendTotalLectures) * 100)
    } else if (activeLearningDays > 0) {
      completionRate = Math.round((completedDays / activeLearningDays) * 100)
    }

    return {
      timeSpent: Math.round(stats.totalTimeSpent) + 'h',
      tokensUsed: stats.totalTokensUsed,
      tokensEarned: stats.totalTokensEarned,
      completionRate: `${Math.max(0, Math.min(100, completionRate))}%`
    }
  }

  const activityStats = getActivityStats()

  // Calculate Profile Completion with breakdown
  const calculateProfileCompletion = () => {
    const filledText = (value) => String(value || '').trim().length > 0
    const checklist = {
      firstName: filledText(formData.firstName),
      lastName: filledText(formData.lastName),
      displayName: filledText(formData.displayName),
      role: filledText(formData.role),
      bio: String(formData.bio || '').trim().length > 10,
      tagline: filledText(formData.tagline),
      location: filledText(formData.location),
      website: filledText(formData.website),
      whatsapp: filledText(formData.whatsapp),
      telegram: filledText(formData.telegram),
      language: filledText(formData.language),
      timezone: filledText(formData.timezone),
      joinedDate: filledText(formData.joinedDate),
      skills: skills.length >= 3,
      social: Object.values(socialLinks).filter(link => filledText(link)).length >= 1,
      aiInsights:
        String(aiInsights.strengths || '').trim().length > 5 &&
        String(aiInsights.suggestions || '').trim().length > 5 &&
        String(aiInsights.careerPath || '').trim().length > 5,
      projects: projects.length >= 1,
    }

    const totalChecks = Object.keys(checklist).length
    const completedChecks = Object.values(checklist).filter(Boolean).length
    const percentage = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0

    return { percentage: Math.min(100, Math.max(0, percentage)), breakdown: checklist }
  }

  const profileCompletionData = calculateProfileCompletion()
  const profileCompletion = profileCompletionData.percentage
  const completionBreakdown = profileCompletionData.breakdown

  const addSkill = async () => {
    if (!newSkill.name.trim()) {
      alert('Please enter a skill name')
      return
    }
    if (skills.some(s => s.name.toLowerCase() === newSkill.name.toLowerCase())) {
      alert('This skill already exists!')
      return
    }
    
    const skillToAdd = { ...newSkill, id: Date.now() }
    const updatedSkills = [...skills, skillToAdd]
    setSkills(updatedSkills)
    setNewSkill({ name: '', level: 50, color: '#3B82F6' })
    
    // Save to backend
    try {
      await userService.updateProfile({ skills: updatedSkills })
    } catch (error) {
      console.error('Error saving skill:', error)
      alert('Skill added locally, but failed to save to server')
    }
  }

  const updateSkill = async (id, updatedSkill) => {
    const updatedSkills = skills.map(skill => skill.id === id ? { ...skill, ...updatedSkill } : skill)
    setSkills(updatedSkills)
    setEditingSkillId(null)
    
    // Save to backend
    try {
      await userService.updateProfile({ skills: updatedSkills })
    } catch (error) {
      console.error('Error updating skill:', error)
    }
  }

  const deleteSkill = async (id) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      const updatedSkills = skills.filter(skill => skill.id !== id)
      setSkills(updatedSkills)
      
      // Save to backend
      try {
        await userService.updateProfile({ skills: updatedSkills })
      } catch (error) {
        console.error('Error deleting skill:', error)
      }
    }
  }

  const getSkillColor = (skillName) => {
    const colors = ['#61DAFB', '#F7DF1E', '#339933', '#3776AB', '#FF6B6B', '#4DB33D', '#9333EA', '#EC4899']
    let hash = 0
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Calculate average skill level
  const calculateAvgSkillLevel = () => {
    if (skills.length === 0) return 0
    const total = skills.reduce((sum, skill) => sum + skill.level, 0)
    return Math.round(total / skills.length)
  }

  // Get strongest skill
  const getStrongestSkill = () => {
    if (skills.length === 0) return null
    return skills.reduce((max, skill) => skill.level > max.level ? skill : max, skills[0])
  }

  // Get weakest skill (to suggest improvement)
  const getWeakestSkill = () => {
    if (skills.length === 0) return null
    return skills.reduce((min, skill) => skill.level < min.level ? skill : min, skills[0])
  }

  // Project Management Functions
  const addProject = async () => {
    if (!newProject.title.trim()) {
      alert('Please enter a project title')
      return
    }
    if (!newProject.image.trim()) {
      alert('Please enter an emoji for the project')
      return
    }
    if (!newProject.tech.trim()) {
      alert('Please enter at least one technology')
      return
    }

    const techArray = newProject.tech.split(',').map(t => t.trim()).filter(t => t)
    if (techArray.length === 0) {
      alert('Please enter technologies separated by commas')
      return
    }

    const updatedProjects = [
      ...projects,
      {
        id: Date.now(),
        title: newProject.title,
        tech: techArray,
        image: newProject.image,
        liveUrl: newProject.liveUrl || '#',
        githubUrl: newProject.githubUrl || '#'
      }
    ]
    setProjects(updatedProjects)
    setNewProject({ title: '', tech: '', image: '', liveUrl: '', githubUrl: '' })
    
    // Save to backend
    try {
      await userService.updateProfile({ projects: updatedProjects })
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Project added locally, but failed to save to server')
    }
  }

  const updateProject = async (id, updatedProject) => {
    const updatedProjects = projects.map(project =>
      project.id === id ? { ...project, ...updatedProject } : project
    )
    setProjects(updatedProjects)
    setEditingProjectId(null)
    
    // Save to backend
    try {
      await userService.updateProfile({ projects: updatedProjects })
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const deleteProject = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(project => project.id !== id)
      setProjects(updatedProjects)
      
      // Save to backend
      try {
        await userService.updateProfile({ projects: updatedProjects })
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  // Activity Logging Functions
  const logCourseCompletion = (timeSpentHours = 1, tokensEarned = 0) => {
    const updatedLog = logCourseCompletionToStore(timeSpentHours, tokensEarned)
    setActivityLog(updatedLog)
  }

  const logTokenUsage = (tokensUsed = 10) => {
    const updatedLog = logTokenUsageToStore(tokensUsed)
    setActivityLog(updatedLog)
  }

  // Save social links to backend
  const saveSocialLinks = async () => {
    try {
      await userService.updateProfile({ socialLinks })
      setIsEditingSocial(false)
    } catch (error) {
      console.error('Error saving social links:', error)
      alert('Failed to save social links')
    }
  }

  // Save AI insights to backend
  const saveAIInsights = async () => {
    try {
      setAiGenerationError('')
      const payload = normalizeAiInsights(aiInsights)
      await userService.updateProfile({ aiInsights: payload })
      setAiInsights(payload)
      setIsEditingAI(false)
    } catch (error) {
      console.error('Error saving AI insights:', error)
      alert('Failed to save AI insights')
    }
  }

  const generateAIInsights = async () => {
    try {
      setAiGenerationError('')
      setIsGeneratingAI(true)
      const response = await userService.generateAiInsights()
      const generated = response?.data?.aiInsights

      if (!generated || typeof generated !== 'object') {
        throw new Error('Invalid AI insights response')
      }

      setAiInsights({
        strengths: generated.strengths || '',
        suggestions: generated.suggestions || '',
        careerPath: generated.careerPath || '',
      })
      setShowAIPanel(true)
      setIsEditingAI(false)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      setAiGenerationError(error?.response?.data?.message || 'Failed to generate AI insights. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleTimezoneChange = async (e) => {
    const selectedTimezone = getSafeTimezone(e.target.value)
    setFormData(prev => ({ ...prev, timezone: selectedTimezone }))
  }

  const getMissingRequiredProfileFields = () => {
    const requiredFieldMap = [
      ['firstName', 'First Name'],
      ['lastName', 'Last Name'],
      ['displayName', 'Display Name'],
      ['role', 'Role'],
      ['bio', 'Bio'],
      ['location', 'Location'],
      ['website', 'Website'],
      ['whatsapp', 'WhatsApp'],
      ['telegram', 'Telegram'],
      ['language', 'Language'],
      ['timezone', 'Timezone'],
      ['joinedDate', 'Joined Date'],
    ]

    return requiredFieldMap
      .filter(([key]) => !String(formData[key] || '').trim())
      .map(([, label]) => label)
  }

  const saveAboutDetails = async () => {
    const missingFields = getMissingRequiredProfileFields()
    if (missingFields.length > 0) {
      alert(`Please fill all required details before saving:\n${missingFields.join(', ')}`)
      return false
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: formData.displayName,
      bio: formData.bio,
      location: formData.location,
      profileTitle: formData.role,
      tagline: formData.tagline,
      website: formData.website,
      whatsapp: formData.whatsapp,
      telegram: formData.telegram,
      language: formData.language,
      timezone: formData.timezone,
      joinedDate: formData.joinedDate,
    }

    try {
      const response = await userService.updateProfile(payload)
      if (response?.data?.user) {
        const updatedUser = response.data.user
        updateUser({ ...user, ...updatedUser })

        const nextAboutSnapshot = buildAboutDataSnapshot(updatedUser, formData)
        setSavedAboutData(nextAboutSnapshot)
        setFormData(prev => ({ ...prev, ...nextAboutSnapshot }))
      }
      setIsEditingAbout(false)
      alert('About details updated successfully!')
      return true
    } catch (error) {
      console.error('Error saving about details:', error)
      alert('Failed to save About details')
      return false
    }
  }

  const handleLocationChange = (e) => {
    const locationValue = e.target.value
    setFormData(prev => ({ ...prev, location: locationValue }))
  }

  const handleLocationBlur = () => {
    return
  }

  const handleProfileVisibilityChange = async (nextVisibility) => {
    const allowed = ['public', 'private']
    const visibility = allowed.includes(nextVisibility) ? nextVisibility : 'public'

    setProfileVisibility(visibility)

    try {
      const response = await userService.updateProfile({ profileVisibility: visibility })
      if (response?.data?.user) {
        updateUser({ ...user, ...response.data.user })
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error)
      alert('Failed to update profile visibility')
    }
  }

  const saveProfile = async () => {
    const missingFields = getMissingRequiredProfileFields()
    if (missingFields.length > 0) {
      alert(`Please complete required details first:\n${missingFields.join(', ')}`)
      return false
    }

    try {
      const response = await userService.updateProfile(formData)
      if (response?.data?.user) {
        updateUser({ ...user, ...response.data.user })
      }
      setIsEditing(false)
      alert('Profile updated successfully!')
      return true
    } catch (error) {
      console.error(error)
      alert('Error updating profile')
      return false
    }
  }

  const saveProfilePicture = async () => {
    const cleanedProfilePicture = String(formData.profilePicture || '').trim()

    try {
      const response = await userService.updateProfile({ profilePicture: cleanedProfilePicture })
      if (response?.data?.user) {
        updateUser({ ...user, ...response.data.user })
      } else {
        updateUser({ ...user, profilePicture: cleanedProfilePicture })
      }
      setFormData((prev) => ({ ...prev, profilePicture: cleanedProfilePicture }))
      alert('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error updating profile picture:', error)
      alert('Failed to update profile picture')
    }
  }

  const startVideoEdit = (video) => {
    setEditingVideoId(video.id)
    setEditingVideoData({
      title: video.title || '',
      skillTag: video.skillTag || '',
      visibility: video.visibility || 'public',
    })
  }

  const cancelVideoEdit = () => {
    setEditingVideoId(null)
    setEditingVideoData({ title: '', skillTag: '', visibility: 'public' })
  }

  const reloadOwnerVideos = async () => {
    try {
      setOwnerVideosLoading(true)
      setOwnerVideosError('')
      const response = await videoService.getMyVideos()
      const videos = Array.isArray(response?.data?.videos) ? response.data.videos : []
      setOwnerVideos(videos)
      setUploadedVideosCount(videos.length)
    } catch (error) {
      console.error('Error reloading owner videos:', error)
      setOwnerVideosError('Failed to refresh uploaded videos')
    } finally {
      setOwnerVideosLoading(false)
    }
  }

  const handleVideoUpdate = async (videoId) => {
    if (!editingVideoData.title.trim()) {
      alert('Video title is required')
      return
    }

    try {
      setSavingVideoId(videoId)
      await videoService.updateVideo(videoId, {
        title: editingVideoData.title.trim(),
        skillTag: editingVideoData.skillTag.trim(),
        visibility: editingVideoData.visibility,
      })

      setOwnerVideos((prev) => prev.map((item) => (
        Number(item.id) === Number(videoId)
          ? {
            ...item,
            title: editingVideoData.title.trim(),
            skillTag: editingVideoData.skillTag.trim(),
            visibility: editingVideoData.visibility,
          }
          : item
      )))

      cancelVideoEdit()
      alert('Video updated successfully')
    } catch (error) {
      console.error('Error updating video from profile:', error)
      alert(error?.response?.data?.message || 'Failed to update video')
    } finally {
      setSavingVideoId(null)
    }
  }

  const handleVideoDelete = async (videoId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this video?')
    if (!shouldDelete) return

    try {
      setDeletingVideoId(videoId)
      await videoService.deleteVideo(videoId)
      setOwnerVideos((prev) => prev.filter((item) => Number(item.id) !== Number(videoId)))
      setUploadedVideosCount((prev) => Math.max(0, Number(prev) - 1))
      if (Number(editingVideoId) === Number(videoId)) {
        cancelVideoEdit()
      }
      alert('Video deleted successfully')
    } catch (error) {
      console.error('Error deleting video from profile:', error)
      alert(error?.response?.data?.message || 'Failed to delete video')
    } finally {
      setDeletingVideoId(null)
    }
  }

  const formatVideoDate = (value) => {
    if (!value) return 'Unknown date'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatOwnerVideoDuration = (value) => {
    const totalSeconds = Number(value || 0)
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return ''

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const handleProfilePictureSelect = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type?.startsWith('image/')) {
      alert('Please select an image file only.')
      event.target.value = ''
      return
    }

    try {
      const response = await userService.uploadProfilePicture(selectedFile)
      const uploadedUrl = response?.data?.profilePicture || response?.data?.user?.profilePicture || ''
      const updatedUser = response?.data?.user

      if (updatedUser) {
        updateUser({ ...user, ...updatedUser })
      } else if (uploadedUrl) {
        updateUser({ ...user, profilePicture: uploadedUrl })
      }

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, profilePicture: uploadedUrl }))
      }

      alert('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('Failed to upload profile picture')
    } finally {
      event.target.value = ''
    }
  }

  const pageShellClass = isDark
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white py-8 px-4 fade-in'
    : 'min-h-screen bg-transparent text-slate-900 py-8 px-4 fade-in'

  const panelClass = isDark
    ? 'backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10'
    : 'backdrop-blur-xl bg-white/85 rounded-2xl p-6 border border-orange-200/70 shadow-sm'

  return (
    <div className={pageShellClass}>
      <div className="max-w-7xl mx-auto">
        
        {/* 1️⃣ HERO PROFILE SECTION */}
        <div className={`relative mb-8 rounded-3xl p-8 backdrop-blur-xl shadow-2xl overflow-hidden fade-up ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-orange-200/70'}`}>
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <div className="relative group floating-effect">
              <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureSelect}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition"></div>
              <button
                type="button"
                onClick={() => profilePictureInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-5xl font-bold shadow-2xl border-4 border-white/20 overflow-hidden"
                title="Change profile picture"
              >
                <span>{formData.name?.charAt(0) || 'U'}</span>
                {formData.profilePicture?.trim() && (
                  <img
                    src={formData.profilePicture}
                    alt="Profile"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => profilePictureInputRef.current?.click()}
                className="absolute top-1 right-1 text-xs px-2 py-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                title="Upload new picture"
              >
                📷
              </button>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white/10 px-3 py-1 rounded-lg text-2xl font-bold"
                  />
                ) : (
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent fade-up">
                    {formData.name}
                  </h1>
                )}
                <button
                  onClick={() => {
                    if (isEditing) {
                      saveProfile()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 micro-bounce smooth-transform"
                >
                  {isEditing ? '✓' : '✏️'}
                </button>
              </div>
              
              <p className={`text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>@{formData.username}</p>
              
              {isEditing ? (
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-white/10 px-3 py-1 rounded-lg mb-4"
                />
              ) : (
                <p className="text-xl font-semibold text-blue-400 mb-4">{formData.role}</p>
              )}

              {/* Profile Completion */}
              <div className="max-w-md mx-auto md:mx-0">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Profile Completion</span>
                  <span className={`text-sm font-bold ${
                    profileCompletion === 100 ? 'text-green-400' :
                    profileCompletion >= 75 ? 'text-cyan-400' :
                    profileCompletion >= 50 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {profileCompletion}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 progress-fill-animation ${
                      profileCompletion === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      profileCompletion >= 75 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                      profileCompletion >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {profileCompletion === 100 ? '✅ Profile Complete! You\'re all set!' :
                   profileCompletion >= 75 ? '🎉 Almost there! Complete a few more fields.' :
                   profileCompletion >= 50 ? '🔄 You\'re halfway there! Keep going.' :
                   '📝 Start filling in your profile details.'}
                </p>
                
                {/* Completion Breakdown - Show what's completed */}
                <div className="mt-3 text-xs space-y-1">
                  <details className="cursor-pointer border-t border-white/20 pt-2">
                    <summary className="font-semibold text-cyan-400 hover:text-cyan-300">📊 What's Complete?</summary>
                    <div className="mt-2 space-y-1 text-gray-400">
                      {completionBreakdown.firstName && <p>✅ First Name</p>}
                      {completionBreakdown.lastName && <p>✅ Last Name</p>}
                      {completionBreakdown.displayName && <p>✅ Display Name</p>}
                      {completionBreakdown.role && <p>✅ Role/Title</p>}
                      {completionBreakdown.bio && <p>✅ Bio</p>}
                      {completionBreakdown.tagline && <p>✅ Tagline</p>}
                      {completionBreakdown.location && <p>✅ Location</p>}
                      {completionBreakdown.website && <p>✅ Website</p>}
                      {completionBreakdown.whatsapp && <p>✅ WhatsApp</p>}
                      {completionBreakdown.telegram && <p>✅ Telegram</p>}
                      {completionBreakdown.language && <p>✅ Language</p>}
                      {completionBreakdown.timezone && <p>✅ Timezone</p>}
                      {completionBreakdown.joinedDate && <p>✅ Joined Date</p>}
                      {completionBreakdown.skills && <p>✅ Skills (3+)</p>}
                      {completionBreakdown.social && <p>✅ Social Links</p>}
                      {completionBreakdown.aiInsights && <p>✅ AI Insights (All 3 sections)</p>}
                      {completionBreakdown.projects && <p>✅ Projects</p>}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/85 border border-orange-200/70 shadow-sm'}`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div className={`px-5 py-4 rounded-xl transition ${isDark ? 'bg-white/5 border border-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}>
                  <div className="text-3xl font-bold text-cyan-400 counter-animation">{user?.tokens || 150}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Tokens</div>
                </div>
                <div className={`px-5 py-4 rounded-xl transition ${isDark ? 'bg-white/5 border border-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}>
                  <div className="text-3xl font-bold text-purple-400 counter-animation">{user?.lecturesCompleted || 24}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Completed</div>
                </div>
                <button
                  onClick={() => openConnections('followers')}
                  className={`px-5 py-4 rounded-xl transition ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}
                >
                  <div className="text-3xl font-bold text-blue-400 counter-animation">{followersCount}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Followers</div>
                </button>
                <button
                  onClick={() => openConnections('following')}
                  className={`px-5 py-4 rounded-xl transition ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}
                >
                  <div className="text-3xl font-bold text-indigo-400 counter-animation">{followingCount}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Following</div>
                </button>
                <div className={`px-5 py-4 rounded-xl transition ${isDark ? 'bg-white/5 border border-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}>
                  <div className="text-3xl font-bold text-emerald-400 counter-animation">{uploadedVideosCount}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Videos</div>
                </div>
              </div>
            </div>

            {showConnections && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                  type="button"
                  aria-label="Close connections modal"
                  onClick={() => setShowConnections(false)}
                  className="absolute inset-0 bg-black/50"
                />
                <div className={`relative w-full max-w-2xl rounded-2xl p-4 ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-orange-200 shadow-xl'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setConnectionsTab('followers')
                          await loadConnections('followers')
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${connectionsTab === 'followers' ? 'bg-blue-600 text-white' : isDark ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Followers ({followersCount})
                      </button>
                      <button
                        onClick={async () => {
                          setConnectionsTab('following')
                          await loadConnections('following')
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${connectionsTab === 'following' ? 'bg-purple-600 text-white' : isDark ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Following ({followingCount})
                      </button>
                    </div>
                    <button
                      onClick={() => setShowConnections(false)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Close
                    </button>
                  </div>

                  {connectionsLoading ? (
                    <p className={isDark ? 'text-gray-300 text-sm' : 'text-slate-600 text-sm'}>Loading...</p>
                  ) : connectionsError ? (
                    <p className="text-sm text-red-400">{connectionsError}</p>
                  ) : connections.length === 0 ? (
                    <p className={isDark ? 'text-gray-400 text-sm' : 'text-slate-600 text-sm'}>
                      No {connectionsTab} yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {connections.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => {
                            setShowConnections(false)
                            navigate(`/profile/user/${person.id}`)
                          }}
                          className={`w-full text-left p-3 rounded-lg transition ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-orange-50 border border-orange-100 hover:bg-orange-100'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{person.name}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>@{person.username}</p>
                              {person.bio && (
                                <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                  {person.bio}
                                </p>
                              )}
                            </div>
                            {person.isTeacher && <span className="text-xs text-green-400 font-semibold">Teacher</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/85 border border-orange-200/70 shadow-sm'}`}>
          <form onSubmit={handleProfileSearch} className="space-y-2">
            <p className="font-semibold">Search Profile</p>
            <div className="flex gap-3">
              <input
                value={profileSearchName}
                onChange={(e) => setProfileSearchName(e.target.value)}
                placeholder="Search profile by name (e.g. ninja)"
                className={`flex-1 rounded-lg px-3 py-2 border outline-none ${isDark ? 'bg-white/10 text-white border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                Search
              </button>
            </div>
            {profileSearchError && <p className="text-xs text-red-400">{profileSearchError}</p>}
          </form>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 slide-down">
          {['overview', 'skills', 'activity', 'projects', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition slide-underline smooth-transform ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                  : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white/80 hover:bg-orange-50 border border-orange-200/70 text-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* 2️⃣ SMART ABOUT SECTION */}
            {activeTab === 'overview' && (
              <>
                <div className={`${isDark ? 'backdrop-blur-xl bg-white/5 border border-white/10' : 'backdrop-blur-xl bg-white/85 border border-orange-200/70 shadow-sm'} rounded-2xl p-6`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">About Me</h2>
                    <div className="flex gap-2">
                      {isEditingAbout ? (
                        <>
                          <button
                            onClick={saveAboutDetails}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
                            title="Save About"
                          >
                            Save About
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingAbout(false)
                              const fallback = savedAboutData || buildAboutDataSnapshot(user || {}, formData)
                              setFormData(prev => ({ ...prev, ...fallback }))
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditingAbout(true)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                          title="Update About"
                        >
                          Update About
                        </button>
                      )}
                      <button onClick={() => setBioExpanded(!bioExpanded)} className={isDark ? 'text-blue-400' : 'text-blue-700'}>
                        {bioExpanded ? '▲ Collapse' : '▼ Expand'}
                      </button>
                    </div>
                  </div>

                  {isEditingAbout && (
                    <p className={`text-xs mb-3 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                      Type your About Me details and click Save About to update. All profile details below are required.
                    </p>
                  )}
                  
                  {/* Tagline */}
                  <div className="mb-4">
                    {isEditingAbout ? (
                      <input
                        name="tagline"
                        value={formData.tagline}
                        onChange={handleChange}
                        placeholder="Add your tagline..."
                        className={`w-full rounded-lg px-3 py-2 border outline-none italic ${isDark ? 'bg-white/10 text-cyan-400 border-white/20 focus:border-cyan-400' : 'bg-white text-blue-700 border-orange-200 focus:border-blue-500'}`}
                      />
                    ) : (
                      <p className={`text-lg font-semibold italic ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>"{formData.tagline}"</p>
                    )}
                  </div>
                  
                  {/* Bio */}
                  {isEditingAbout ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      className={`w-full rounded-lg p-4 border focus:border-blue-500 outline-none min-h-[120px] resize-none ${isDark ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-white text-slate-700 border-orange-200'}`}
                    />
                  ) : (
                    <p className={`${isDark ? 'text-gray-300' : 'text-slate-700'} leading-relaxed ${!bioExpanded && 'line-clamp-3'}`}>
                      {formData.bio}
                    </p>
                  )}

                  {bioExpanded && (
                    <div className={`grid grid-cols-2 gap-4 mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-orange-200/70'}`}>
                      {/* First Name */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>👤 First Name</p>
                        {isEditingAbout ? (
                          <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First name"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.firstName || '-'}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>👤 Last Name</p>
                        {isEditingAbout ? (
                          <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last name"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.lastName || '-'}</p>
                        )}
                      </div>

                      {/* Display Name */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>🏷️ Display Name</p>
                        {isEditingAbout ? (
                          <input
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="Public display name"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.displayName || '-'}</p>
                        )}
                      </div>

                      {/* Location */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>📍 Location</p>
                        {isEditingAbout ? (
                          <input
                            name="location"
                            value={formData.location}
                            onChange={handleLocationChange}
                            onBlur={handleLocationBlur}
                            placeholder="Your city, country"
                            className={`w-full rounded px-2 py-1 border focus:border-cyan-400 outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-white text-slate-700 border-orange-200'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.location}</p>
                        )}
                      </div>
                      
                      {/* Joined Date */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>📅 Joined</p>
                        {isEditingAbout ? (
                          <input
                            name="joinedDate"
                            value={formData.joinedDate}
                            onChange={handleChange}
                            placeholder="e.g., January 2026"
                            className={`w-full rounded px-2 py-1 border focus:border-cyan-400 outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-white text-slate-700 border-orange-200'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.joinedDate}</p>
                        )}
                      </div>
                      
                      {/* Language */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>🌐 Language</p>
                        {isEditingAbout ? (
                          <input
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            placeholder="e.g., English, Hindi"
                            className={`w-full rounded px-2 py-1 border focus:border-cyan-400 outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-white text-slate-700 border-orange-200'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.language}</p>
                        )}
                      </div>
                      
                      {/* Timezone */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>🕒 Timezone</p>
                        <select
                          name="timezone"
                          value={getSafeTimezone(formData.timezone)}
                          onChange={handleTimezoneChange}
                          className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-200 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-800 border-orange-200 focus:border-blue-500'}`}
                        >
                          {timezoneOptions.map((timezone) => (
                            <option key={timezone} value={timezone}>
                              {formatTimezoneLabel(timezone)}
                            </option>
                          ))}
                        </select>
                        <p className={`text-xs mt-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>Current time: {currentLocalTime}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Click to select timezone as per user preference</p>
                      </div>

                      {/* Website */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>🌐 Website</p>
                        {isEditingAbout ? (
                          <input
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://your-website.com"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold break-all ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.website || '-'}</p>
                        )}
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>📱 WhatsApp</p>
                        {isEditingAbout ? (
                          <input
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            placeholder="WhatsApp number"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.whatsapp || '-'}</p>
                        )}
                      </div>

                      {/* Telegram */}
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-700'}`}>💬 Telegram</p>
                        {isEditingAbout ? (
                          <input
                            name="telegram"
                            value={formData.telegram}
                            onChange={handleChange}
                            placeholder="Telegram handle"
                            className={`w-full rounded px-2 py-1 border outline-none text-sm mt-1 ${isDark ? 'bg-white/10 text-gray-300 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                          />
                        ) : (
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.telegram || '-'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3️⃣ SKILL INTELLIGENCE SECTION */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold mb-6">Skill Intelligence</h2>
                  
                  {/* Skills Radar Chart (CSS-based visualization) */}
                  <div className="mb-8">
                    <div className="relative w-64 h-64 mx-auto">
                      <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full"></div>
                      <div className="absolute inset-8 border-2 border-blue-500/20 rounded-full"></div>
                      <div className="absolute inset-16 border-2 border-blue-500/10 rounded-full"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl mb-2">🎯</div>
                          <div className="text-2xl font-bold text-cyan-400">{calculateAvgSkillLevel()}</div>
                          <div className="text-xs text-gray-400">Avg Level</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills List with Progress Bars */}
                  <div className="space-y-4">
                    {skills.map((skill, idx) => (
                      <div key={idx} className="group">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold">{skill.name}</span>
                          <span className="text-cyan-400 font-bold">{skill.level}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse"
                            style={{ 
                              width: `${skill.level}%`,
                              background: `linear-gradient(90deg, ${skill.color}, ${skill.color}CC)`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Insights */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30">
                    {skills.length > 0 ? (
                      <p className="text-sm">
                        <span className="text-purple-400 font-bold">🤖 AI Insight:</span> Your strongest skill is {getStrongestSkill()?.name} at {getStrongestSkill()?.level}%!
                        {getWeakestSkill() && getWeakestSkill().level < 70 && (
                          <> Keep practicing {getWeakestSkill()?.name} to reach expert level.</>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm">
                        <span className="text-purple-400 font-bold">🤖 AI Insight:</span> Add your skills to get personalized insights!
                      </p>
                    )}
                  </div>
                </div>

                {viewerIsOwner && (
                  <div className={panelClass}>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <h3 className="text-xl font-bold">My Uploaded Videos</h3>
                      <button
                        onClick={() => navigate('/upload-video')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold transition"
                        title="Upload new video"
                      >
                        ➕ Add Video
                      </button>
                    </div>

                    <div className="mb-3 flex items-center justify-between">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        Owner videos in one place for quick edit/update/remove.
                      </p>
                      <button
                        onClick={reloadOwnerVideos}
                        className={`text-xs px-2 py-1 rounded-md border transition ${isDark ? 'border-white/20 hover:bg-white/10 text-gray-200' : 'border-orange-300 hover:bg-orange-100 text-slate-700'}`}
                        disabled={ownerVideosLoading}
                        title="Refresh video list"
                      >
                        {ownerVideosLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    {ownerVideosError && (
                      <div className={`mb-3 p-2 rounded-lg text-xs border ${isDark ? 'bg-red-900/30 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {ownerVideosError}
                      </div>
                    )}

                    {ownerVideosLoading ? (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Loading uploaded videos...</p>
                    ) : ownerVideos.length === 0 ? (
                      <div className={`p-3 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white/70 border-orange-200/70 text-slate-700'}`}>
                        No uploaded videos yet. Click <strong>Add Video</strong> to upload your first video.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pr-1">
                        {ownerVideos.map((video) => {
                          const isEditingCurrent = Number(editingVideoId) === Number(video.id)
                          const isSavingCurrent = Number(savingVideoId) === Number(video.id)
                          const isDeletingCurrent = Number(deletingVideoId) === Number(video.id)
                          const durationText = formatOwnerVideoDuration(video.duration)

                          return (
                            <div
                              key={video.id}
                              className={`overflow-hidden rounded-2xl border transition ${isDark ? 'bg-white/5 border-white/10 hover:border-blue-500/60' : 'bg-white/85 border-orange-200/70 hover:border-blue-300'}`}
                            >
                              {isEditingCurrent ? (
                                <div className="space-y-2 p-3">
                                  <input
                                    type="text"
                                    value={editingVideoData.title}
                                    onChange={(e) => setEditingVideoData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Video title"
                                    className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-orange-200 text-slate-900'}`}
                                  />
                                  <input
                                    type="text"
                                    value={editingVideoData.skillTag}
                                    onChange={(e) => setEditingVideoData((prev) => ({ ...prev, skillTag: e.target.value }))}
                                    placeholder="Skill tag"
                                    className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-orange-200 text-slate-900'}`}
                                  />
                                  <select
                                    value={editingVideoData.visibility}
                                    onChange={(e) => setEditingVideoData((prev) => ({ ...prev, visibility: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-orange-200 text-slate-900'}`}
                                  >
                                    <option value="public">🌐 Public</option>
                                    <option value="private">🔒 Private</option>
                                    <option value="premium">💎 Premium</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleVideoUpdate(video.id)}
                                      disabled={isSavingCurrent}
                                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
                                    >
                                      {isSavingCurrent ? 'Updating...' : 'Update'}
                                    </button>
                                    <button
                                      onClick={cancelVideoEdit}
                                      disabled={isSavingCurrent}
                                      className={`px-3 py-1.5 rounded-md text-xs font-semibold ${isDark ? 'bg-white/10 hover:bg-white/20 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className={`relative aspect-video ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                    {video.thumbnailUrl ? (
                                      <img
                                        src={video.thumbnailUrl}
                                        alt={video.title || 'Video thumbnail'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : video.videoUrl ? (
                                      <video
                                        src={video.videoUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-4xl">🎥</div>
                                    )}

                                    {durationText && (
                                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white">
                                        {durationText}
                                      </div>
                                    )}

                                    {Number(video.tokensRequired || 0) > 0 && (
                                      <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                        💎 {video.tokensRequired} tokens
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="font-bold text-xl leading-tight truncate">{video.title || 'Untitled video'}</p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                          {formatVideoDate(video.createdAt)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => navigate(`/videos/${video.id}`)}
                                        className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-white/10 hover:bg-white/20 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                        title="Open video"
                                      >
                                        Open
                                      </button>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                        {(video.uploader?.name || user?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                        {video.uploader?.name || user?.name || 'You'}
                                      </p>
                                    </div>

                                    <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                      <span>👁 {video.views || 0} views</span>
                                      <span>❤️ {video.likes || 0} likes</span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                        {video.skillTag || 'General'}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                        {video.level || 'Beginner'}
                                      </span>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={() => startVideoEdit(video)}
                                        className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleVideoDelete(video.id)}
                                        disabled={isDeletingCurrent}
                                        className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-60"
                                      >
                                        {isDeletingCurrent ? 'Removing...' : 'Remove'}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Activity & Analytics</h2>
                
                {/* Weekly Activity Graph */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {weeklyActivity.map((day, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg hover:from-blue-500 hover:to-cyan-300 transition-all cursor-pointer"
                          style={{ height: `${Math.max(4, (day.hours / maxWeeklyHours) * 100)}%` }}
                          title={`${day.date}: ${day.hours}h, ${day.coursesCompleted} course${day.coursesCompleted === 1 ? '' : 's'} completed`}
                        ></div>
                        <div className="text-xs mt-2 text-gray-400">{day.day}</div>
                        <div className="text-xs font-bold text-cyan-400">{day.hours}h</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GitHub-style Heatmap */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contribution Heatmap</h3>
                  <div className="overflow-x-auto">
                    <div className="inline-grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                      {heatmapData.map((cell, idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-sm ${
                            cell.value === 0 ? 'bg-gray-800' :
                            cell.value === 1 ? 'bg-green-900' :
                            cell.value === 2 ? 'bg-green-700' :
                            cell.value === 3 ? 'bg-green-500' :
                            'bg-green-400'
                          } hover:ring-2 ring-white transition`}
                          title={`${cell.date} • Time: ${cell.timeSpent.toFixed(1)}h • Courses: ${cell.coursesCompleted} • Used: ${cell.tokensUsed} • Earned: ${cell.tokensEarned}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                    <span>More</span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {[
                    { label: 'Time Spent', value: activityStats.timeSpent, icon: '⏱️', color: 'blue' },
                    { label: 'Tokens Used', value: activityStats.tokensUsed, icon: '💰', color: 'yellow' },
                    { label: 'Tokens Earned', value: activityStats.tokensEarned, icon: '💎', color: 'purple' },
                    { label: 'Completion Rate', value: activityStats.completionRate, icon: '✓', color: 'green' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl text-center hover:bg-white/10 transition">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Projects & Portfolio</h2>
                  <button
                    onClick={() => setIsEditingProjects(!isEditingProjects)}
                    className="text-xl hover:scale-110 transition"
                    title={isEditingProjects ? 'Done Editing' : 'Add/Edit Projects'}
                  >
                    {isEditingProjects ? '💾' : '✏️'}
                  </button>
                </div>

                {/* Add Project Form */}
                {isEditingProjects && (
                  <div className="p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl mb-6 border border-purple-500/30">
                    <h3 className="font-semibold mb-4 text-purple-300">➕ Add New Project</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        placeholder="Project Title (e.g., E-Commerce Platform)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                      />
                      <input
                        type="text"
                        value={newProject.image}
                        onChange={(e) => setNewProject({ ...newProject, image: e.target.value })}
                        placeholder="Project Emoji (e.g., 🛒 🤖 💼)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                        maxLength="2"
                      />
                      <input
                        type="text"
                        value={newProject.tech}
                        onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })}
                        placeholder="Technologies (comma-separated: React, Node.js, MongoDB)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                      />
                      <input
                        type="text"
                        value={newProject.liveUrl}
                        onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                        placeholder="Live Demo URL (optional)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                      />
                      <input
                        type="text"
                        value={newProject.githubUrl}
                        onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                        placeholder="GitHub URL (optional)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        onClick={addProject}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition transform hover:scale-105"
                      >
                        + Add Project
                      </button>
                    </div>
                  </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <p className="text-lg">No projects added yet</p>
                      <p className="text-sm mt-2">Click ✏️ to start adding your projects</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="group bg-white/5 rounded-xl p-6 border border-white/5 hover:border-blue-500/50 transition">
                        {editingProjectId === project.id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={project.title}
                              onChange={(e) => updateProject(project.id, { title: e.target.value })}
                              placeholder="Project Title"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <input
                              type="text"
                              value={project.image}
                              onChange={(e) => updateProject(project.id, { image: e.target.value })}
                              placeholder="Emoji"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                              maxLength="2"
                            />
                            <input
                              type="text"
                              value={project.tech.join(', ')}
                              onChange={(e) => updateProject(project.id, { tech: e.target.value.split(',').map(t => t.trim()) })}
                              placeholder="Technologies (comma-separated)"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <input
                              type="text"
                              value={project.liveUrl}
                              onChange={(e) => updateProject(project.id, { liveUrl: e.target.value })}
                              placeholder="Live Demo URL"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <input
                              type="text"
                              value={project.githubUrl}
                              onChange={(e) => updateProject(project.id, { githubUrl: e.target.value })}
                              placeholder="GitHub URL"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingProjectId(null)}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                              >
                                ✅ Save
                              </button>
                              <button
                                onClick={() => setEditingProjectId(null)}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition"
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <div>
                            <div className="text-6xl mb-4">{project.image}</div>
                            <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.tech.map((tech, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-600/30 rounded-full text-xs font-semibold">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-3 mb-3">
                              <a href={project.liveUrl} className="flex-1 text-center py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition">
                                Live Demo
                              </a>
                              <a href={project.githubUrl} className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition">
                                GitHub
                              </a>
                            </div>
                            {isEditingProjects && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingProjectId(project.id)}
                                  className="flex-1 py-2 hover:bg-blue-600/20 rounded-lg transition font-semibold"
                                  title="Edit"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => deleteProject(project.id)}
                                  className="flex-1 py-2 hover:bg-red-600/20 rounded-lg transition font-semibold"
                                  title="Delete"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SKILLS TAB */}
            {activeTab === 'skills' && (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Skills & Expertise</h2>
                  <button
                    onClick={() => setIsEditingSkills(!isEditingSkills)}
                    className="text-xl hover:scale-110 transition"
                    title={isEditingSkills ? 'Done Editing' : 'Edit Skills'}
                  >
                    {isEditingSkills ? '💾' : '✏️'}
                  </button>
                </div>
                
                {/* Add Skill Form */}
                {isEditingSkills && (
                  <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl mb-6 border border-blue-500/30">
                    <h3 className="font-semibold mb-4 text-blue-300">➕ Add New Skill</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          placeholder="Enter skill name (e.g., React, Python)"
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={addSkill}
                          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition transform hover:scale-105"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-400">Proficiency: {newSkill.level}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newSkill.level}
                          onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Skills List */}
                <div className="space-y-4">
                  {skills.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-lg">No skills added yet</p>
                      <p className="text-sm mt-2">Click ✏️ to start adding your skills</p>
                    </div>
                  ) : (
                    skills.map((skill) => (
                      <div key={skill.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition">
                        {editingSkillId === skill.id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-gray-400 w-24">Level: {skill.level}%</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={skill.level}
                                onChange={(e) => updateSkill(skill.id, { level: parseInt(e.target.value) })}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingSkillId(null)}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                              >
                                ✅ Save
                              </button>
                              <button
                                onClick={() => setEditingSkillId(null)}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition"
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xl font-bold">{skill.name}</span>
                              <span className="px-3 py-1 bg-cyan-600 rounded-full text-sm font-semibold">
                                Level {Math.floor(skill.level / 10)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${skill.level}%`,
                                  background: `linear-gradient(90deg, ${skill.color}, ${skill.color}CC)`
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex justify-between flex-1 text-xs text-gray-400 mr-4">
                                <span>{skill.level}% Mastery</span>
                                <span>{100 - skill.level}% to Expert</span>
                              </div>
                              {isEditingSkills && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingSkillId(skill.id)}
                                    className="p-1 hover:bg-blue-600/20 rounded transition"
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteSkill(skill.id)}
                                    className="p-1 hover:bg-red-600/20 rounded transition"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className={panelClass}>
                  <h2 className="text-2xl font-bold mb-2">Settings & Privacy</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Manage your appearance and privacy preferences.</p>
                </div>

                <div className={panelClass}>
                  <h3 className="text-xl font-bold mb-4">Profile Picture</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold">
                        <span>{formData.name?.charAt(0) || 'U'}</span>
                        {formData.profilePicture?.trim() && (
                          <img
                            src={formData.profilePicture}
                            alt="Profile preview"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        Paste image URL and click save to update your profile photo.
                      </div>
                    </div>

                    <input
                      type="url"
                      name="profilePicture"
                      value={formData.profilePicture}
                      onChange={handleChange}
                      placeholder="https://example.com/your-photo.jpg"
                      className={`w-full rounded-lg px-3 py-2 border outline-none ${isDark ? 'bg-white/10 text-gray-200 border-white/20 focus:border-cyan-400' : 'bg-white text-slate-700 border-orange-200 focus:border-blue-500'}`}
                    />

                    <button
                      onClick={saveProfilePicture}
                      type="button"
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                    >
                      Save Profile Picture
                    </button>

                    <button
                      onClick={() => profilePictureInputRef.current?.click()}
                      type="button"
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
                    >
                      Upload From Device
                    </button>
                  </div>
                </div>

                <div className={panelClass}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide">Appearance Settings</h4>
                    <button
                      onClick={toggleTheme}
                      type="button"
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold smooth-transform ${
                        isDark
                          ? 'border-gray-600 bg-gray-900/80 text-yellow-300 hover:border-yellow-400/50'
                          : 'border-orange-300 bg-orange-100 text-orange-700 hover:border-orange-400'
                      }`}
                    >
                      {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide">Light Theme Options</p>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      {isDark ? 'Switch to light mode to preview' : 'Selected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {lightThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setLightTheme(theme.id)}
                        type="button"
                        className={`rounded-lg border px-2 py-2 text-left text-xs smooth-transform ${
                          lightTheme === theme.id
                            ? isDark
                              ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                              : 'border-orange-400 bg-orange-100 text-orange-700'
                            : isDark
                              ? 'border-gray-700 bg-gray-900/60 hover:border-gray-500'
                              : 'border-gray-200 bg-gray-50 text-slate-800 hover:border-orange-300'
                        }`}
                        title={theme.name}
                      >
                        <span className="mr-1">{theme.emoji}</span>
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={panelClass}>
                  <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Profile Visibility</label>
                      <select 
                        value={profileVisibility}
                        onChange={(e) => handleProfileVisibilityChange(e.target.value)}
                        className="w-full bg-white/10 px-3 py-2 rounded-lg border border-white/20 focus:border-blue-500 outline-none select-readable"
                      >
                        <option value="public">🌐 Public</option>
                        <option value="private">🔒 Private</option>
                      </select>
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{getPrivacyDescription(profileVisibility)}</p>
                    </div>

                    <div className="p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
                      <p className="text-sm text-blue-300">
                        {profileVisibility === 'public' && '✅ Your profile is visible to everyone on SkillSwap'}
                        {profileVisibility === 'private' && '🔒 Your profile is hidden from everyone except you'}
                      </p>
                    </div>

                    {(profileVisibility === 'private' && !viewerIsOwner) && (
                      <div className="p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
                        <p className="text-sm text-yellow-300">⚠️ Social links and profile details are hidden due to privacy settings</p>
                      </div>
                    )}

                    <button 
                      onClick={downloadProfilePDF}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      title="Download your profile as PDF"
                    >
                      📥 Download Profile PDF
                    </button>
                    
                    <button 
                      onClick={copyProfileLink}
                      className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        profileVisibility === 'public' 
                          ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' 
                          : 'bg-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                      disabled={profileVisibility !== 'public'}
                      title={profileVisibility === 'public' ? 'Share your public profile link' : 'Profile link can only be shared when profile is public'}
                    >
                      🔗 Copy Profile Link {profileVisibility !== 'public' && '(Private)'}
                    </button>

                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-orange-200/70'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}><strong>Privacy Levels:</strong></p>
                      <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        <li>🌐 <strong>Public:</strong> Visible to all users, profile link can be shared</li>
                        <li>🔒 <strong>Private:</strong> Visible only to you, not visible to any other user</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* 8️⃣ AI PERSONALIZATION PANEL */}
            <div
              ref={aiPanelRef}
              className={`${isDark ? 'backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30' : 'backdrop-blur-xl bg-white/85 border border-orange-200/70 shadow-sm'} rounded-2xl p-6 ${showAIPanel ? 'ring-2 ring-purple-500/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🤖</div>
                  <h3 className="text-xl font-bold">AI Insights</h3>
                </div>
                <button
                  onClick={() => isEditingAI ? saveAIInsights() : setIsEditingAI(true)}
                  className="text-xl hover:scale-110 transition"
                  title={isEditingAI ? 'Save' : 'Edit AI Insights'}
                >
                  {isEditingAI ? '💾' : '✏️'}
                </button>
              </div>

              <button
                onClick={generateAIInsights}
                disabled={isGeneratingAI}
                className={`w-full mb-3 py-2 rounded-lg font-semibold transition ${isGeneratingAI ? 'bg-gray-600 cursor-not-allowed opacity-70' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {isGeneratingAI ? 'Generating AI Insights...' : '✨ Generate AI Insights'}
              </button>

              {aiGenerationError && (
                <p className="mb-3 text-xs text-red-400">{aiGenerationError}</p>
              )}

              {/* Completion indicator */}
              <div className={`mb-3 p-2 rounded-lg text-xs ${completionBreakdown.aiInsights ? 'bg-green-600/20 text-green-300' : 'bg-blue-600/20 text-blue-300'}`}>
                {completionBreakdown.aiInsights ? (
                  '✅ Complete! (+5% to profile)'
                ) : (
                  '📝 Fill all 3 sections to complete (+5% to profile)'
                )}
              </div>
              
              <div className="space-y-3 text-sm">
                {/* Strengths */}
                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-orange-50/80 border border-orange-100'}`}>
                  <p className="text-purple-400 font-semibold mb-1">💪 Strengths</p>
                  {isEditingAI ? (
                    <textarea
                      value={aiInsights.strengths}
                      onChange={(e) => setAiInsights({...aiInsights, strengths: e.target.value})}
                      placeholder="e.g., Excellent progress in JavaScript frameworks..."
                      className="w-full bg-white/10 text-gray-300 rounded-lg p-2 border border-white/20 focus:border-purple-500 outline-none resize-none"
                      rows="2"
                    />
                  ) : (
                    aiInsights.strengths ? (
                      <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.strengths}</p>
                    ) : (
                      <p className={`${isDark ? 'text-gray-500' : 'text-slate-500'} italic`}>Not filled yet</p>
                    )
                  )}
                </div>
                
                {/* Suggestions */}
                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-orange-50/80 border border-orange-100'}`}>
                  <p className="text-blue-400 font-semibold mb-1">🎯 Suggestions</p>
                  {isEditingAI ? (
                    <textarea
                      value={aiInsights.suggestions}
                      onChange={(e) => setAiInsights({...aiInsights, suggestions: e.target.value})}
                      placeholder="e.g., Focus on Database optimization..."
                      className="w-full bg-white/10 text-gray-300 rounded-lg p-2 border border-white/20 focus:border-blue-500 outline-none resize-none"
                      rows="2"
                    />
                  ) : (
                    aiInsights.suggestions ? (
                      <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.suggestions}</p>
                    ) : (
                      <p className={`${isDark ? 'text-gray-500' : 'text-slate-500'} italic`}>Not filled yet</p>
                    )
                  )}
                </div>
                
                {/* Career Path */}
                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-orange-50/80 border border-orange-100'}`}>
                  <p className="text-green-400 font-semibold mb-1">🚀 Career Path</p>
                  {isEditingAI ? (
                    <textarea
                      value={aiInsights.careerPath}
                      onChange={(e) => setAiInsights({...aiInsights, careerPath: e.target.value})}
                      placeholder="e.g., On track to become Senior Full Stack Developer..."
                      className="w-full bg-white/10 text-gray-300 rounded-lg p-2 border border-white/20 focus:border-green-500 outline-none resize-none"
                      rows="2"
                    />
                  ) : (
                    aiInsights.careerPath ? (
                      <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.careerPath}</p>
                    ) : (
                      <p className={`${isDark ? 'text-gray-500' : 'text-slate-500'} italic`}>Not filled yet</p>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 7️⃣ SOCIAL & PRESENCE */}
            <div className={panelClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Social Links</h3>
                {viewerIsOwner && (
                  <button
                    onClick={() => isEditingSocial ? saveSocialLinks() : setIsEditingSocial(true)}
                    className="text-xl hover:scale-110 transition"
                    title={isEditingSocial ? 'Save' : 'Edit Social Links'}
                  >
                    {isEditingSocial ? '💾' : '✏️'}
                  </button>
                )}
              </div>
              
              {/* Show content only if profile is viewable or user is owner */}
              {canViewContent() ? (
                <div className="space-y-3">
                  {/* GitHub */}
                  <div className="p-3 bg-gray-600/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💻</span>
                      <span className="font-semibold">GitHub</span>
                    </div>
                    {isEditingSocial && viewerIsOwner ? (
                      <input
                        type="text"
                        value={socialLinks.github}
                        onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                        placeholder="https://github.com/yourusername"
                        className="w-full bg-white/10 text-gray-300 rounded-lg px-3 py-2 border border-white/20 focus:border-gray-400 outline-none text-sm"
                      />
                    ) : (
                      socialLinks.github ? (
                        <a 
                          href={socialLinks.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-sm underline block truncate"
                        >
                          {socialLinks.github}
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">No link added</p>
                      )
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💼</span>
                      <span className="font-semibold">LinkedIn</span>
                    </div>
                    {isEditingSocial && viewerIsOwner ? (
                      <input
                        type="text"
                        value={socialLinks.linkedin}
                        onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                        placeholder="https://linkedin.com/in/yourusername"
                        className="w-full bg-white/10 text-gray-300 rounded-lg px-3 py-2 border border-white/20 focus:border-blue-400 outline-none text-sm"
                      />
                    ) : (
                      socialLinks.linkedin ? (
                        <a 
                          href={socialLinks.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-sm underline block truncate"
                        >
                          {socialLinks.linkedin}
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">No link added</p>
                      )
                    )}
                  </div>

                  {/* Twitter */}
                  <div className="p-3 bg-cyan-600/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🐦</span>
                      <span className="font-semibold">Twitter</span>
                    </div>
                    {isEditingSocial && viewerIsOwner ? (
                      <input
                        type="text"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                        placeholder="https://twitter.com/yourusername"
                        className="w-full bg-white/10 text-gray-300 rounded-lg px-3 py-2 border border-white/20 focus:border-cyan-400 outline-none text-sm"
                      />
                    ) : (
                      socialLinks.twitter ? (
                        <a 
                          href={socialLinks.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-sm underline block truncate"
                        >
                          {socialLinks.twitter}
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">No link added</p>
                      )
                    )}
                  </div>

                  {/* Portfolio */}
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🌐</span>
                      <span className="font-semibold">Portfolio</span>
                    </div>
                    {isEditingSocial && viewerIsOwner ? (
                      <input
                        type="text"
                        value={socialLinks.portfolio}
                        onChange={(e) => setSocialLinks({...socialLinks, portfolio: e.target.value})}
                        placeholder="https://yourportfolio.com"
                        className="w-full bg-white/10 text-gray-300 rounded-lg px-3 py-2 border border-white/20 focus:border-purple-400 outline-none text-sm"
                      />
                    ) : (
                      socialLinks.portfolio ? (
                        <a 
                          href={socialLinks.portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-sm underline block truncate"
                        >
                          {socialLinks.portfolio}
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">No link added</p>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-600/20 rounded-lg border border-red-500/30">
                  <p className="text-red-300 text-sm">
                    🔒 This profile is private. Social links are not visible due to privacy settings.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-white/10">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold">Open for Collaboration</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>
            </div>

            {/* 9️⃣ PRIVACY & CONTROL */}
            {activeTab !== 'settings' && (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Profile Visibility</label>
                  <select 
                    value={profileVisibility}
                    onChange={(e) => handleProfileVisibilityChange(e.target.value)}
                    className="w-full bg-white/10 px-3 py-2 rounded-lg border border-white/20 focus:border-blue-500 outline-none select-readable"
                  >
                    <option value="public">🌐 Public</option>
                    <option value="private">🔒 Private</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">{getPrivacyDescription(profileVisibility)}</p>
                </div>

                {/* Privacy Info Cards */}
                <div className="p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
                  <p className="text-sm text-blue-300">
                    {profileVisibility === 'public' && '✅ Your profile is visible to everyone on SkillSwap'}
                    {profileVisibility === 'private' && '🔒 Your profile is hidden from everyone except you'}
                  </p>
                </div>

                {/* Social Links Visibility Info */}
                {(profileVisibility === 'private' && !viewerIsOwner) && (
                  <div className="p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
                    <p className="text-sm text-yellow-300">⚠️ Social links and profile details are hidden due to privacy settings</p>
                  </div>
                )}

                {/* Action Buttons */}
                <button 
                  onClick={downloadProfilePDF}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  title="Download your profile as PDF"
                >
                  📥 Download Profile PDF
                </button>
                
                <button 
                  onClick={copyProfileLink}
                  className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    profileVisibility === 'public' 
                      ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' 
                      : 'bg-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                  disabled={profileVisibility !== 'public'}
                  title={profileVisibility === 'public' ? 'Share your public profile link' : 'Profile link can only be shared when profile is public'}
                >
                  🔗 Copy Profile Link {profileVisibility !== 'public' && '(Private)'}
                </button>

                {/* Privacy Help */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-gray-400 mb-2"><strong>Privacy Levels:</strong></p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>🌐 <strong>Public:</strong> Visible to all users, profile link can be shared</li>
                    <li>🔒 <strong>Private:</strong> Visible only to you, not visible to any other user</li>
                  </ul>
                </div>
              </div>
            </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
