import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../api/client'
import './JobsPage.css'

function MyJobsPage() {
  const [jobs, setJobs] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('open')

  useEffect(() => {
    fetchMyJobs()
  }, [selectedStatus])

  const fetchMyJobs = async () => {
    try {
      let url = '/jobs/my/'
      if (selectedStatus) {
        url += `?status=${selectedStatus}`
      }

      const { data } = await api.get(url)
      setJobs(data)
    } catch (err) {
      console.error('Ошибка загрузки моих заявок:', err)
    }
  }

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Мои заявки</h1>
          <Link to="/jobs/create">
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Создать заявку
            </motion.button>
          </Link>
        </div>

        <div className="filters">
          <div className="status-filters">
            <button
              className={`status-btn ${selectedStatus === 'open' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('open')}
            >
              Открыта
            </button>
            <button
              className={`status-btn ${selectedStatus === 'in_progress' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('in_progress')}
            >
              В работе
            </button>
            <button
              className={`status-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('completed')}
            >
              Завершена
            </button>
            <button
              className={`status-btn ${selectedStatus === '' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('')}
            >
              Все
            </button>
          </div>
        </div>

        <div className="jobs-grid">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/jobs/${job.id}`} className="job-card card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span className={`status status-${job.status}`}>
                    {job.status === 'open' ? 'Открыта' :
                     job.status === 'in_progress' ? 'В работе' : 'Завершена'}
                  </span>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-meta">
                  <div className="job-price">{job.price} ₽</div>
                  <div className="job-location">{job.address}</div>
                </div>

                <div className="job-footer">
                  <span>{job.category_details?.name}</span>
                  <span>{job.applications_count} откликов</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {jobs.length === 0 && (
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
            <p>У вас пока нет заявок</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MyJobsPage
