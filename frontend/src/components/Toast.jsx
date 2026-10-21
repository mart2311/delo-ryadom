import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import './Toast.css'

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      className={`toast toast-${type}`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="toast-icon">
        {type === 'success' && (
          <svg viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {type === 'error' && (
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none"/>
            <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        {type === 'info' && (
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none"/>
            <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </motion.div>
  )
}

export default Toast
