const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// POST /api/auth/register
router.post('/register', authController.register)

// POST /api/auth/login
router.post('/login', authController.login)

// GET /api/auth/me
// Для этого эндпоинта нужно JWT middleware, чтобы user был доступен
const { authMiddleware } = require('../middleware/authMiddleware')
router.get('/me', authMiddleware, authController.me)

module.exports = router
