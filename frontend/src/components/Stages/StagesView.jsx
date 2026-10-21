import { useState, useMemo } from 'react'
import './StagesView.css'

const STATUS_LABEL = {
  pending: 'Запланирован',
  in_progress: 'Выполняется',
  done: 'Завершён',
}

const RESPONSIBLE_LABEL = {
  contractor: 'Исполнитель',
  customer: 'Заказчик',
  both: 'Совместно',
}

function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

function fmtDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function StagesView({ stages, stagesProgress, canManage, onStageAction }) {
  const [view, setView] = useState('table')

  const sorted = useMemo(
    () => [...(stages || [])].sort((a, b) => a.order - b.order || a.id - b.id),
    [stages]
  )

  const ganttBounds = useMemo(() => {
    const dates = []
    sorted.forEach((s) => {
      if (s.planned_start) dates.push(new Date(s.planned_start))
      if (s.planned_end) dates.push(new Date(s.planned_end))
      if (s.actual_start) dates.push(new Date(s.actual_start))
      if (s.actual_end) dates.push(new Date(s.actual_end))
    })

    if (dates.length === 0) return null

    let min = new Date(Math.min(...dates))
    let max = new Date(Math.max(...dates))
    if (max <= min) max = new Date(min.getTime() + 24 * 3600 * 1000)
    const totalMs = max - min
    return { min, max, totalMs }
  }, [sorted])

  const computeGanttBar = (start, end) => {
    if (!ganttBounds || !start || !end) return null
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const left = ((s - ganttBounds.min.getTime()) / ganttBounds.totalMs) * 100
    const width = Math.max(((e - s) / ganttBounds.totalMs) * 100, 2)
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` }
  }

  return (
    <div className="stages-view">
      <div className="stages-toolbar">
        <h3>📋 Этапы выполнения</h3>
        <div className="stages-view-switch">
          <button
            type="button"
            className={`switch-btn ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            Таблица
          </button>
          <button
            type="button"
            className={`switch-btn ${view === 'gantt' ? 'active' : ''}`}
            onClick={() => setView('gantt')}
          >
            Гантт
          </button>
        </div>
      </div>

      {stagesProgress && (
        <div className="stages-progress-line">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${stagesProgress.percent}%` }} />
          </div>
          <span>{stagesProgress.done} / {stagesProgress.total} · {stagesProgress.percent}%</span>
        </div>
      )}

      {view === 'table' ? (
        <div className="stages-table-wrap">
          <table className="stages-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Этап</th>
                <th>Сроки</th>
                <th>Часы</th>
                <th>Ответственный</th>
                <th>Ресурсы</th>
                <th>Статус</th>
                {canManage && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id} className={`stage-row stage-${s.status}`}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="stage-title">{s.title}</div>
                    {s.description && <div className="stage-desc">{s.description}</div>}
                  </td>
                  <td>
                    {fmtDate(s.planned_start)} → {fmtDate(s.planned_end)}
                    {(s.actual_start || s.actual_end) && (
                      <div className="stage-actual">
                        факт: {fmtDateTime(s.actual_start)} → {fmtDateTime(s.actual_end)}
                      </div>
                    )}
                  </td>
                  <td>{s.estimated_hours ? `${s.estimated_hours} ч` : '—'}</td>
                  <td>{RESPONSIBLE_LABEL[s.responsible]}</td>
                  <td>{s.resources || '—'}</td>
                  <td>
                    <span className={`stage-status stage-status-${s.status}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      {s.status === 'pending' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => onStageAction(s.id, 'start')}>
                          Начать
                        </button>
                      )}
                      {s.status === 'in_progress' && (
                        <button className="btn btn-primary btn-sm" onClick={() => onStageAction(s.id, 'complete')}>
                          Завершить
                        </button>
                      )}
                      {s.status === 'done' && <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="gantt-wrap">
          {!ganttBounds && (
            <p style={{ color: 'var(--text-secondary)' }}>
              Чтобы построить диаграмму, у этапов должны быть указаны даты.
            </p>
          )}
          {ganttBounds && (
            <>
              <div className="gantt-axis">
                <span>{fmtDate(ganttBounds.min)}</span>
                <span>{fmtDate(ganttBounds.max)}</span>
              </div>
              <div className="gantt-rows">
                {sorted.map((s, i) => {
                  const planned = computeGanttBar(s.planned_start, s.planned_end)
                  const actual = computeGanttBar(s.actual_start, s.actual_end)
                  return (
                    <div className="gantt-row" key={s.id}>
                      <div className="gantt-row-label">{i + 1}. {s.title}</div>
                      <div className="gantt-row-track">
                        {planned && (
                          <div
                            className={`gantt-bar gantt-bar-planned stage-${s.status}`}
                            style={planned}
                            title={`План: ${fmtDate(s.planned_start)} → ${fmtDate(s.planned_end)}`}
                          />
                        )}
                        {actual && (
                          <div
                            className="gantt-bar gantt-bar-actual"
                            style={actual}
                            title={`Факт: ${fmtDateTime(s.actual_start)} → ${fmtDateTime(s.actual_end)}`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="gantt-legend">
                <span><i className="legend-dot legend-planned"></i> План</span>
                <span><i className="legend-dot legend-actual"></i> Факт</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
