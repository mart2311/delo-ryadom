import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import './ProfilePage.css'

const UserProfilePage = () => {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsCount, setReviewsCount] = useState(0)

  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  useEffect(() => {
    if (!user) return
    if (user.role === 'contractor' && activeTab === 'reviews') loadReviews()
    if (activeTab === 'jobs') loadJobs()
  }, [user, activeTab])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get(`/users/${userId}/`)
      setUser(data)
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err)
      setError('Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      const { data } = await api.get(`/users/${userId}/reviews/`)
      const items = Array.isArray(data) ? data : (data.results || [])
      setReviews(items)
      setReviewsCount(Array.isArray(data) ? items.length : (data.count || items.length))
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  const loadJobs = async () => {
    try {
      setJobsLoading(true)
      const endpoint = user.role === 'contractor'
        ? `/users/${userId}/contractor-jobs/`
        : `/users/${userId}/customer-jobs/`
      const { data } = await api.get(endpoint)
      const items = Array.isArray(data) ? data : (data.results || [])
      setJobs(items)
    } catch (err) {
      console.error('Ошибка загрузки заявок пользователя:', err)
    } finally {
      setJobsLoading(false)
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

  if (error || !user) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="error-message">{error || 'Профиль не найден'}</div>
        </div>
      </div>
    )
  }

  const isContractor = user.role === 'contractor'
  const isCustomer = user.role === 'customer'
  const profile = user.contractor_profile

  const jobsTabLabel = isContractor ? 'Где был исполнителем' : 'Заявки заказчика'

  return (
    <div className="container">
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <div className="profile-info">
            <h1>{user.first_name} {user.last_name}</h1>
            <div className="profile-role">
              {isContractor ? 'Исполнитель' : 'Заказчик'}
            </div>
            <div className="profile-username">@{user.username}</div>
            {isContractor && profile && (
              <div className="profile-rating-badge">
                ⭐ {Number(profile.rating).toFixed(2)} · выполнено заявок: {profile.completed_jobs}
              </div>
            )}
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Информация
          </button>
          {isContractor && (
            <button
              className={`profile-tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Отзывы
            </button>
          )}
          <button
            className={`profile-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            {jobsTabLabel}
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="card profile-main">
            <h2>Информация о профиле</h2>

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
                <span className="info-label">На платформе с:</span>
                <span className="info-value">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('ru-RU')
                    : (user.date_joined ? new Date(user.date_joined).toLocaleDateString('ru-RU') : 'Неизвестно')}
                </span>
              </div>
            </div>

            {isContractor && profile && (
              <>
                <div className="section-divider">
                  <h3>Об исполнителе</h3>
                </div>
                {profile.bio && <p style={{ marginBottom: 16 }}>{profile.bio}</p>}
                <div className="profile-view">
                  <div className="info-row">
                    <span className="info-label">Опыт работы:</span>
                    <span className="info-value">{profile.experience_years} лет</span>
                  </div>
                  {profile.hourly_rate && (
                    <div className="info-row">
                      <span className="info-label">Ставка в час:</span>
                      <span className="info-value">{profile.hourly_rate} ₽</span>
                    </div>
                  )}
                  {profile.skills && (
                    <div className="info-row">
                      <span className="info-label">Навыки:</span>
                      <span className="info-value">{profile.skills}</span>
                    </div>
                  )}
                  {profile.portfolio && (
                    <div className="info-row">
                      <span className="info-label">Портфолио:</span>
                      <span className="info-value">{profile.portfolio}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reviews' && isContractor && (
          <div className="card profile-main">
            <h2>Отзывы {reviewsCount ? `(${reviewsCount})` : ''}</h2>
            {reviewsLoading && <div className="loading">Загрузка отзывов...</div>}
            {!reviewsLoading && reviews.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>Отзывов пока нет</p>
            )}
            <div className="reviews-list">
              {reviews.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-header">
                    <Link to={`/users/${r.customer?.id}`} className="review-author">
                      {r.customer?.first_name} {r.customer?.last_name}
                    </Link>
                    <div className="review-rating">{'⭐'.repeat(r.rating)}</div>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                  <div className="review-meta">
                    {r.job?.title && (
                      <Link to={`/jobs/${r.job.id}`} className="review-job">
                        По заявке: {r.job.title}
                      </Link>
                    )}
                    <span>{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="card profile-main">
            <h2>{jobsTabLabel}</h2>
            {jobsLoading && <div className="loading">Загрузка...</div>}
            {!jobsLoading && jobs.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>Заявок нет</p>
            )}
            <div className="user-jobs-list">
              {jobs.map((job) => (
                <Link to={`/jobs/${job.id}`} key={job.id} className="user-job-row">
                  <div>
                    <h4>{job.title}</h4>
                    <div className="user-job-meta">
                      {job.category_details?.name} · {job.address}
                    </div>
                  </div>
                  <div className="user-job-side">
                    <div className="user-job-price">{job.price} ₽</div>
                    <span className={`status status-${job.status}`}>
                      {job.status === 'open' ? 'Открыта'
                        : job.status === 'in_progress' ? 'В работе'
                        : job.status === 'completed' ? 'Завершена'
                        : 'Отменена'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default UserProfilePage
