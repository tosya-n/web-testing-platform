require('express-async-errors')

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
// Подключаем Prisma Client
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Импортируем роуты (создадим позже)
const authRoutes = require('./routes/authRoutes')
const testRoutes = require('./routes/testRoutes')
const teacherRoutes = require('./routes/teacherRoutes')
const adminRoutes = require('./routes/adminRoutes')

// Создаём приложение Express
const app = express()

// Базовые middleware
app.use(express.json())     // Для чтения JSON-тел
app.use(cors())             // Разрешаем кросс-доменные запросы
app.use(helmet())           // Безопасные заголовки

// Маршруты
app.use('/api/auth', authRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/admin', adminRoutes)

// Пример корневого эндпоинта
app.get('/', (req, res) => {
  res.send('Web Testing Platform API is running!')
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

// Запуск сервера
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
