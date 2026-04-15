import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

const inviteService = {
  sendInvitation: (payload) => axios.post(`${API_BASE_URL}/api/invitations/send`, payload),
}

export default inviteService
