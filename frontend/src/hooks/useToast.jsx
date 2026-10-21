import { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '../components/ToastContainer'

const ToastContext = createContext(null)

let toastIdCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const value = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    }
  }
  return ctx
}
