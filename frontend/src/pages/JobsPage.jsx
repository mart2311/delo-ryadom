import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import './JobsPage.css'

function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('open')
  const [searchQuery, setSearchQuery] = useState('')
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchCategories()
    fetchJobs()
  }, [selectedCategory, selectedStatus])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories/')
      setCategories(data)
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
    }
  }

  const fetchJobs = async () => {
    try {
      let url = '/jobs/'
      const params = new URLSearchParams()

      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)
      if (searchQuery) params.append('search', searchQuery)

      if (params.toString()) url += '?' + params.toString()

      const { data } = await api.get(url)
      setJobs(data)
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Заявки</h1>
          {user?.role === 'customer' && (
            <Link to="/jobs/create">
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Создать заявку
              </motion.button>
            </Link>
          )}
        </div>

        <div className="filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="input"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Найти
            </button>
          </form>

          <div className="filter-row">
            <div className="categories">
              <button
                className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Все категории
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

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

                {(job.is_extended || job.guarantee_days > 0) && (
                  <div className="job-badges">
                    {job.is_extended && <span className="extended-badge">Расширенная</span>}
                    {job.guarantee_days > 0 && (
                      <span className="guarantee-badge-inline">
                        🛡 Гарантия {job.guarantee_days} дн.
                      </span>
                    )}
                  </div>
                )}

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
            <p>Заявок не найдено</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default JobsPage
