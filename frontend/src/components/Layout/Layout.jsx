import { Outlet, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import './Layout.css'

function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <motion.header
        className="header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="header-content">
          <Link to="/" className="logo">
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="logo-icon" viewBox="0 0 24 24">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Дело рядом</span>
            </motion.div>
          </Link>

          <nav className="nav">
            <Link to="/">Главная</Link>
            <Link to="/jobs">Заявки</Link>
            {user?.role === 'customer' && (
              <Link to="/jobs/create">Создать заявку</Link>
            )}
            <Link to="/chats">Чаты</Link>
            <Link to="/profile">Профиль</Link>
          </nav>

          <motion.button
            className="btn btn-secondary"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Выйти
          </motion.button>
        </div>
      </motion.header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-links">
          <Link to="/about">О нас</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
        </div>
        <p>&copy; 2026 Дело рядом. Все права защищены.</p>
      </footer>
    </div>
  )
}

export default Layout
