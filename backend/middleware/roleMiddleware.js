// middleware/roleMiddleware.js
module.exports.roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
      const userRole = req.user?.role
      if (!userRole) {
        return res.status(401).json({ message: 'Не авторизован' })
      }
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Нет доступа' })
      }
      next()
    }
  }
  