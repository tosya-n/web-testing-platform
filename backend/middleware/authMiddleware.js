const jwt = require('jsonwebtoken')

module.exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Токен не найден' })
  }

  const token = authHeader.split(' ')[1] // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Неверный формат заголовка Authorization' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey')
    req.user = decoded // { userId, role, iat, exp }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Неверный токен' })
  }
}
