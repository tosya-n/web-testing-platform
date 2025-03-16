// controllers/testController.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = {
  // GET /api/tests?classId=?&subjectId=?
  getTests: async (req, res) => {
    try {
      const { classId, subjectId } = req.query

      // Базовый запрос
      let where = { published: true }

      // Если передан classId
      if (classId) {
        where.classId = Number(classId)
      }
      // Если передан subjectId
      if (subjectId) {
        where.subjectId = Number(subjectId)
      }

      const tests = await prisma.test.findMany({
        where,
        include: {
          subject: true,
          class: true,
          teacher: {
            select: { firstName: true, lastName: true, patronymic: true }
          }
        }
      })

      return res.json(tests)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // GET /api/tests/:code
  getTestByCode: async (req, res) => {
    try {
      const { code } = req.params
      const test = await prisma.test.findUnique({
        where: { code },
        include: {
          subject: true,
          class: true,
          teacher: {
            select: { firstName: true, lastName: true, patronymic: true }
          }
        }
      })

      if (!test) {
        return res.status(404).json({ message: 'Тест не найден' })
      }

      return res.json(test)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // GET /api/tests/:id/details
  getTestDetails: async (req, res) => {
    try {
      const { id } = req.params
      const test = await prisma.test.findUnique({
        where: { id: Number(id) },
        include: {
          questions: {
            include: {
              answers: true
            }
          }
        }
      })

      if (!test) {
        return res.status(404).json({ message: 'Тест не найден' })
      }
      if (!test.published) {
        return res.status(400).json({ message: 'Тест не опубликован' })
      }

      return res.json(test)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // POST /api/tests/:id/attempt
  submitTestAttempt: async (req, res) => {
    try {
      const { id } = req.params
      const userId = req.user.userId
      const { answers } = req.body 
      // answers: массив вида [{ questionId, selectedAnswers: [1,2] }, ...]

      // Проверяем, что тест существует
      const test = await prisma.test.findUnique({
        where: { id: Number(id) },
        include: {
          questions: {
            include: { answers: true }
          }
        }
      })

      if (!test || !test.published) {
        return res.status(404).json({ message: 'Тест не найден или не опубликован' })
      }

      // Проверяем, не проходил ли пользователь уже тест
      const existingResult = await prisma.testResult.findFirst({
        where: {
          testId: Number(id),
          userId
        }
      })
      if (existingResult) {
        return res.status(400).json({ message: 'Вы уже проходили этот тест' })
      }

      // Подсчитываем результат
      let totalQuestions = test.questions.length
      let score = 0

      for (const question of test.questions) {
        // Находим ответы пользователя для данного вопроса
        const userAnswer = answers.find(a => a.questionId === question.id)
        if (!userAnswer) {
          // Пользователь не ответил на этот вопрос
          continue
        }
        // Выбираем ID правильных ответов
        const correctAnswers = question.answers
          .filter(ans => ans.isCorrect)
          .map(ans => ans.id)

        // Сравниваем
        const isCorrect = compareAnswers(question.type, correctAnswers, userAnswer.selectedAnswers)
        if (isCorrect) {
          score++
        }
      }

      // Сохраняем результат в TestResult
      const newResult = await prisma.testResult.create({
        data: {
          testId: Number(id),
          userId,
          score,
          totalQuestions
        }
      })

      return res.json({
        message: 'Тест пройден',
        score,
        totalQuestions
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  }
}

// Функция для сравнения ответов
function compareAnswers(questionType, correctAnswers, selectedAnswers) {
  // questionType: SINGLE | MULTIPLE
  // correctAnswers: [id1, id2, ...] правильные варианты
  // selectedAnswers: [id1, id2, ...] выбранные пользователем

  if (questionType === 'SINGLE') {
    // Один правильный ответ
    if (correctAnswers.length !== 1) return false
    return correctAnswers[0] === selectedAnswers[0]
  } else {
    // Несколько правильных
    // Проверим, что множества совпадают
    if (correctAnswers.length !== selectedAnswers.length) return false
    // Проверим, что каждый элемент совпадает
    const setCorrect = new Set(correctAnswers)
    for (let ans of selectedAnswers) {
      if (!setCorrect.has(ans)) return false
    }
    return true
  }
}
