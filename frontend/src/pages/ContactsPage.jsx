import { motion } from 'framer-motion'
import './InfoPages.css'

function ContactsPage() {
  return (
    <div className="container">
      <motion.div
        className="info-page"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">Контакты (демонстрационная страница)</h1>

        <div className="card info-content">
          <h2>Свяжитесь с нами</h2>

          <p>
            Мы всегда рады помочь вам и ответить на любые вопросы.
            Выберите удобный способ связи:
          </p>

          <div className="contact-methods">
            <div className="contact-item">
              <motion.svg
                viewBox="0 0 24 24"
                className="contact-icon"
                whileHover={{ scale: 1.1 }}
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  strokeWidth="2" fill="none"/>
                <polyline points="22,6 12,13 2,6" strokeWidth="2" fill="none"/>
              </motion.svg>
              <div>
                <h3>Email</h3>
                <p>support@example.com</p>
                <p className="contact-description">
                  Ответим в течение 24 часов
                </p>
              </div>
            </div>

            <div className="contact-item">
              <motion.svg
                viewBox="0 0 24 24"
                className="contact-icon"
                whileHover={{ scale: 1.1 }}
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  strokeWidth="2" fill="none"/>
              </motion.svg>
              <div>
                <h3>Телефон</h3>
                <p>Не указан (демо)</p>
                <p className="contact-description">
                  Пн-Пт: 9:00 - 18:00 (МСК)
                </p>
              </div>
            </div>

            <div className="contact-item">
              <motion.svg
                viewBox="0 0 24 24"
                className="contact-icon"
                whileHover={{ scale: 1.1 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  strokeWidth="2" fill="none"/>
              </motion.svg>
              <div>
                <h3>Telegram</h3>
                <p>Не указан (демо)</p>
                <p className="contact-description">
                  Онлайн чат с поддержкой
                </p>
              </div>
            </div>
          </div>

          <h3>Офис</h3>
          <p>
            Москва, ул. Примерная, д. 123, офис 456
          </p>

          <h3>Часы работы</h3>
          <p>
            Понедельник - Пятница: 9:00 - 18:00 (МСК)<br />
            Суббота - Воскресенье: выходной
          </p>

          <h3>Для партнеров</h3>
          <p>
            По вопросам сотрудничества: partners@example.com
          </p>

          <div className="feedback-form" style={{ marginTop: '40px' }}>
            <h3>Быстрая связь</h3>
            <form>
              <div className="form-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Ваше имя"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  className="input"
                  placeholder="Email"
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  className="input"
                  rows="5"
                  placeholder="Ваше сообщение"
                  required
                />
              </div>
              <motion.button
                type="submit"
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Отправить сообщение
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ContactsPage
