import axios from 'axios'

const API_URL = '/api'

const userService = {
  getProfile: () =>
    axios.get(`${API_URL}/users/profile`),

  updateProfile: (profileData) =>
    axios.put(`${API_URL}/users/profile`, profileData),

  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    return axios.post(`${API_URL}/users/profile/picture`, formData)
  },

  searchProfiles: (name) =>
    axios.get(`${API_URL}/users/search`, { params: { name } }),

  getPublicProfileByUsername: (username) =>
    axios.get(`${API_URL}/users/profile/public/${encodeURIComponent(username)}`),

  getPublicProfileById: (userId) =>
    axios.get(`${API_URL}/users/profile/public-by-id/${userId}`),

  generateAiInsights: () =>
    axios.post(`${API_URL}/users/profile/ai-insights/generate`),

  getProgress: () =>
    axios.get(`${API_URL}/users/progress`),

  updateProgress: (progressData) =>
    axios.put(`${API_URL}/users/progress`, progressData),

  getLectureCertificate: (lectureId) =>
    axios.get(`${API_URL}/users/certificates/lecture/${lectureId}`),

  getPortfolio: () =>
    axios.get(`${API_URL}/users/portfolio`),

  updatePortfolio: (portfolioData) =>
    axios.put(`${API_URL}/users/portfolio`, portfolioData),

  followUser: (targetUserId) =>
    axios.post(`${API_URL}/users/follow`, { targetUserId }),

  unfollowUser: (targetUserId) =>
    axios.post(`${API_URL}/users/unfollow`, { targetUserId }),

  getFollowers: (userId) =>
    axios.get(`${API_URL}/users/followers`, { params: userId ? { userId } : {} }),

  getFollowing: (userId) =>
    axios.get(`${API_URL}/users/following`, { params: userId ? { userId } : {} }),
}

export default userService
