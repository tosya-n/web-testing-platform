// routes/teacherRoutes.js
const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { authMiddleware } = require('../middleware/authMiddleware')
const { roleMiddleware } = require('../middleware/roleMiddleware')

// Все роуты учителя требуют аутентификации и роли TEACHER
router.use(authMiddleware)
router.use(roleMiddleware('TEACHER', 'ADMIN')) 
// Если хотим, чтобы админ тоже мог действовать как учитель, добавим 'ADMIN'

router.get('/tests', teacherController.getTeacherTests)
router.post('/tests', teacherController.createTest)
router.put('/tests/:id', teacherController.updateTest)
router.post('/tests/:id/publish', teacherController.publishTest)

router.get('/test-results', teacherController.getTestResults)
router.post('/test-results/:resultId/reset', teacherController.resetTestResult)

module.exports = router
