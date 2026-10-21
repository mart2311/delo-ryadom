import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'
import StagesView from '../components/Stages/StagesView'
import './JobDetailPage.css'

function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const toast = useToast()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false)
  const [guaranteeText, setGuaranteeText] = useState('')

  const isCustomer = user?.role === 'customer'
  const isOwner = job?.customer?.id === user?.id
  const isAssignedContractor = job?.contractor?.id === user?.id
  const hasApplied = applications.some(app => app.applicant?.id === user?.id)

  useEffect(() => {
    if (id) fetchJobDetails()
  }, [id])

  const fetchJobDetails = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}/`)
      setJob(data)

      if (data.customer?.id === user?.id) {
        const { data: apps } = await api.get(`/jobs/${id}/applications/`)
        setApplications(Array.isArray(apps) ? apps : (apps.results || []))
      }
    } catch (err) {
      console.error('Ошибка загрузки заявки:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    try {
      await api.post('/applications/', {
        job: parseInt(id),
        message: applicationMessage,
        proposed_price: proposedPrice || null,
      })
      toast.success('Отклик отправлен!')
      navigate('/my-applications')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Ошибка отправки отклика')
    }
  }

  const handleAcceptApplication = async (appId) => {
    try {
      await api.post(`/applications/${appId}/accept/`)
      toast.success('Отклик принят, исполнитель назначен')
      fetchJobDetails()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка принятия отклика')
    }
  }

  const handleRejectApplication = async (appId) => {
    try {
      await api.post(`/applications/${appId}/reject/`)
      toast.info('Отклик отклонён')
      fetchJobDetails()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка отклонения отклика')
    }
  }

  const handleSubmitRating = async () => {
    try {
      await api.post(`/jobs/${id}/complete/`, { rating, comment: ratingComment })
      setShowRatingModal(false)

      try {
        await api.post('/messages/', {
          job: parseInt(id),
          content: `✅ Заявка завершена. Оценка: ${'⭐'.repeat(rating)} (${rating}/5)${ratingComment ? `\n\nОтзыв: ${ratingComment}` : ''}`,
        })
      } catch (msgErr) {
        console.error('Ошибка отправки сообщения:', msgErr)
      }

      toast.success('Заявка завершена и оценка выставлена')
      fetchJobDetails()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка завершения заявки')
    }
  }

  const handleOpenChat = async (partnerId) => {
    try {
      const { data: chats } = await api.get('/chats/')
      const list = Array.isArray(chats) ? chats : (chats.results || [])
      const existingChat = list.find(chat => chat.job?.id === parseInt(id))

      if (existingChat) {
        navigate('/chats', { state: { selectedChatId: existingChat.id } })
      } else {
        const { data: newChat } = await api.post('/chats/', {
          job: parseInt(id),
          contractor: partnerId,
        })
        toast.success('Чат создан')
        navigate('/chats', { state: { selectedChatId: newChat.id } })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Ошибка открытия чата')
    }
  }

  const handleStageAction = async (stageId, action) => {
    try {
      await api.post(`/stages/${stageId}/${action}/`)
      const label = action === 'start' ? 'Этап запущен' : action === 'complete' ? 'Этап завершён' : 'Этап обновлён'
      toast.success(label)
      fetchJobDetails()
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Ошибка обновления этапа')
    }
  }

  const handleSubmitGuarantee = async () => {
    if (!guaranteeText.trim()) return
    try {
      await api.post('/guarantee-claims/', {
        job: parseInt(id),
        description: guaranteeText.trim(),
      })
      setShowGuaranteeModal(false)
      setGuaranteeText('')
      toast.success('Обращение по гарантии отправлено. Сообщение продублировано в чат заявки.')
      fetchJobDetails()
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Ошибка отправки обращения')
    }
  }

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>
  }

  if (!job) {
    return <div className="container"><div className="error">Заявка не найдена</div></div>
  }

  const guaranteeUntil = job.guarantee_until ? new Date(job.guarantee_until) : null
  const guaranteeActive = guaranteeUntil && guaranteeUntil > new Date() && job.status === 'completed'

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          ← Назад
        </button>

        <div className="job-detail-grid">
          <div className="card">
            <div className="job-detail-header">
              <div>
                <h1>{job.title}</h1>
                <div className="job-category">
                  {job.category_details?.name}
                  {job.is_extended && <span className="extended-badge" style={{ marginLeft: 8 }}>🧩 Расширенная</span>}
                </div>
              </div>
              <span className={`status status-${job.status}`}>
                {job.status === 'open' ? 'Открыта' :
                 job.status === 'in_progress' ? 'В работе' :
                 job.status === 'completed' ? 'Завершена' : 'Отменена'}
              </span>
            </div>

            <div className="job-description-block">
              <h3>Описание</h3>
              <p>{job.description}</p>
            </div>

            <div className="job-meta-info">
              <div className="meta-item">
                <svg viewBox="0 0 24 24" className="meta-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2" fill="none"/>
                </svg>
                <div>
                  <div className="meta-label">Заказчик</div>
                  <Link to={`/users/${job.customer?.id}`} className="meta-value" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>
                    {job.customer?.first_name || 'Имя'} {job.customer?.last_name || 'Фамилия'}
                  </Link>
                </div>
              </div>

              {job.contractor && (
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" className="meta-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2" fill="none"/>
                  </svg>
                  <div>
                    <div className="meta-label">Исполнитель</div>
                    <Link to={`/users/${job.contractor?.id}`} className="meta-value" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>
                      {job.contractor?.first_name || 'Имя'} {job.contractor?.last_name || 'Фамилия'}
                      {job.contractor?.contractor_rating != null && ` ⭐ ${Number(job.contractor.contractor_rating).toFixed(2)}`}
                    </Link>
                  </div>
                </div>
              )}

              <div className="meta-item">
                <svg viewBox="0 0 24 24" className="meta-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="10" r="3" strokeWidth="2" fill="none"/>
                </svg>
                <div>
                  <div className="meta-label">Адрес</div>
                  <div className="meta-value">{job.address}</div>
                </div>
              </div>

              {job.deadline && (
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" className="meta-icon">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none"/>
                    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <div className="meta-label">Срок выполнения</div>
                    <div className="meta-value">{new Date(job.deadline).toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>
              )}

              <div className="meta-item">
                <svg viewBox="0 0 24 24" className="meta-icon">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none"/>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M12 18V6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div>
                  <div className="meta-label">Способ оплаты</div>
                  <div className="meta-value">
                    {job.payment_method === 'cash' ? 'Наличными' : 'Переводом на карту'}
                  </div>
                </div>
              </div>
            </div>

            {job.is_extended && (job.guarantee_days > 0 || job.guarantee_description) && (
              <div className="guarantee-block">
                <div className="guarantee-header">
                  <h3>🛡 Гарантия</h3>
                  {guaranteeActive && (
                    <span className="guarantee-badge active">
                      Действует до {guaranteeUntil.toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {!guaranteeActive && job.guarantee_days > 0 && (
                    <span className="guarantee-badge">{job.guarantee_days} дн. после завершения</span>
                  )}
                </div>
                {job.guarantee_description && <p>{job.guarantee_description}</p>}
                {guaranteeActive && isOwner && (
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: 12 }}
                    onClick={() => setShowGuaranteeModal(true)}
                  >
                    Обращение по гарантии
                  </button>
                )}
              </div>
            )}

            {job.is_extended && job.stages?.length > 0 && (
              <StagesView
                stages={job.stages}
                stagesProgress={job.stages_progress}
                canManage={(isOwner || isAssignedContractor) && job.status === 'in_progress'}
                onStageAction={handleStageAction}
              />
            )}

            {!isCustomer && !hasApplied && job.status === 'open' && (
              <form className="application-form" onSubmit={handleApply}>
                <h3>Откликнуться на заявку</h3>

                <div className="form-group">
                  <label>Ваше предложение</label>
                  <textarea
                    className="input"
                    rows="4"
                    placeholder="Опишите, почему вы подходите для этой работы..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Предложить свою цену (необязательно)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder={`${job.price} ₽`}
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                  />
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Отправить отклик
                </motion.button>
              </form>
            )}

            {isOwner && job.status === 'in_progress' && (
              <div className="complete-job-section">
                <h3>Завершить заявку</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Работа выполнена? Оцените исполнителя и завершите заявку.
                </p>
                <motion.button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowRatingModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Завершить и оценить
                </motion.button>
              </div>
            )}

            {isOwner && job.status === 'in_progress' && job.contractor && (
              <div style={{ marginTop: '24px' }}>
                <motion.button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => handleOpenChat(job.contractor.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💬 Открыть чат с исполнителем
                </motion.button>
              </div>
            )}

            {isAssignedContractor && job.status !== 'completed' && (
              <div style={{ marginTop: '24px' }}>
                <motion.button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => handleOpenChat(job.customer.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💬 Открыть чат с заказчиком
                </motion.button>
              </div>
            )}
          </div>

          <div className="job-sidebar">
            <div className="card">
              <div className="job-price-block">
                <div className="price-label">Цена</div>
                <div className="price-value">{job.price} ₽</div>
                <div className="payment-method">
                  {job.payment_method === 'cash' ? '💵 Наличными' : '💳 На карту'}
                </div>
              </div>
            </div>

            {job.is_extended && job.stages_progress && (
              <div className="card">
                <h3>Прогресс</h3>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${job.stages_progress.percent}%` }} />
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                  {job.stages_progress.done} из {job.stages_progress.total} этапов · {job.stages_progress.percent}%
                </div>
              </div>
            )}

            {isOwner && applications.length > 0 && (
              <div className="card">
                <h3>Отклики ({applications.length})</h3>
                <div className="applications-list">
                  {applications.map((app) => (
                    <div key={app.id} className="application-item">
                      <div className="app-header">
                        <Link to={`/users/${app.applicant?.id}`} className="app-name">
                          <span>{app.applicant?.first_name || 'Имя'} {app.applicant?.last_name || 'Фамилия'}</span>
                          {app.applicant?.contractor_rating != null && (
                            <span className="app-rating">
                              ⭐ {Number(app.applicant.contractor_rating).toFixed(2)}
                            </span>
                          )}
                        </Link>
                        <span className={`status app-status status-${app.status}`}>
                          {app.status === 'pending' ? 'Ожидает' :
                           app.status === 'accepted' ? 'Принят' : 'Отклонён'}
                        </span>
                      </div>

                      <p className="app-message">{app.message}</p>

                      {app.proposed_price && (
                        <div className="app-price">
                          Предложенная цена: {app.proposed_price} ₽
                        </div>
                      )}

                      {app.status === 'pending' && job.status === 'open' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <motion.button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcceptApplication(app.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Принять
                          </motion.button>
                          <motion.button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRejectApplication(app.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Отклонить
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showRatingModal && (
        <div className="rating-modal" onClick={() => setShowRatingModal(false)}>
          <motion.div
            className="rating-modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>Оценить исполнителя</h3>

            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  viewBox="0 0 24 24"
                  className={`star ${rating >= star ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    strokeWidth="2"
                  />
                </svg>
              ))}
            </div>

            <div className="form-group">
              <label>Комментарий (необязательно)</label>
              <textarea
                className="input"
                rows="4"
                placeholder="Оставьте отзыв о работе..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowRatingModal(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Отмена
              </motion.button>
              <motion.button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitRating}
                disabled={rating === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Завершить
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {showGuaranteeModal && (
        <div className="rating-modal" onClick={() => setShowGuaranteeModal(false)}>
          <motion.div
            className="rating-modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>🛡 Обращение по гарантии</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Опишите проблему — она будет передана исполнителю и зафиксирована в системе.
            </p>
            <div className="form-group">
              <textarea
                className="input"
                rows="5"
                placeholder="Что произошло..."
                value={guaranteeText}
                onChange={(e) => setGuaranteeText(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowGuaranteeModal(false)}
              >
                Отмена
              </motion.button>
              <motion.button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitGuarantee}
                disabled={!guaranteeText.trim()}
              >
                Отправить
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default JobDetailPage
