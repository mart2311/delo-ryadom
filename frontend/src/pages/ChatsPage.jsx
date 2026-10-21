import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import './ChatsPage.css'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001'

function ChatsPage() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (location.state?.selectedChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === location.state.selectedChatId)
      if (chat) {
        handleSelectChat(chat)
      }
    }
  }, [location.state, chats])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
      connectWebSocket(selectedChat.id)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [selectedChat?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChats = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/chats/')

      const sortedChats = (data || []).sort((a, b) => {
        const dateA = a.last_message?.created_at || a.updated_at || a.created_at
        const dateB = b.last_message?.created_at || b.updated_at || b.created_at
        return new Date(dateB) - new Date(dateA)
      })

      setChats(sortedChats)
    } catch {
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (chatId) => {
    try {
      const { data } = await api.get(`/chats/${chatId}/`)
      setMessages(data.messages || [])
      setSelectedChat(data)
    } catch {
    }
  }

  const markChatAsRead = async (chatId) => {
    try {
      await api.post(`/chats/${chatId}/mark_read/`)

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId
            ? { ...chat, unread_count: 0 }
            : chat
        )
      )
    } catch {
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
    if (chat.unread_count > 0) {
      markChatAsRead(chat.id)
    }
  }

  const connectWebSocket = (chatId) => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const token = useAuthStore.getState().token
    const wsUrl = `${WS_URL}/ws/chat/${chatId}?user_id=${user.id}&token=${encodeURIComponent(token || '')}`

    try {
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {}

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          const formattedMessage = {
            id: message.id,
            sender: { id: message.sender_id },
            content: message.content,
            created_at: message.timestamp
          }

          setMessages((prev) => [...prev, formattedMessage])

          setChats((prevChats) => {
            const updatedChats = prevChats.map(chat => {
              if (chat.id === chatId) {
                const isCurrentChat = selectedChat?.id === chatId
                return {
                  ...chat,
                  last_message: formattedMessage,
                  unread_count: isCurrentChat ? 0 : (chat.unread_count || 0) + 1
                }
              }
              return chat
            })

            return updatedChats.sort((a, b) => {
              const dateA = a.last_message?.created_at || a.updated_at || a.created_at
              const dateB = b.last_message?.created_at || b.updated_at || b.created_at
              return new Date(dateB) - new Date(dateA)
            })
          })
        } catch {
        }
      }

      websocket.onerror = () => {}
      websocket.onclose = () => {}

      wsRef.current = websocket
    } catch {
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    const messageData = {
      content: newMessage.trim(),
      user_id: user.id
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messageData))
        setNewMessage('')
      } catch {
      }
    } else {
      if (selectedChat) {
        connectWebSocket(selectedChat.id)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getChatPartnerInfo = (chat) => {
    if (!chat?.job) return { name: 'Собеседник', phone: null, telegram: null, id: null, role: null, rating: null, completedJobs: null, avatar: null, email: null }

    const isCustomerView = chat.job.customer?.id === user?.id
    const partner = isCustomerView ? chat.job.contractor : chat.job.customer

    if (!partner) {
      return {
        name: isCustomerView ? 'Исполнитель не назначен' : 'Заказчик',
        phone: null,
        telegram: null,
        id: null,
        role: isCustomerView ? 'contractor' : 'customer',
        rating: null,
        completedJobs: null,
        avatar: null,
        email: null,
      }
    }

    return {
      name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || (isCustomerView ? 'Исполнитель' : 'Заказчик'),
      phone: partner.phone,
      telegram: partner.telegram_username,
      id: partner.id,
      role: partner.role,
      rating: partner.contractor_rating,
      completedJobs: partner.completed_jobs,
      avatar: partner.avatar,
      email: partner.email,
    }
  }

  const isJobCompleted = selectedChat?.job?.status === 'completed'

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="loading">Загрузка чатов...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <motion.div
        className="chats-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">Чаты</h1>

        <div className="chats-layout">
          <div className="chats-sidebar card">
            <div className="chats-header">
              <h2>Диалоги</h2>
              <motion.svg
                viewBox="0 0 24 24"
                className="chat-icon"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  strokeWidth="2" fill="none" strokeLinejoin="round"/>
              </motion.svg>
            </div>

            <div className="chats-list">
              {chats.length === 0 ? (
                <div className="empty-chats">
                  <p>Нет активных чатов</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''} ${chat.unread_count > 0 ? 'unread' : ''}`}
                    onClick={() => handleSelectChat(chat)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="chat-item-content">
                      <h3>{chat.job?.title || 'Заявка'}</h3>
                      {chat.last_message && (
                        <p className="last-message">
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                    <div className="chat-item-meta">
                      {chat.last_message && (
                        <span className="chat-time">
                          {format(new Date(chat.last_message.created_at), 'HH:mm', { locale: ru })}
                        </span>
                      )}
                      {chat.unread_count > 0 && (
                        <span className="unread-badge">{chat.unread_count}</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="chat-main card">
            {selectedChat ? (
              <>
                {(() => {
                  const partnerInfo = getChatPartnerInfo(selectedChat)
                  const isContractor = partnerInfo.role === 'contractor'
                  const initials = (partnerInfo.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div className="chat-header-main">
                      <div className="chat-partner-card">
                        <div className="chat-partner-avatar">
                          {partnerInfo.avatar
                            ? <img src={partnerInfo.avatar} alt={partnerInfo.name} />
                            : <span>{initials || '👤'}</span>}
                        </div>
                        <div className="chat-partner-body">
                          <h2 style={{ marginBottom: 4 }}>
                            {selectedChat.job?.id ? (
                              <Link to={`/jobs/${selectedChat.job.id}`} className="chat-job-link">
                                {selectedChat.job?.title} →
                              </Link>
                            ) : selectedChat.job?.title}
                          </h2>
                          <div className="chat-partner-name">
                            {partnerInfo.id ? (
                              <Link to={`/users/${partnerInfo.id}`}>
                                {partnerInfo.name}
                              </Link>
                            ) : partnerInfo.name}
                            <span className="chat-partner-role">
                              {isContractor ? 'Исполнитель' : 'Заказчик'}
                            </span>
                            {isContractor && partnerInfo.rating != null && (
                              <span className="chat-partner-rating">
                                ⭐ {Number(partnerInfo.rating).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="chat-partner-contacts">
                            {partnerInfo.phone && <span>📞 {partnerInfo.phone}</span>}
                            {partnerInfo.telegram && <span>✈ @{partnerInfo.telegram.replace('@', '')}</span>}
                            {partnerInfo.email && <span>✉ {partnerInfo.email}</span>}
                            {isContractor && partnerInfo.completedJobs != null && (
                              <span>🛠 Выполнено: {partnerInfo.completedJobs}</span>
                            )}
                            {selectedChat.job?.payment_method && (
                              <span>💳 {selectedChat.job.payment_method === 'cash' ? 'Наличными' : 'На карту'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="chat-price">{selectedChat.job?.price} ₽</span>
                    </div>
                  )
                })()}

                <div className="messages-container">
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwn = message.sender?.id === user?.id
                      return (
                        <motion.div
                          key={`${message.id || index}-${message.created_at}`}
                          className={`message ${isOwn ? 'own' : 'other'}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="message-content">
                            {!isOwn && message.sender && (
                              <div className="message-sender">
                                {message.sender.first_name} {message.sender.last_name}
                              </div>
                            )}
                            <div className="message-text">{message.content}</div>
                            <div className="message-time">
                              {format(new Date(message.created_at), 'HH:mm', { locale: ru })}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {isJobCompleted ? (
                  <div className="chat-completed-overlay">
                    <h3>✓ Заявка завершена</h3>
                    <p>Работа выполнена и оценена</p>
                  </div>
                ) : (
                  <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      className="input message-input"
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <motion.button
                      type="submit"
                      className="btn btn-primary send-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!newMessage.trim()}
                    >
                      <svg viewBox="0 0 24 24" className="send-icon">
                        <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" strokeLinecap="round"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2"
                          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  </form>
                )}
              </>
            ) : (
              <div className="no-chat-selected">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="empty-chat-icon"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    strokeWidth="2" fill="none" strokeLinejoin="round"/>
                  <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="9" y1="13" x2="15" y2="13" strokeWidth="2" strokeLinecap="round"/>
                </motion.svg>
                <p>Выберите чат для начала общения</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ChatsPage
