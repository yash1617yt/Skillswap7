import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import { AuthContext } from '../context/AuthContext'
import userService from '../services/userService'

const toProfileSlug = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const normalizeAiInsights = (value) => ({
  strengths: typeof value?.strengths === 'string' ? value.strengths : '',
  suggestions: typeof value?.suggestions === 'string' ? value.suggestions : '',
  careerPath: typeof value?.careerPath === 'string' ? value.careerPath : '',
})

const PublicProfile = () => {
  const { isDark } = useContext(ThemeContext)
  const { loading: authLoading, isAuthenticated } = useContext(AuthContext)
  const { username, userId } = useParams()
  const navigate = useNavigate()

  const [searchName, setSearchName] = useState('')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followingActionLoading, setFollowingActionLoading] = useState(false)

  const aiInsights = useMemo(() => normalizeAiInsights(profile?.aiInsights), [profile?.aiInsights])

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const response = userId
        ? await userService.getPublicProfileById(userId)
        : await userService.getPublicProfileByUsername(username)
      setProfile(response?.data?.profile || null)
    } catch (loadError) {
      try {
        const fallbackQuery = userId ? String(userId) : username
        const fallbackSearch = await userService.searchProfiles(fallbackQuery)
        const candidates = fallbackSearch?.data?.profiles || []

        if (candidates.length > 0) {
          const bestMatch = candidates[0]
          if (bestMatch?.id && String(bestMatch.id) !== String(userId || '')) {
            navigate(`/profile/user/${bestMatch.id}`, { replace: true })
            return
          }

          if (bestMatch?.id) {
            const retry = await userService.getPublicProfileById(bestMatch.id)
            setProfile(retry?.data?.profile || null)
            setError('')
            return
          }
        }
      } catch {
      }

      setProfile(null)
      setError(loadError?.response?.data?.message || 'Invalid candidate')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return
    loadProfile()
  }, [username, userId, authLoading, isAuthenticated])

  const handleSearch = async (e) => {
    e.preventDefault()
    const query = searchName.trim()
    if (!query) return

    try {
      const response = await userService.searchProfiles(query)
      const profiles = response?.data?.profiles || []

      if (profiles.length > 0 && profiles[0]?.id) {
        setError('')
        navigate(`/profile/user/${profiles[0].id}`)
        return
      }
    } catch {
    }

    const slug = toProfileSlug(query)
    if (!slug) {
      setError('Invalid candidate')
      return
    }

    setError('')
    navigate(`/profile/${slug}`)
  }

  const handleFollowToggle = async () => {
    if (!profile?.id) return
    setFollowingActionLoading(true)

    try {
      if (profile.isFollowing) {
        const response = await userService.unfollowUser(profile.id)
        setProfile((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: Number(response?.data?.followersCount ?? prev?.followersCount ?? 0),
        }))
      } else {
        const response = await userService.followUser(profile.id)
        setProfile((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: Number(response?.data?.followersCount ?? prev?.followersCount ?? 0),
        }))
      }
    } catch (followError) {
      setError(followError?.response?.data?.message || 'Unable to update follow status')
    } finally {
      setFollowingActionLoading(false)
    }
  }

  const pageShellClass = isDark
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white py-8 px-4'
    : 'min-h-screen bg-transparent text-slate-900 py-8 px-4'

  const panelClass = isDark
    ? 'backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10'
    : 'backdrop-blur-xl bg-white/85 rounded-2xl p-6 border border-orange-200/70 shadow-sm'

  if (authLoading || loading) {
    return (
      <div className={pageShellClass}>
        <div className="max-w-5xl mx-auto">
          <div className={panelClass}>Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={pageShellClass}>
        <div className="max-w-5xl mx-auto space-y-4">
          <form onSubmit={handleSearch} className={panelClass}>
            <h2 className="text-xl font-bold mb-3">Search Profile</h2>
            <div className="flex gap-3">
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search by profile name (e.g. ninja)"
                className={`flex-1 px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-orange-200 text-slate-800'}`}
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Search</button>
            </div>
          </form>

          <div className={panelClass}>
            <p className="text-lg font-semibold text-red-400">{error || 'Invalid candidate'}</p>
            <Link to="/profile" className="inline-block mt-4 text-blue-400 hover:text-blue-300">← Back to My Profile</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className="max-w-6xl mx-auto space-y-6">
        <form onSubmit={handleSearch} className={panelClass}>
          <h2 className="text-xl font-bold mb-3">Search Profile</h2>
          <div className="flex gap-3">
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by profile name (e.g. ninja)"
              className={`flex-1 px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-orange-200 text-slate-800'}`}
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Search</button>
          </div>
        </form>

        {error && (
          <div className={`${panelClass} border-red-500/40`}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className={panelClass}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold">
                {profile.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <p className={isDark ? 'text-gray-300' : 'text-slate-600'}>@{toProfileSlug(profile.name)}</p>
                {profile.isTeacher && <p className="text-green-400 text-sm">✓ Verified Teacher</p>}
              </div>
            </div>
            <button
              onClick={handleFollowToggle}
              disabled={followingActionLoading}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${profile.isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:opacity-60`}
            >
              {followingActionLoading ? 'Please wait...' : profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
              <p className="text-xs opacity-80">Followers</p>
              <p className="text-xl font-bold">{profile.followersCount || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
              <p className="text-xs opacity-80">Following</p>
              <p className="text-xl font-bold">{profile.followingCount || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
              <p className="text-xs opacity-80">Tokens</p>
              <p className="text-xl font-bold">{profile.tokens || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
              <p className="text-xs opacity-80">Completed</p>
              <p className="text-xl font-bold">{profile.lecturesCompleted || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
              <p className="text-xs opacity-80">Videos</p>
              <p className="text-xl font-bold">{profile.uploadedVideosCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className={panelClass}>
              <h3 className="text-xl font-bold mb-3">About</h3>
              <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{profile.bio || 'No bio added yet.'}</p>
              {profile.location && <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>📍 {profile.location}</p>}
            </div>

            <div className={panelClass}>
              <h3 className="text-xl font-bold mb-3">Skills</h3>
              {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                <div className="space-y-2">
                  {profile.skills.map((skill, idx) => (
                    <div key={`${skill.name}-${idx}`} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{skill.name || 'Skill'}</span>
                        <span>{Number(skill.level || 0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>No skills added yet.</p>
              )}
            </div>

            <div className={panelClass}>
              <h3 className="text-xl font-bold mb-3">Projects</h3>
              {Array.isArray(profile.projects) && profile.projects.length > 0 ? (
                <div className="space-y-3">
                  {profile.projects.map((project, idx) => (
                    <div key={`${project.title}-${idx}`} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-orange-50 border border-orange-100'}`}>
                      <p className="font-semibold">{project.title || 'Untitled Project'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {Array.isArray(project.tech) ? project.tech.join(', ') : (project.tech || 'No tech stack provided')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>No projects added yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={panelClass}>
              <h3 className="text-xl font-bold mb-3">AI Insights</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-purple-400">💪 Strengths</p>
                  <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.strengths || 'Not available'}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-400">🎯 Suggestions</p>
                  <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.suggestions || 'Not available'}</p>
                </div>
                <div>
                  <p className="font-semibold text-green-400">🚀 Career Path</p>
                  <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>{aiInsights.careerPath || 'Not available'}</p>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h3 className="text-xl font-bold mb-3">Social Links</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(profile.socialLinks || {}).map(([key, value]) => (
                  value ? (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-blue-400 hover:text-blue-300 break-all"
                    >
                      {key}: {value}
                    </a>
                  ) : null
                ))}
                {!Object.values(profile.socialLinks || {}).some(Boolean) && (
                  <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>No social links shared.</p>
                )}
              </div>
            </div>

            <div className={panelClass}>
              <Link to="/profile" className="text-blue-400 hover:text-blue-300">← Back to My Profile</Link>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                This is read-only profile view. Edit/remove actions are disabled for other users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile
