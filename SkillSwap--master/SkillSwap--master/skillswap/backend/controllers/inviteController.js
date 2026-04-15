const fs = require('fs')
const path = require('path')
const { sendMail } = require('../services/mailService')
const INVITE_SENDER = 'skillswap797@gmail.com'

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const resolveInviteImagePath = () => {
  const configuredPath = String(process.env.INVITE_EMAIL_IMAGE_PATH || '').trim()

  if (configuredPath) {
    const absoluteConfiguredPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(__dirname, '..', configuredPath)

    if (fs.existsSync(absoluteConfiguredPath)) {
      return absoluteConfiguredPath
    }
  }

  const assetsDir = path.resolve(__dirname, '..', 'assets')
  if (!fs.existsSync(assetsDir)) {
    return null
  }

  const candidateNames = [
    'invite-email.png',
    'invite-email.jpg',
    'invite-email.jpeg',
    'invite-email.webp',
  ]

  for (const fileName of candidateNames) {
    const candidatePath = path.join(assetsDir, fileName)
    if (fs.existsSync(candidatePath)) {
      return candidatePath
    }
  }

  const firstImageInAssets = fs.readdirSync(assetsDir)
    .find((entry) => /\.(png|jpe?g|webp)$/i.test(entry))

  if (firstImageInAssets) {
    return path.join(assetsDir, firstImageInAssets)
  }

  return null
}

const buildInviteTemplate = ({ joinUrl }) => {
  const inviteImagePath = resolveInviteImagePath()
  const inviteImageUrl = String(process.env.INVITE_EMAIL_IMAGE_URL || '').trim()
  const imageSrc = inviteImagePath ? 'cid:skillswap-invite-image' : inviteImageUrl
  const useImageTemplate = true

  if (useImageTemplate && imageSrc) {
    const html = `
      <div style="margin:0;padding:0;background:#edf6fc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#edf6fc;padding:16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
                <tr>
                  <td style="padding:0;margin:0;line-height:0;">
                    <a href="${escapeHtml(joinUrl)}" style="text-decoration:none;display:block;">
                      <img src="${escapeHtml(imageSrc)}" alt="You're Invited to SkillSwap" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `

    const text = `You're Invited to SkillSwap!\n\nSign up now and use code SKILLSWAP15 to receive 15% off your first booking!\n\nJoin SkillSwap Today: ${joinUrl}`

    const attachments = inviteImagePath
      ? [
          {
            filename: path.basename(inviteImagePath),
            path: inviteImagePath,
            cid: 'skillswap-invite-image',
          },
        ]
      : []

    return { html, text, attachments, usesImageTemplate: true }
  }

  const html = `
    <div style="margin:0;padding:0;background:#f4f8fc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:20px 12px;background:#f4f8fc;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #d9e5f1;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 24px 18px;background:#e8f0f8;text-align:center;">
                  <p style="margin:0;color:#1f5f88;font-size:12px;font-weight:700;letter-spacing:1.5px;">SKILLSWAP</p>
                  <h1 style="margin:10px 0 0;color:#154d73;font-size:38px;line-height:1.3;font-weight:700;">You're Invited to SkillSwap</h1>
                  <p style="margin:10px 0 0;color:#45789a;font-size:22px;">Empowering Learning &amp; Growth</p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 28px 8px;text-align:center;">
                  <p style="margin:0;color:#2b3f51;font-size:24px;line-height:1.7;">
                    We’re excited to welcome you to <strong style="color:#1f5f88;">SkillSwap</strong> — a professional platform where learners and mentors connect to exchange practical skills and real-world knowledge.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:18px 28px 8px;">
                  <a href="${escapeHtml(joinUrl)}" style="display:inline-block;background:linear-gradient(180deg,#5dbfe5 0%,#3ea5d0 100%);border-radius:10px;padding:14px 28px;color:#ffffff;font-size:34px;font-weight:700;text-decoration:none;">Join SkillSwap Today</a>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 28px 28px;text-align:center;">
                  <p style="margin:0;color:#6b7f92;font-size:16px;line-height:1.7;">Warmly,</p>
                  <p style="margin:6px 0 0;color:#1f5f88;font-size:42px;font-weight:700;line-height:1.3;">The SkillSwap Team</p>
                  <p style="margin:14px 0 0;color:#5e7386;font-size:16px;">www.skillswap.com · hello@skillswap.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `

  const text = `You're Invited to SkillSwap\n\nWe’re excited to welcome you to SkillSwap — a professional platform where learners and mentors connect to exchange practical skills and real-world knowledge.\n\nJoin SkillSwap Today: ${joinUrl}\n\nWarmly,\nThe SkillSwap Team\nwww.skillswap.com\nhello@skillswap.com`

  return { html, text, attachments: [], usesImageTemplate: false }
}

exports.sendInvitation = async (req, res, next) => {
  try {
    const { recipientName, recipientEmail } = req.body

    const name = String(recipientName || '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Recipient name is required' })
    }

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' })
    }

    const email = String(recipientEmail).trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Enter a valid recipient email' })
    }

    if (email === INVITE_SENDER.toLowerCase()) {
      return res.status(400).json({
        message: 'Recipient email cannot be the SkillSwap sender email. Please enter the user email.',
      })
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000'
    const joinUrl = `${frontendBase.replace(/\/$/, '')}/register`

    const { html, text, attachments } = buildInviteTemplate({ joinUrl })

    console.log(`[Invite] sender=${INVITE_SENDER} recipient=${email}`)

    const info = await sendMail({
      to: email,
      subject: `You're Invited to SkillSwap!`,
      html,
      text,
      attachments,
    })

    console.log(`[Invite] accepted=${JSON.stringify(info?.accepted || [])} rejected=${JSON.stringify(info?.rejected || [])}`)

    const acceptedRecipients = Array.isArray(info?.accepted)
      ? info.accepted.map((item) => String(item || '').trim().toLowerCase())
      : []

    if (!acceptedRecipients.includes(email)) {
      return res.status(502).json({
        message: 'Mail server did not accept the entered recipient email. Please try again.',
        sender: INVITE_SENDER,
        target: email,
        delivery: {
          accepted: info?.accepted || [],
          rejected: info?.rejected || [],
        },
      })
    }

    res.status(200).json({
      message: `Invitation sent successfully to ${email}`,
      sender: INVITE_SENDER,
      delivery: {
        accepted: info?.accepted || [],
        rejected: info?.rejected || [],
      },
      target: email,
      invited: {
        name,
        email,
      },
    })
  } catch (error) {
    next(error)
  }
}
