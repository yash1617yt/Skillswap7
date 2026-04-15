const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController')
const authMiddleware = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimit')

const reviewActionLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20 })

// Create review (require authentication)
router.post('/', authMiddleware, reviewActionLimiter, reviewController.createReview)

// Create rating (require authentication)
router.post('/rating', authMiddleware, reviewActionLimiter, reviewController.createRating)

// Get mentor reviews (public)
router.get('/mentor/:mentorId', reviewController.getMentorReviews)

// Get mentor profile with reviews
router.get('/profile/:mentorId', reviewController.getMentorProfile)

// Get top mentors
router.get('/top-mentors', reviewController.getTopMentors)

module.exports = router
