import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps"
import api from '../api/client'
import './CreateJobPage.css'

const emptyStage = (order = 0) => ({
  order,
  title: '',
  description: '',
  planned_start: '',
  planned_end: '',
  estimated_hours: '',
  resources: '',
  responsible: 'contractor',
})

function CreateJobPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [mapCenter] = useState([55.751244, 37.618423])
  const [markerCoords, setMarkerCoords] = useState([55.751244, 37.618423])
  const [ymapsInstance, setYmapsInstance] = useState(null)

  const [mode, setMode] = useState('simple')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    latitude: 55.751244,
    longitude: 37.618423,
    address: '',
    deadline: '',
    payment_method: 'cash',
    guarantee_days: 0,
    guarantee_description: '',
  })
  const [stages, setStages] = useState([emptyStage(0)])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories/')
      setCategories(data)
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
    }
  }

  const handleMapClick = async (e) => {
    const coords = e.get('coords')
    setMarkerCoords(coords)

    if (ymapsInstance) {
      try {
        const geocoder = await ymapsInstance.geocode(coords)
        const firstGeoObject = geocoder.geoObjects.get(0)
        const address = firstGeoObject.getAddressLine()

        setFormData((prev) => ({
          ...prev,
          address: address || `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`,
          latitude: coords[0],
          longitude: coords[1],
        }))
      } catch (err) {
        setFormData((prev) => ({
          ...prev,
          address: `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`,
          latitude: coords[0],
          longitude: coords[1],
        }))
      }
    }
  }

  const handleYmapsLoad = (ymaps) => setYmapsInstance(ymaps)

  const updateStage = (idx, patch) => {
    setStages((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  const addStage = () => setStages((prev) => [...prev, emptyStage(prev.length)])

  const removeStage = (idx) =>
    setStages((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const isExtended = mode === 'extended'

    const payload = {
      ...formData,
      is_extended: isExtended,
      guarantee_days: isExtended ? parseInt(formData.guarantee_days || 0, 10) : 0,
      guarantee_description: isExtended ? formData.guarantee_description : '',
    }

    if (isExtended) {
      const cleanedStages = stages
        .filter((s) => s.title.trim())
        .map((s, i) => ({
          order: i,
          title: s.title,
          description: s.description,
          planned_start: s.planned_start || null,
          planned_end: s.planned_end || null,
          estimated_hours: s.estimated_hours || null,
          resources: s.resources,
          responsible: s.responsible,
        }))
      payload.stages = cleanedStages
    }

    try {
      await api.post('/jobs/', payload)
      navigate('/jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка создания заявки')
    }
  }

  return (
    <div className="container">
      <motion.div
        className="create-job-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Создать заявку</h1>
        </div>

        <div className="mode-switch">
          <button
            type="button"
            className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
            onClick={() => setMode('simple')}
          >
            ⚡ Простая
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'extended' ? 'active' : ''}`}
            onClick={() => setMode('extended')}
          >
            🧩 Расширенная
          </button>
          <p className="mode-hint">
            {mode === 'simple'
              ? 'Стандартная заявка: одно описание и цена.'
              : 'Этапы выполнения, ресурсы, гарантия — всё для крупных задач.'}
          </p>
        </div>

        <div className="create-job-content">
          <div className="card form-section">
            <h2>Информация о работе</h2>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название работы *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Например: Ремонт крана на кухне"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Категория *</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Описание *</label>
                <textarea
                  className="input"
                  rows="5"
                  placeholder="Опишите подробно что нужно сделать..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Цена (₽) *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="5000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Способ оплаты *</label>
                  <select
                    className="input"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    required
                  >
                    <option value="cash">Наличными</option>
                    <option value="card">Переводом на карту</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Срок выполнения</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Адрес *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Укажите адрес или выберите на карте"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              {mode === 'extended' && (
                <>
                  <div className="extended-section">
                    <h3>🛡 Гарантия</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Срок гарантии (дней)</label>
                        <input
                          type="number"
                          min="0"
                          className="input"
                          placeholder="30"
                          value={formData.guarantee_days}
                          onChange={(e) => setFormData({ ...formData, guarantee_days: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Что покрывает гарантия</label>
                      <textarea
                        className="input"
                        rows="3"
                        placeholder="Например: устранение протечек и переделка швов в течение указанного срока"
                        value={formData.guarantee_description}
                        onChange={(e) => setFormData({ ...formData, guarantee_description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="extended-section">
                    <div className="stages-header">
                      <h3>📋 Этапы выполнения</h3>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addStage}>
                        + Добавить этап
                      </button>
                    </div>
                    {stages.map((stage, idx) => (
                      <div className="stage-editor" key={idx}>
                        <div className="stage-editor-header">
                          <strong>Этап {idx + 1}</strong>
                          {stages.length > 1 && (
                            <button
                              type="button"
                              className="stage-remove"
                              onClick={() => removeStage(idx)}
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Название этапа *</label>
                          <input
                            type="text"
                            className="input"
                            value={stage.title}
                            onChange={(e) => updateStage(idx, { title: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Описание</label>
                          <textarea
                            className="input"
                            rows="2"
                            value={stage.description}
                            onChange={(e) => updateStage(idx, { description: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Старт</label>
                            <input
                              type="datetime-local"
                              className="input"
                              value={stage.planned_start}
                              onChange={(e) => updateStage(idx, { planned_start: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Финиш</label>
                            <input
                              type="datetime-local"
                              className="input"
                              value={stage.planned_end}
                              onChange={(e) => updateStage(idx, { planned_end: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Часы (оценка)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              className="input"
                              value={stage.estimated_hours}
                              onChange={(e) => updateStage(idx, { estimated_hours: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Ответственный</label>
                            <select
                              className="input"
                              value={stage.responsible}
                              onChange={(e) => updateStage(idx, { responsible: e.target.value })}
                            >
                              <option value="contractor">Исполнитель</option>
                              <option value="customer">Заказчик</option>
                              <option value="both">Совместно</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Ресурсы / материалы</label>
                          <textarea
                            className="input"
                            rows="2"
                            placeholder="Например: цемент, плитка, инструмент"
                            value={stage.resources}
                            onChange={(e) => updateStage(idx, { resources: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="form-actions">
                <motion.button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/jobs')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Отмена
                </motion.button>
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Создать заявку
                </motion.button>
              </div>
            </form>
          </div>

          <div className="card map-section">
            <h2>Местоположение</h2>
            <p className="map-hint">Кликните на карту, чтобы указать точное местоположение</p>

            <div className="map-container">
              <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY || '', lang: 'ru_RU' }}>
                <Map
                  defaultState={{ center: mapCenter, zoom: 10 }}
                  width="100%"
                  height="400px"
                  onClick={handleMapClick}
                  onLoad={handleYmapsLoad}
                >
                  <Placemark geometry={markerCoords} />
                </Map>
              </YMaps>
            </div>

            <div className="coordinates-info">
              <p>Координаты: {markerCoords[0].toFixed(6)}, {markerCoords[1].toFixed(6)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CreateJobPage
