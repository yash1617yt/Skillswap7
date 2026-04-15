const User = require('../models/User')
const Progress = require('../models/Progress')
const VideoProgress = require('../models/VideoProgress')
const Lecture = require('../models/Lecture')
const Video = require('../models/Video')
const Follow = require('../models/Follow')
const UserSkill = require('../models/UserSkill')
const Skill = require('../models/Skill')
const { Op } = require('sequelize')
const { canViewerAccessProfile, isMutualFollow, normalizeProfileVisibility } = require('../services/privacyService')

const PRIVATE_ACCOUNT_MESSAGE = 'This account is private'

const parseMaybeJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value

  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const ensureArray = (value) => {
  const parsed = parseMaybeJson(value, [])
  return Array.isArray(parsed) ? parsed : []
}

const ensureObject = (value) => {
  const parsed = parseMaybeJson(value, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

const ensureString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  return String(value)
}

const toPublicUploadUrl = (req, filePath) => {
  if (!filePath) return null
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  const normalizedPath = filePath.replace(/\\/g, '/')
  const marker = '/uploads/'
  const markerIndex = normalizedPath.lastIndexOf(marker)
  if (markerIndex === -1) return filePath

  const relativeUploadPath = normalizedPath.slice(markerIndex)
  return `${req.protocol}://${req.get('host')}${relativeUploadPath}`
}

const pickRandom = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items[Math.floor(Math.random() * items.length)]
}

const pickManyRandom = (items = [], count = 1) => {
  if (!Array.isArray(items) || items.length === 0) return []
  const pool = [...items]

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, Math.max(0, Math.min(count, pool.length)))
}

const toProfileSlug = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const getEmailLocalPart = (email = '') => {
  const normalized = String(email || '').trim().toLowerCase()
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0) return normalized
  return normalized.slice(0, atIndex)
}

const normalizeSearchText = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const buildProfileKeys = (userLike = {}) => {
  const name = String(userLike.name || '').trim()
  const nameSlug = toProfileSlug(name)
  const email = String(userLike.email || '').trim().toLowerCase()
  const emailLocal = getEmailLocalPart(email)
  const emailLocalSlug = toProfileSlug(emailLocal)

  const keys = new Set()
  ;[name, nameSlug, email, emailLocal, emailLocalSlug].forEach((value) => {
    const raw = String(value || '').trim().toLowerCase()
    if (!raw) return
    keys.add(raw)
    const compact = normalizeSearchText(raw)
    if (compact) keys.add(compact)
  })

  return {
    nameSlug,
    emailLocalSlug,
    keys,
  }
}

const buildPublicProfilePayload = async (targetUser, viewerId) => {
  const target = targetUser.toJSON()
  const [teachingSkills, learningSkills] = await Promise.all([
    UserSkill.findAll({
      where: { userId: target.id, type: 'teach' },
      include: [
        {
          model: Skill,
          attributes: ['title'],
        },
      ],
    }),
    UserSkill.findAll({
      where: { userId: target.id, type: 'learn' },
      include: [
        {
          model: Skill,
          attributes: ['title'],
        },
      ],
    }),
  ])

  const proficiencyToLevel = {
    Beginner: 25,
    Intermediate: 50,
    Advanced: 75,
    Expert: 100,
  }

  const skillsFromUserSkills = teachingSkills
    .map((entry) => ({
      name: ensureString(entry?.Skill?.title, '').trim(),
      level: proficiencyToLevel[entry?.proficiencyLevel] || 0,
    }))
    .filter((item) => item.name)

  const skillsFromLearningUserSkills = learningSkills
    .map((entry) => ({
      name: ensureString(entry?.Skill?.title, '').trim(),
      level: proficiencyToLevel[entry?.proficiencyLevel] || 0,
    }))
    .filter((item) => item.name)

  const learningSkillNames = new Set(
    learningSkills
      .map((entry) => ensureString(entry?.Skill?.title, '').trim().toLowerCase())
      .filter(Boolean)
  )

  const skillsFromProfile = ensureArray(target.skills)
    .map((item) => ({
      name: ensureString(item?.name, '').trim(),
      level: Math.max(0, Math.min(100, Number(item?.level || 0))),
    }))
    .filter((item) => item.name)

  const mergedSkillsMap = new Map()
  ;[...skillsFromProfile, ...skillsFromUserSkills, ...skillsFromLearningUserSkills].forEach((skill) => {
    const key = skill.name.toLowerCase()
    if (!key) return
    const existing = mergedSkillsMap.get(key)
    if (!existing || skill.level > existing.level) {
      mergedSkillsMap.set(key, skill)
    }
  })

  const mergedSkills = Array.from(mergedSkillsMap.values())

  const followersCount = await Follow.count({ where: { followingId: target.id } })
  const followingCount = await Follow.count({ where: { followerId: target.id } })
  const uploadedVideosCount = await Video.count({ where: { uploaderId: target.id } })
  const isFollowing = viewerId
    ? (await Follow.findOne({ where: { followerId: viewerId, followingId: target.id }, attributes: ['id'] })) !== null
    : false
  const isFriend = viewerId ? await isMutualFollow(target.id, viewerId) : false

  return {
    id: target.id,
    name: target.name,
    firstName: target.firstName || '',
    lastName: target.lastName || '',
    displayName: target.displayName || '',
    profileTitle: target.profileTitle || '',
    tagline: target.tagline || '',
    website: target.website || '',
    whatsapp: target.whatsapp || '',
    telegram: target.telegram || '',
    username: buildProfileKeys(target).nameSlug || buildProfileKeys(target).emailLocalSlug,
    email: target.email,
    profilePicture: target.profilePicture || null,
    bio: target.bio || '',
    location: target.location || '',
    language: target.language || '',
    timezone: target.timezone || '',
    joinedDate: target.joinedDate || '',
    isTeacher: Boolean(target.isTeacher),
    profileVisibility: normalizeProfileVisibility(target.profileVisibility),
    tokens: Number(target.tokens || 0),
    lecturesCompleted: Number(target.lecturesCompleted || 0),
    uploadedVideosCount: Number(uploadedVideosCount || 0),
    skills: mergedSkills,
    learningSkills: Array.from(learningSkillNames),
    projects: ensureArray(target.projects),
    socialLinks: ensureObject(target.socialLinks),
    aiInsights: ensureObject(target.aiInsights),
    followersCount,
    followingCount,
    isFollowing,
    isFriend,
  }
}

const getSkillSummary = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) {
    return { topSkill: null, avgLevel: 0, weakSkill: null }
  }

  const normalized = skills
    .map((item) => ({
      name: String(item?.name || '').trim(),
      level: Math.max(0, Math.min(100, Number(item?.level || 0))),
    }))
    .filter((item) => item.name)

  if (normalized.length === 0) {
    return { topSkill: null, avgLevel: 0, weakSkill: null }
  }

  const topSkill = normalized.reduce((acc, current) => (current.level > acc.level ? current : acc), normalized[0])
  const weakSkill = normalized.reduce((acc, current) => (current.level < acc.level ? current : acc), normalized[0])
  const avgLevel = Math.round(normalized.reduce((sum, item) => sum + item.level, 0) / normalized.length)

  return { topSkill, avgLevel, weakSkill }
}

const buildAiInsights = (user) => {
  const skills = ensureArray(user?.skills)
  const projects = ensureArray(user?.projects)
  const socialLinks = ensureObject(user?.socialLinks)
  const completed = Number(user?.lecturesCompleted || 0)
  const tokenBalance = Number(user?.tokens || 0)
  const { topSkill, avgLevel, weakSkill } = getSkillSummary(skills)

  const strengthTemplates = []
  if (topSkill) {
    strengthTemplates.push(
      `Your strongest edge right now is ${topSkill.name} (${topSkill.level}%), and that technical depth is visible in your profile momentum.`,
      `${topSkill.name} stands out as your signature strength at ${topSkill.level}%, giving you a strong advantage for advanced builds.`,
      `You consistently perform best in ${topSkill.name} (${topSkill.level}%), which is a great foundation for higher-impact engineering work.`
    )
  }
  if (projects.length > 0) {
    strengthTemplates.push(
      `You already have ${projects.length} practical project${projects.length === 1 ? '' : 's'} in your portfolio, which reflects execution and ownership.`,
      `Your profile shows ${projects.length} hands-on project${projects.length === 1 ? '' : 's'}, proving you convert learning into real output.`,
      `${projects.length} completed project${projects.length === 1 ? '' : 's'} indicate strong build consistency and practical problem-solving.`
    )
  }
  if (completed > 0) {
    strengthTemplates.push(
      `You have completed ${completed} learning milestone${completed === 1 ? '' : 's'}, showing reliable discipline and follow-through.`,
      `Completing ${completed} milestones highlights your consistency and willingness to finish what you start.`,
      `Your ${completed} completed milestones signal a strong growth mindset and long-term learning focus.`
    )
  }
  if (tokenBalance > 0) {
    strengthTemplates.push(
      `With ${tokenBalance} tokens, your activity level in the SkillSwap ecosystem is strong and sustained.`,
      `A token balance of ${tokenBalance} reflects healthy platform engagement and contribution behavior.`,
      `You maintain ${tokenBalance} tokens, which suggests active participation and consistent learning actions.`
    )
  }

  const selectedStrengths = pickManyRandom(strengthTemplates, 3)
  const strengths = selectedStrengths.length > 0
    ? selectedStrengths.join(' ')
    : pickRandom([
      'You are building a solid engineering base through consistent learning and project execution.',
      'Your profile reflects steady progress and a practical approach to technical growth.',
      'You are moving in the right direction with stable effort and good learning habits.'
    ])

  const socialCount = Object.values(socialLinks).filter((link) => typeof link === 'string' && link.trim()).length
  const suggestionTemplates = []
  if (weakSkill && weakSkill.level < 70) {
    suggestionTemplates.push(
      `Make ${weakSkill.name} a weekly focus area and push it from ${weakSkill.level}% to 75%+ with structured drills.`,
      `Prioritize ${weakSkill.name} in short daily sessions to close your current gap and improve confidence.`,
      `Create a 4-week roadmap for ${weakSkill.name} so your weaker area becomes a dependable strength.`
    )
  }
  if (projects.length < 3) {
    suggestionTemplates.push(
      'Add 1-2 outcome-driven portfolio projects with metrics, architecture notes, and deployment links.',
      'Build at least one end-to-end project featuring authentication, analytics, and production deployment.',
      'Increase portfolio depth with real-world case studies that clearly explain problem, solution, and impact.'
    )
  }
  if (socialCount < 2) {
    suggestionTemplates.push(
      'Strengthen professional visibility by keeping GitHub and LinkedIn active with regular updates.',
      'Improve discoverability: update public profiles, add project writeups, and keep links current.',
      'Expand credibility by posting cleaner README docs and publishing your best work links.'
    )
  }

  if (suggestionTemplates.length === 0) {
    suggestionTemplates.push(
      'Keep shipping advanced projects and document design trade-offs to stand out in senior interviews.',
      'Start mentoring peers and publishing technical breakdowns to accelerate leadership growth.',
      'Focus on system design and scalability patterns to move from strong builder to strategic engineer.'
    )
  }

  const suggestions = pickManyRandom(suggestionTemplates, 2).join(' ')

  const careerPathTemplates = []
  if (user?.isTeacher) {
    careerPathTemplates.push(
      topSkill
        ? `With your ${topSkill.name} strength, you are well-positioned for Senior Mentor Engineer and technical leadership roles.`
        : 'You are on a promising path toward becoming a high-impact mentor who combines technical depth with guidance.'
    )
    careerPathTemplates.push(
      'Your teaching orientation can evolve into lead-mentor responsibilities, curriculum ownership, and community leadership.'
    )
  } else if (topSkill && avgLevel >= 75) {
    careerPathTemplates.push(
      `With ${topSkill.name} as a core strength and average proficiency around ${avgLevel}%, you are trending toward Senior Full Stack Developer roles.`,
      `Your current skill profile supports a near-term transition into high-responsibility full-stack engineering positions.`,
      `You are approaching senior-level execution territory, especially if you pair your strengths with architecture depth.`
    )
  } else if (topSkill) {
    careerPathTemplates.push(
      `Deepen ${topSkill.name} and strengthen system design to move confidently into a mid-level full-stack role.`,
      `Your next growth phase is converting ${topSkill.name} expertise into end-to-end ownership and technical decision-making.`,
      `By expanding from ${topSkill.name} into architecture and scale thinking, you can unlock faster role progression.`
    )
  } else {
    careerPathTemplates.push(
      'You are currently building toward a strong full-stack foundation with clear long-term leadership potential.',
      'Your trajectory is positive; continued consistency can move you into impactful product engineering roles.',
      'You are on a steady path toward becoming a reliable full-stack contributor with growth into leadership tracks.'
    )
  }

  const careerPath = pickRandom(careerPathTemplates)

  return {
    strengths,
    suggestions,
    careerPath,
    generatedAt: new Date().toISOString(),
  }
}

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const normalizedUser = user.toJSON()
    normalizedUser.skills = ensureArray(normalizedUser.skills)
    normalizedUser.projects = ensureArray(normalizedUser.projects)
    normalizedUser.socialLinks = ensureObject(normalizedUser.socialLinks)
    normalizedUser.aiInsights = ensureObject(normalizedUser.aiInsights)
    normalizedUser.firstName = ensureString(normalizedUser.firstName, '')
    normalizedUser.lastName = ensureString(normalizedUser.lastName, '')
    normalizedUser.displayName = ensureString(normalizedUser.displayName, '')
    normalizedUser.website = ensureString(normalizedUser.website, '')
    normalizedUser.whatsapp = ensureString(normalizedUser.whatsapp, '')
    normalizedUser.telegram = ensureString(normalizedUser.telegram, '')
    normalizedUser.followersCount = await Follow.count({ where: { followingId: user.id } })
    normalizedUser.followingCount = await Follow.count({ where: { followerId: user.id } })
    normalizedUser.uploadedVideosCount = await Video.count({ where: { uploaderId: user.id } })

    res.json({ user: normalizedUser })
  } catch (error) {
    next(error)
  }
}

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const {
      name,
      firstName,
      lastName,
      displayName,
      profileVisibility,
      profilePicture,
      bio,
      location,
      isTeacher,
      profileTitle,
      tagline,
      language,
      timezone,
      joinedDate,
      website,
      whatsapp,
      telegram,
      skills,
      projects,
      socialLinks,
      aiInsights,
    } = req.body

    const updateData = {
      name: name !== undefined ? ensureString(name, '').trim() || user.name : user.name,
      bio: bio !== undefined ? ensureString(bio, '') : user.bio,
      location: location !== undefined ? location : user.location,
      isTeacher: isTeacher !== undefined ? isTeacher : user.isTeacher,
    }

    if (profileTitle !== undefined) updateData.profileTitle = ensureString(profileTitle, '').trim()
    if (firstName !== undefined) updateData.firstName = ensureString(firstName, '').trim()
    if (lastName !== undefined) updateData.lastName = ensureString(lastName, '').trim()
    if (displayName !== undefined) updateData.displayName = ensureString(displayName, '').trim()
    if (profileVisibility !== undefined) updateData.profileVisibility = normalizeProfileVisibility(profileVisibility)
    if (profilePicture !== undefined) updateData.profilePicture = ensureString(profilePicture, '').trim()
    if (tagline !== undefined) updateData.tagline = ensureString(tagline, '').trim()
    if (language !== undefined) updateData.language = ensureString(language, '').trim()
    if (timezone !== undefined) updateData.timezone = ensureString(timezone, '').trim()
    if (joinedDate !== undefined) updateData.joinedDate = ensureString(joinedDate, '').trim()
    if (website !== undefined) updateData.website = ensureString(website, '').trim()
    if (whatsapp !== undefined) updateData.whatsapp = ensureString(whatsapp, '').trim()
    if (telegram !== undefined) updateData.telegram = ensureString(telegram, '').trim()

    if (skills !== undefined) updateData.skills = ensureArray(skills)
    if (projects !== undefined) updateData.projects = ensureArray(projects)
    if (socialLinks !== undefined) updateData.socialLinks = ensureObject(socialLinks)
    if (aiInsights !== undefined) updateData.aiInsights = ensureObject(aiInsights)

    await user.update(updateData)

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        profileVisibility: normalizeProfileVisibility(user.profileVisibility),
        profileTitle: user.profileTitle || '',
        tagline: user.tagline || '',
        website: user.website || '',
        whatsapp: user.whatsapp || '',
        telegram: user.telegram || '',
        bio: user.bio,
        location: user.location,
        language: user.language || '',
        timezone: user.timezone || '',
        joinedDate: user.joinedDate || '',
        isTeacher: user.isTeacher,
        skills: ensureArray(user.skills),
        projects: ensureArray(user.projects),
        socialLinks: ensureObject(user.socialLinks),
        aiInsights: ensureObject(user.aiInsights),
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const uploadedFile = req.file
    if (!uploadedFile) {
      return res.status(400).json({ message: 'Profile picture file is required' })
    }

    if (!uploadedFile.mimetype || !uploadedFile.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed for profile picture' })
    }

    const profilePictureUrl = toPublicUploadUrl(req, uploadedFile.path)
    if (!profilePictureUrl) {
      return res.status(500).json({ message: 'Unable to process uploaded profile picture' })
    }

    await user.update({ profilePicture: profilePictureUrl })

    return res.json({
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || '',
        tokens: user.tokens,
        isTeacher: user.isTeacher,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.getProgress = async (req, res, next) => {
  try {
    const lectureProgress = await Progress.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Lecture,
          attributes: ['id', 'title', 'category', 'duration'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    })

    const videoProgress = await VideoProgress.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Video,
          attributes: ['id', 'title', 'skillTag', 'level', 'duration'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    })

    const progress = [
      ...lectureProgress.map((item) => ({
        ...item.toJSON(),
        type: 'lecture',
      })),
      ...videoProgress.map((item) => ({
        ...item.toJSON(),
        type: 'video',
      })),
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    const user = await User.findByPk(req.userId)

    res.json({
      progress,
      stats: {
        lecturesCompleted: user.lecturesCompleted,
        tasksCompleted: user.tasksCompleted,
        totalHours: user.totalHours,
        lectureProgressCount: lectureProgress.length,
        videoProgressCount: videoProgress.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.updateProgress = async (req, res, next) => {
  try {
    const { lectureId, videoId, completionPercentage } = req.body
    const normalizedCompletion = Math.max(0, Math.min(100, Number(completionPercentage) || 0))

    if (!lectureId && !videoId) {
      return res.status(400).json({ message: 'lectureId or videoId is required' })
    }

    let progress
    if (lectureId) {
      const [record, created] = await Progress.findOrCreate({
        where: { userId: req.userId, lectureId },
        defaults: { completionPercentage: normalizedCompletion, isCompleted: normalizedCompletion === 100 },
      })

      if (!created) {
        await record.update({
          completionPercentage: normalizedCompletion,
          isCompleted: normalizedCompletion === 100,
        })
      }

      progress = record
    } else {
      const [record, created] = await VideoProgress.findOrCreate({
        where: { userId: req.userId, videoId },
        defaults: { completionPercentage: normalizedCompletion, isCompleted: normalizedCompletion === 100 },
      })

      if (!created) {
        await record.update({
          completionPercentage: normalizedCompletion,
          isCompleted: normalizedCompletion === 100,
        })
      }

      progress = record
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`user:${req.userId}`).emit('progress:updated', {
        type: lectureId ? 'lecture' : 'video',
        lectureId: lectureId || null,
        videoId: videoId || null,
        completionPercentage: normalizedCompletion,
        isCompleted: normalizedCompletion === 100,
      })
    }

    res.json({
      message: 'Progress updated',
      progress,
    })
  } catch (error) {
    next(error)
  }
}

exports.getLectureCertificate = async (req, res, next) => {
  try {
    const lectureId = Number(req.params.lectureId)
    if (!Number.isInteger(lectureId) || lectureId <= 0) {
      return res.status(400).json({ message: 'Valid lectureId is required' })
    }

    const [user, lecture, progress] = await Promise.all([
      User.findByPk(req.userId),
      Lecture.findByPk(lectureId, {
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name'],
          },
        ],
      }),
      Progress.findOne({
        where: {
          userId: req.userId,
          lectureId,
        },
      }),
    ])

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' })
    }

    const completion = Number(progress?.completionPercentage || 0)
    const isCompleted = Boolean(progress?.isCompleted) || completion >= 100
    if (!isCompleted) {
      return res.status(403).json({
        message: 'Certificate is available only after completing the course',
        completionPercentage: completion,
      })
    }

    const learnerName = String(user.displayName || user.name || 'Learner').trim()
    const courseTitle = String(lecture.title || 'Course').trim()
    const instructorName = String(
      lecture?.teacher?.name || lecture.teacherName || 'SkillSwap Mentor'
    ).trim()
    const issuedAt = new Date(progress?.updatedAt || Date.now())
    const issueDate = issuedAt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const certificateId = `SS-${req.userId}-${lectureId}-${issuedAt.getTime()}`

    return res.status(200).json({
      message: 'Certificate generated successfully',
      certificate: {
        certificateId,
        learnerName,
        courseTitle,
        instructorName,
        issueDate,
        completionPercentage: completion,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.getPortfolio = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId)

    const Lecture = require('../models/Lecture')
    const lectures = await Lecture.findAll({
      where: { teacherId: req.userId },
    })

    res.json({
      portfolio: {
        name: user.name,
        bio: user.bio,
        isTeacher: user.isTeacher,
        lecturesCount: lectures.length,
        totalViews: lectures.reduce((sum, l) => sum + l.views, 0),
        lecturesCreated: lectures,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.updatePortfolio = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId)

    const { bio, isTeacher } = req.body

    await user.update({
      bio: bio || user.bio,
      isTeacher: isTeacher !== undefined ? isTeacher : user.isTeacher,
    })

    res.json({
      message: 'Portfolio updated',
      user: {
        name: user.name,
        bio: user.bio,
        isTeacher: user.isTeacher,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.generateAiInsights = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const aiInsights = buildAiInsights(user)
    await user.update({ aiInsights })

    res.json({
      message: 'AI insights generated successfully',
      aiInsights,
    })
  } catch (error) {
    next(error)
  }
}

exports.searchProfiles = async (req, res, next) => {
  try {
    const rawQuery = String(req.query.name || '').trim()
    if (!rawQuery) {
      return res.status(400).json({ message: 'Search name is required' })
    }

    const query = rawQuery.toLowerCase()
    const querySlug = toProfileSlug(rawQuery)
    const compactQuery = normalizeSearchText(rawQuery)

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'bio', 'profilePicture', 'isTeacher'],
      order: [['name', 'ASC']],
    })

    const rankedProfiles = users
      .map((item) => item.toJSON())
      .map((item) => {
        const keyPayload = buildProfileKeys(item)
        const username = keyPayload.nameSlug || keyPayload.emailLocalSlug
        const keyList = Array.from(keyPayload.keys)

        const isExact = keyList.includes(query) || keyList.includes(querySlug) || keyList.includes(compactQuery)
        const isPartial = keyList.some((key) => key.includes(query) || key.includes(querySlug) || key.includes(compactQuery))

        return {
          id: item.id,
          name: item.name,
          username,
          bio: item.bio || '',
          profilePicture: item.profilePicture || null,
          isTeacher: Boolean(item.isTeacher),
          __isExact: isExact,
          __isPartial: isPartial,
        }
      })
      .filter((item) => item.__isExact || item.__isPartial)
      .sort((a, b) => {
        if (a.__isExact && !b.__isExact) return -1
        if (!a.__isExact && b.__isExact) return 1
        return a.name.localeCompare(b.name)
      })

    const profiles = rankedProfiles
      .slice(0, 20)
      .map(({ __isExact, __isPartial, ...item }) => item)

    res.json({ profiles })
  } catch (error) {
    next(error)
  }
}

exports.getPublicProfileByUsername = async (req, res, next) => {
  try {
    const username = toProfileSlug(req.params.username || '')
    const compactUsername = normalizeSearchText(req.params.username || '')

    if (!username) {
      return res.status(400).json({ message: 'Invalid profile username' })
    }

    const users = await User.findAll()

    const targetUser = users.find((item) => {
      const { keys } = buildProfileKeys(item)
      return keys.has(username) || keys.has(compactUsername)
    })

    if (!targetUser) {
      return res.status(404).json({ message: 'Invalid candidate' })
    }

    const hasAccess = await canViewerAccessProfile({
      targetUserId: targetUser.id,
      viewerUserId: req.userId,
      profileVisibility: targetUser.profileVisibility,
    })

    if (!hasAccess) {
      return res.status(403).json({ message: PRIVATE_ACCOUNT_MESSAGE })
    }

    const profile = await buildPublicProfilePayload(targetUser, req.userId)
    res.json({ profile })
  } catch (error) {
    next(error)
  }
}

exports.getPublicProfileById = async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId)

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const targetUser = await User.findByPk(targetUserId)

    if (!targetUser) {
      return res.status(404).json({ message: 'Invalid candidate' })
    }

    const hasAccess = await canViewerAccessProfile({
      targetUserId: targetUser.id,
      viewerUserId: req.userId,
      profileVisibility: targetUser.profileVisibility,
    })

    if (!hasAccess) {
      return res.status(403).json({ message: PRIVATE_ACCOUNT_MESSAGE })
    }

    const profile = await buildPublicProfilePayload(targetUser, req.userId)
    res.json({ profile })
  } catch (error) {
    next(error)
  }
}

exports.followUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.body
    const followingId = Number(targetUserId)

    if (!Number.isInteger(followingId) || followingId <= 0) {
      return res.status(400).json({ message: 'Valid targetUserId is required' })
    }

    if (Number(req.userId) === followingId) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findByPk(followingId)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const [followRelation, created] = await Follow.findOrCreate({
      where: { followerId: req.userId, followingId },
      defaults: { followerId: req.userId, followingId },
    })

    const followersCount = await Follow.count({ where: { followingId } })

    res.json({
      message: created ? 'User followed successfully' : 'Already following this user',
      isFollowing: true,
      followersCount,
      followId: followRelation.id,
    })
  } catch (error) {
    next(error)
  }
}

exports.unfollowUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.body
    const followingId = Number(targetUserId)

    if (!Number.isInteger(followingId) || followingId <= 0) {
      return res.status(400).json({ message: 'Valid targetUserId is required' })
    }

    await Follow.destroy({
      where: { followerId: req.userId, followingId },
    })

    const followersCount = await Follow.count({ where: { followingId } })

    res.json({
      message: 'User unfollowed successfully',
      isFollowing: false,
      followersCount,
    })
  } catch (error) {
    next(error)
  }
}

const buildConnectionUsers = async (targetUserId, relationType = 'followers') => {
  const where = relationType === 'following'
    ? { followerId: targetUserId }
    : { followingId: targetUserId }

  const rows = await Follow.findAll({
    where,
    order: [['createdAt', 'DESC']],
  })

  const idKey = relationType === 'following' ? 'followingId' : 'followerId'
  const relatedUserIds = rows
    .map((row) => Number(row[idKey]))
    .filter((value) => Number.isInteger(value) && value > 0)

  if (relatedUserIds.length === 0) return []

  const relatedUsers = await User.findAll({
    where: {
      id: {
        [Op.in]: relatedUserIds,
      },
    },
    attributes: ['id', 'name', 'email', 'bio', 'profilePicture', 'isTeacher'],
  })

  const userMap = new Map(
    relatedUsers.map((entry) => [entry.id, entry.toJSON()])
  )

  return relatedUserIds
    .map((relatedId) => userMap.get(relatedId))
    .filter(Boolean)
    .map((item) => {
      const keyPayload = buildProfileKeys(item)
      return {
        id: item.id,
        name: item.name,
        username: keyPayload.nameSlug || keyPayload.emailLocalSlug,
        bio: item.bio || '',
        profilePicture: item.profilePicture || null,
        isTeacher: Boolean(item.isTeacher),
      }
    })
}

const parseTargetUserId = (req) => {
  const queryUserId = req.query?.userId
  if (queryUserId === undefined || queryUserId === null || String(queryUserId).trim() === '') {
    return Number(req.userId)
  }

  const parsed = Number(queryUserId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

exports.getFollowers = async (req, res, next) => {
  try {
    const targetUserId = parseTargetUserId(req)

    if (!targetUserId) {
      return res.status(400).json({ message: 'Valid userId is required' })
    }

    const targetUser = await User.findByPk(targetUserId)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const users = await buildConnectionUsers(targetUserId, 'followers')
    res.json({ users, total: users.length })
  } catch (error) {
    next(error)
  }
}

exports.getFollowing = async (req, res, next) => {
  try {
    const targetUserId = parseTargetUserId(req)

    if (!targetUserId) {
      return res.status(400).json({ message: 'Valid userId is required' })
    }

    const targetUser = await User.findByPk(targetUserId)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const users = await buildConnectionUsers(targetUserId, 'following')
    res.json({ users, total: users.length })
  } catch (error) {
    next(error)
  }
}
