import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './HomePage.css'

function HomePage() {
  const user = useAuthStore((state) => state.user)

  const features = [
    {
      title: 'Быстрый поиск',
      description: 'Находите заказы рядом с вами',
      icon: (
        <motion.svg
          viewBox="0 0 24 24"
          className="feature-icon"
          whileHover={{ scale: 1.1, rotate: 15 }}
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
        </motion.svg>
      )
    },
    {
      title: 'Безопасные сделки',
      description: 'Система отзывов и рейтингов',
      icon: (
        <motion.svg
          viewBox="0 0 24 24"
          className="feature-icon"
          whileHover={{ scale: 1.1 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinejoin="round"/>
        </motion.svg>
      )
    },
    {
      title: 'Удобный чат',
      description: 'Общайтесь напрямую с заказчиком',
      icon: (
        <motion.svg
          viewBox="0 0 24 24"
          className="feature-icon"
          whileHover={{ scale: 1.1, rotate: -15 }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinejoin="round"/>
        </motion.svg>
      )
    }
  ]

  return (
    <div className="container">
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Добро пожаловать, {user?.first_name}!</h1>
        <p className="hero-subtitle">
          {user?.role === 'customer'
            ? 'Создавайте заявки и находите исполнителей'
            : 'Находите работу рядом с вами'}
        </p>

        <div className="hero-actions">
          {user?.role === 'customer' ? (
            <>
              <Link to="/my-jobs">
                <motion.button
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Мои заявки
                </motion.button>
              </Link>
              <Link to="/jobs/create">
                <motion.button
                  className="btn btn-warning"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Создать заявку
                </motion.button>
              </Link>
              <Link to="/jobs">
                <motion.button
                  className="btn btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Все заявки
                </motion.button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/jobs">
                <motion.button
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Найти работу
                </motion.button>
              </Link>
              <Link to="/my-applications">
                <motion.button
                  className="btn btn-success"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Мои отклики
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="feature-card card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            {feature.icon}
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default HomePage
