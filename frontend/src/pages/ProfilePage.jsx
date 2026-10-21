import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import './ProfilePage.css'

const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    telegram_username: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const authUser = useAuthStore(state => state.user)
  const updateUser = useAuthStore(state => state.updateUser)

  const isOwner = authUser?.id === user?.id
  const isExecutor = user?.role === 'executor' || user?.role === 'contractor'

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/users/me/')
      setUser(data)
      updateUser(data)

      setEditData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        telegram_username: data.telegram_username || ''
      })
    } catch {
      setError('Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        telegram_username: user.telegram_username || ''
      })
    }
    setIsEditing(!isEditing)
    setError('')
    setSuccess('')
  }

  const handleSaveProfile = async () => {
    try {
      setError('')
      setSuccess('')
      const { data } = await api.patch('/users/me/', editData)
      setUser(data)
      updateUser(data)
      setIsEditing(false)
      setSuccess('Профиль успешно обновлен!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка обновления профиля')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="loading">Загрузка профиля...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="error-message">{error || 'Не удалось загрузить профиль'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {success && (
          <motion.div
            className="success-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--primary-green)',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid var(--primary-green)'
            }}
          >
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginBottom: '24px' }}
          >
            {error}
          </motion.div>
        )}

        <div className="profile-header">
          <div className="profile-avatar">
            <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div className="profile-info">
            <h1>{user.first_name} {user.last_name}</h1>
            <div className="profile-role">
              {isExecutor ? 'Исполнитель' : 'Заказчик'}
            </div>
            <div className="profile-username">@{user.username}</div>
          </div>

          {isOwner && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditing ? (
                <>
                  <motion.button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Сохранить
                  </motion.button>
                  <motion.button
                    className="btn btn-secondary"
                    onClick={handleEditToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Отмена
                  </motion.button>
                </>
              ) : (
                <motion.button
                  className="btn btn-primary"
                  onClick={handleEditToggle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Редактировать
                </motion.button>
              )}
            </div>
          )}
        </div>

        <div className="card profile-main">
          <h2>Информация о профиле</h2>

          {isEditing ? (
            <div className="profile-edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.first_name}
                    onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.last_name}
                    onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="input"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  className="input"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Telegram Username</label>
                <input
                  type="text"
                  className="input"
                  value={editData.telegram_username}
                  onChange={(e) => setEditData({...editData, telegram_username: e.target.value})}
                  placeholder="@username"
                />
              </div>
            </div>
          ) : (
            <div className="profile-view">
              <div className="info-row">
                <span className="info-label">Имя:</span>
                <span className="info-value">{user.first_name || 'Не указано'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Фамилия:</span>
                <span className="info-value">{user.last_name || 'Не указано'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Телефон:</span>
                <span className="info-value">{user.phone || 'Не указан'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Telegram:</span>
                <span className="info-value">{user.telegram_username || 'Не указан'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Дата регистрации:</span>
                <span className="info-value">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('ru-RU')
                    : 'Неизвестно'}
                </span>
              </div>
            </div>
          )}

          {!isExecutor && (
            <>
              <div className="section-divider">
                <h3>Мои заявки</h3>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Link to="/my-jobs" style={{ flex: 1 }}>
                  <motion.button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Мои заявки
                  </motion.button>
                </Link>
                <Link to="/jobs/create" style={{ flex: 1 }}>
                  <motion.button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Создать заявку
                  </motion.button>
                </Link>
              </div>
            </>
          )}

          {isExecutor && (
            <>
              <div className="section-divider">
                <h3>Мои отклики</h3>
              </div>

              <Link to="/my-applications">
                <motion.button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '16px' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Посмотреть мои отклики
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ProfilePage
