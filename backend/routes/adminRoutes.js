// routes/adminRoutes.js
const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { authMiddleware } = require('../middleware/authMiddleware')
const { roleMiddleware } = require('../middleware/roleMiddleware')

// Все роуты админа требуют авторизации и роли ADMIN
router.use(authMiddleware)
router.use(roleMiddleware('ADMIN'))

router.get('/users', adminController.getAllUsers)
router.put('/users/:id', adminController.updateUser)

module.exports = router
