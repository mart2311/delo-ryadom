import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { data } = await api.post('/auth/login/', formData)
      setAuth(data.access, data.refresh, null)

      const { data: userData } = await api.get('/auth/profile/')
      useAuthStore.getState().updateUser(userData)

      navigate('/')
    } catch (err) {
      setError('Неверные учетные данные')
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <motion.svg
            className="auth-icon"
            viewBox="0 0 24 24"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
          <h1>Вход в систему</h1>
          <p>Найдите работу или исполнителя рядом с вами</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Войти
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
