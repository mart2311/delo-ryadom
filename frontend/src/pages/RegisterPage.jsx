import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'contractor',
    phone: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/auth/register/', formData)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
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
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
              strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="7" r="4" strokeWidth="2" fill="none"/>
            <line x1="20" y1="8" x2="20" y2="14" strokeWidth="2" strokeLinecap="round"/>
            <line x1="23" y1="11" x2="17" y2="11" strokeWidth="2" strokeLinecap="round"/>
          </motion.svg>
          <h1>Регистрация</h1>
          <p>Присоединяйтесь к нам</p>
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
            <label>Роль</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="contractor">Исполнитель</option>
              <option value="customer">Заказчик</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                className="input"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Фамилия</label>
              <input
                type="text"
                className="input"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
          </div>

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
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
            Зарегистрироваться
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage
