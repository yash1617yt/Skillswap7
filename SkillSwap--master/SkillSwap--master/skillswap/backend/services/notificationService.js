const User = require('../models/User')
const { hasSmtpConfig, sendMail } = require('./mailService')

const createNotification = async ({
  req,
  userId,
  type = 'general',
  title = 'Notification',
  message = '',
  metadata = {},
  emailSubject,
  emailText,
  emailHtml,
}) => {
  const normalizedUserId = Number(userId)
  if (!normalizedUserId) {
    return { delivered: false, reason: 'invalid_user' }
  }

  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    userId: normalizedUserId,
    type,
    title,
    message,
    metadata,
    createdAt: new Date().toISOString(),
  }

  const io = req?.app?.get?.('io')
  if (io) {
    io.to(`user:${normalizedUserId}`).emit('notification:new', payload)
  }

  let emailSent = false
  try {
    const shouldSendEmail = Boolean(emailSubject && (emailText || emailHtml))
    if (shouldSendEmail && hasSmtpConfig()) {
      const user = await User.findByPk(normalizedUserId, { attributes: ['email', 'name'] })
      if (user?.email) {
        await sendMail({
          to: user.email,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        })
        emailSent = true
      }
    }
  } catch (error) {
    console.warn('[notificationService] Email delivery failed:', error.message)
  }

  return {
    delivered: true,
    emailSent,
    notification: payload,
  }
}

module.exports = {
  createNotification,
}
