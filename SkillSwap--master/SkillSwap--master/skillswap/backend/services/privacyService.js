const Follow = require('../models/Follow')

const normalizeProfileVisibility = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'private' || normalized === 'friends') return normalized
  return 'public'
}

const isMutualFollow = async (userAId, userBId) => {
  const a = Number(userAId)
  const b = Number(userBId)
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0 || a === b) {
    return false
  }

  const [aFollowsB, bFollowsA] = await Promise.all([
    Follow.findOne({ where: { followerId: a, followingId: b }, attributes: ['id'] }),
    Follow.findOne({ where: { followerId: b, followingId: a }, attributes: ['id'] }),
  ])

  return Boolean(aFollowsB && bFollowsA)
}

const canViewerAccessProfile = async ({ targetUserId, viewerUserId, profileVisibility }) => {
  const targetId = Number(targetUserId)
  const viewerId = Number(viewerUserId)
  const visibility = normalizeProfileVisibility(profileVisibility)

  if (!Number.isInteger(targetId) || targetId <= 0) return false
  if (Number.isInteger(viewerId) && viewerId === targetId) return true
  if (visibility === 'public') return true
  if (!Number.isInteger(viewerId) || viewerId <= 0) return false
  if (visibility === 'private') return false

  return isMutualFollow(targetId, viewerId)
}

module.exports = {
  normalizeProfileVisibility,
  isMutualFollow,
  canViewerAccessProfile,
}
