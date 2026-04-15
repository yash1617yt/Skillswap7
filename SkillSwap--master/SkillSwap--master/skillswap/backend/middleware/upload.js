const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cloudinary = require('../config/cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'

const useCloudinaryUploads = process.env.UPLOAD_PROVIDER === 'cloudinary' && hasCloudinaryConfig

const uploadsRoot = path.resolve(__dirname, '../uploads')
const videosDir = path.join(uploadsRoot, 'videos')
const thumbnailsDir = path.join(uploadsRoot, 'thumbnails')

if (!useCloudinaryUploads) {
  fs.mkdirSync(videosDir, { recursive: true })
  fs.mkdirSync(thumbnailsDir, { recursive: true })
}

// Configure storage for videos: Cloudinary (preferred) or local disk fallback
const storage = hasCloudinaryConfig
  && useCloudinaryUploads
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        const isVideo = file.mimetype?.startsWith('video/')

        if (isVideo) {
          return {
            folder: 'skillswap/videos',
            resource_type: 'video',
            allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
            transformation: [{ quality: 'auto' }],
            timeout: 600000,
          }
        }

        return {
          folder: 'skillswap/thumbnails',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ quality: 'auto' }],
          timeout: 600000,
        }
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const isVideo = file.mimetype?.startsWith('video/')
        cb(null, isVideo ? videosDir : thumbnailsDir)
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ''
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
        cb(null, `${Date.now()}-${base}${ext}`)
      },
    })

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isVideoField = file.fieldname === 'video'
    const isThumbnailField = file.fieldname === 'thumbnail'

    if (isVideoField) {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo']
      if (!allowedVideoTypes.includes(file.mimetype)) {
        cb(new Error('Invalid video type. Allowed: MP4, WEBM, MOV, MKV, AVI'))
        return
      }
      cb(null, true)
      return
    }

    if (isThumbnailField) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedImageTypes.includes(file.mimetype)) {
        cb(new Error('Invalid thumbnail type. Allowed: JPG, PNG, WEBP'))
        return
      }
      cb(null, true)
      return
    }

    cb(new Error('Unsupported upload field'))
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

module.exports = upload
