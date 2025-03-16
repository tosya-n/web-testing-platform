const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

module.exports = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, patronymic, email, password, passwordConfirmation } = req.body

      // Валидация
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Не все поля заполнены' })
      }
      if (password !== passwordConfirmation) {
        return res.status(400).json({ message: 'Пароли не совпадают' })
      }

      // Проверяем, нет ли уже такого пользователя
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10)

      // Создаём пользователя с ролью STUDENT
      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          patronymic,
          email,
          password: hashedPassword,
          role: 'STUDENT' // enum Role { STUDENT, TEACHER, ADMIN }
        }
      })

      return res.status(201).json({ message: 'Регистрация успешна', userId: newUser.id })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ message: 'Не все поля заполнены' })
      }

      // Ищем пользователя по email
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return res.status(401).json({ message: 'Неверный email или пароль' })
      }

      // Сравниваем пароль
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ message: 'Неверный email или пароль' })
      }

      // Генерируем JWT (или используем сессии)
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secretKey', // В идеале хранить в .env
        { expiresIn: '1d' }
      )

      return res.status(200).json({ message: 'Успешная авторизация', token })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  me: async (req, res) => {
    try {
      // Пользователь уже будет получен из middleware (если нужен)
      // Либо мы можем взять userId из req.user
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ message: 'Не авторизован' })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          patronymic: true,
          role: true
        }
      })

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' })
      }

      return res.status(200).json({ user })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  }
}
