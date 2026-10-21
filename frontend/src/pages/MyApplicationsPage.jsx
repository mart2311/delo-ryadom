import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../api/client'
import './JobsPage.css'

function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('pending')

  useEffect(() => {
    fetchMyApplications()
  }, [selectedStatus])

  const fetchMyApplications = async () => {
    try {
      let url = '/applications/my/'
      if (selectedStatus) {
        url += `?status=${selectedStatus}`
      }

      const { data } = await api.get(url)
      const items = Array.isArray(data) ? data : (data.results || [])
      setApplications(items)
    } catch (err) {
      console.error('Ошибка загрузки моих откликов:', err)
    }
  }

  const statusLabel = (status) => {
    if (status === 'pending') return 'Ожидает'
    if (status === 'accepted') return 'Принят'
    if (status === 'rejected') return 'Отклонён'
    return status
  }

  const jobStatusLabel = (status) => {
    if (status === 'open') return 'Открыта'
    if (status === 'in_progress') return 'В работе'
    if (status === 'completed') return 'Завершена'
    if (status === 'cancelled') return 'Отменена'
    return 'Неизвестно'
  }

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Мои отклики</h1>
          <Link to="/jobs">
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Найти работу
            </motion.button>
          </Link>
        </div>

        <div className="filters">
          <div className="status-filters">
            {['pending', 'accepted', 'rejected', ''].map((st) => (
              <button
                key={st || 'all'}
                className={`status-btn ${selectedStatus === st ? 'active' : ''}`}
                onClick={() => setSelectedStatus(st)}
              >
                {st ? statusLabel(st) : 'Все'}
              </button>
            ))}
          </div>
        </div>

        <div className="jobs-grid">
          {applications.map((app, index) => {
            const job = app.job && typeof app.job === 'object' ? app.job : null
            const jobId = job?.id
            const isDeleted = !jobId

            const CardInner = (
              <>
                <div className="job-header">
                  <h3>{job?.title || 'Заявка удалена'}</h3>
                  <span className={`status status-${app.status}`}>
                    {statusLabel(app.status)}
                  </span>
                </div>

                <p className="job-description">{app.message}</p>

                <div className="job-meta">
                  <div className="job-price">
                    {app.proposed_price || job?.price || 0} ₽
                  </div>
                  <div className="job-location">{job?.address || 'Адрес не указан'}</div>
                </div>

                <div className="job-footer">
                  <span>{job?.category_details?.name || 'Категория'}</span>
                  <span>{job ? `Заявка: ${jobStatusLabel(job.status)}` : 'Заявка недоступна'}</span>
                </div>

                {job?.is_extended && (
                  <div className="extended-badge" style={{ marginTop: 8 }}>
                    🧩 Расширенная заявка
                  </div>
                )}
              </>
            )

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isDeleted ? (
                  <div className="job-card card" style={{ opacity: 0.7, cursor: 'default' }}>
                    {CardInner}
                  </div>
                ) : (
                  <Link to={`/jobs/${jobId}`} className="job-card card">
                    {CardInner}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>

        {applications.length === 0 && (
          <div className="empty-state">
            <motion.svg
              viewBox="0 0 24 24"
              className="empty-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </motion.svg>
            <p>У вас пока нет откликов</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MyApplicationsPage
