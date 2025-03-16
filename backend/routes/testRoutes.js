const express = require('express')
const router = express.Router()
const testController = require('../controllers/testController')
const { authMiddleware } = require('../middleware/authMiddleware')


// GET /api/tests
router.get('/', testController.getTests)

// GET /api/tests/:code
router.get('/:code', testController.getTestByCode)

// GET /api/tests/:id/details
router.get('/:id/details', authMiddleware, testController.getTestDetails)

// POST /api/tests/:id/attempt
router.post('/:id/attempt', authMiddleware, testController.submitTestAttempt)

module.exports = router
