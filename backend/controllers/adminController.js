// controllers/adminController.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')

module.exports = {
  // GET /api/admin/users
  getAllUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          patronymic: true,
          role: true
        }
      })
      return res.json(users)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  },

  // PUT /api/admin/users/:id
  updateUser: async (req, res) => {
    try {
      const { id } = req.params
      const { email, firstName, lastName, patronymic, role, password } = req.body

      // Находим пользователя
      const user = await prisma.user.findUnique({ where: { id: Number(id) } })
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' })
      }

      // Готовим данные к обновлению
      const dataToUpdate = {}
      if (email) dataToUpdate.email = email
      if (firstName) dataToUpdate.firstName = firstName
      if (lastName) dataToUpdate.lastName = lastName
      if (patronymic !== undefined) dataToUpdate.patronymic = patronymic
      if (role) dataToUpdate.role = role
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10)
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: dataToUpdate
      })

      return res.json(updatedUser)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Ошибка сервера' })
    }
  }
}
