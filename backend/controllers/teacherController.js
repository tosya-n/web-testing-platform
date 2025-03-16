// controllers/teacherController.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { nanoid } = require('nanoid') // для генерации кода, если нужно

module.exports = {
  // GET /api/teacher/tests
  getTeacherTests: async (req, res) => {
    try {
      const userId = req.user.userId

      // Если роль ADMIN, можно вернуть все тесты или как-то иначе
      const tests = await prisma.test.findMany({
        where: { teacherId: userId },
        include: {
          subject: true,
          class: true
        }
      })
      return res.json(tests)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // POST /api/teacher/tests
  createTest: async (req, res) => {
    try {
      const userId = req.user.userId
      const { title, classId, subjectId, banner, duration } = req.body

      // Создаём тест (ещё не опубликован)
      const newTest = await prisma.test.create({
        data: {
          title,
          classId,
          subjectId,
          banner,
          duration,
          teacherId: userId,
          published: false
        }
      })

      return res.status(201).json(newTest)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // PUT /api/teacher/tests/:id
  updateTest: async (req, res) => {
    try {
      const { id } = req.params
      const userId = req.user.userId

      // Проверяем, что тест принадлежит текущему пользователю
      const test = await prisma.test.findUnique({ where: { id: Number(id) } })
      if (!test) {
        return res.status(404).json({ message: 'Тест не найден' })
      }
      if (test.teacherId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа к редактированию' })
      }
      if (test.published) {
        return res.status(400).json({ message: 'Тест уже опубликован' })
      }

      const updated = await prisma.test.update({
        where: { id: Number(id) },
        data: req.body
      })

      return res.json(updated)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // POST /api/teacher/tests/:id/publish
  publishTest: async (req, res) => {
    try {
      const { id } = req.params
      const userId = req.user.userId

      const test = await prisma.test.findUnique({ where: { id: Number(id) } })
      if (!test) {
        return res.status(404).json({ message: 'Тест не найден' })
      }
      if (test.teacherId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа' })
      }
      if (test.published) {
        return res.status(400).json({ message: 'Тест уже опубликован' })
      }

      // Генерируем уникальный код
      const code = nanoid(8)

      const publishedTest = await prisma.test.update({
        where: { id: Number(id) },
        data: {
          published: true,
          code
        }
      })

      return res.json({ message: 'Тест опубликован', code: publishedTest.code })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // GET /api/teacher/test-results
  getTestResults: async (req, res) => {
    try {
      const userId = req.user.userId

      // Выбираем все результаты, но только по тестам, созданным данным учителем
      // Или если ADMIN — все
      const tests = await prisma.test.findMany({
        where: req.user.role === 'ADMIN' ? {} : { teacherId: userId },
        select: {
          id: true,
          title: true,
          testResults: {
            include: {
              user: {
                select: { email: true, firstName: true, lastName: true }
              }
            }
          }
        }
      })

      // Можно трансформировать результат под нужный формат
      return res.json(tests)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // POST /api/teacher/test-results/:resultId/reset
  resetTestResult: async (req, res) => {
    try {
      const { resultId } = req.params
      // Нужно найти TestResult, затем убедиться, что test принадлежит teacher
      const result = await prisma.testResult.findUnique({
        where: { id: Number(resultId) },
        include: { test: true }
      })

      if (!result) {
        return res.status(404).json({ message: 'Результат не найден' })
      }

      // Проверка на владельца теста
      if (result.test.teacherId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Нет доступа' })
      }

      // Удаляем TestResult или обнуляем
      await prisma.testResult.delete({ where: { id: result.id } })

      return res.json({ message: 'Результат сброшен, пересдача разрешена' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  }
}
