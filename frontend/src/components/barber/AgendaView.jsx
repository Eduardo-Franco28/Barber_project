import { useEffect, useState } from 'react';

import {
  cancelAppointment,
  listAppointmentsBetween,
  markAppointmentDone,
} from '../../api/appointments.js';
import {
  formatApptTime,
  formatDayLong,
  instantToShopDate,
  plusDaysISO,
  todayISO,
} from '../../lib/datetime.js';
import { Button } from '../Button.jsx';

const STATUS_LABEL = { done: 'Concluído', canceled: 'Cancelado' };

function shiftDay(dateString, delta) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function AgendaView() {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState(null);
  const [todayCount, setTodayCount] = useState(null);
  const [weekCount, setWeekCount] = useState(null);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadDay(day) {
    setItems(null);
    try {
      const data = await listAppointmentsBetween(day, day);
      setItems(data.appointments);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadStats() {
    try {
      const data = await listAppointmentsBetween(todayISO(), plusDaysISO(7));
      const scheduled = data.appointments.filter((a) => a.status === 'scheduled');
      setWeekCount(scheduled.length);
      const today = todayISO();
      setTodayCount(scheduled.filter((a) => instantToShopDate(a.start_at) === today).length);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDay(date);
  }, [date]);

  useEffect(() => {
    loadStats();
  }, []);

  async function act(id, action) {
    setBusy(true);
    setError(null);
    try {
      if (action === 'done') {
        await markAppointmentDone(id);
      } else {
        await cancelAppointment(id);
      }
      await Promise.all([loadDay(date), loadStats()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmingId(null);
      setBusy(false);
    }
  }

  return (
    <div className="view" data-testid="agenda-view">
      {error && <div className="form-error">{error}</div>}

      <div className="stats">
        <div className="stat">
          <div className="stat__num" data-testid="stat-today">{todayCount ?? '–'}</div>
          <div className="stat__label">hoje</div>
        </div>
        <div className="stat">
          <div className="stat__num" data-testid="stat-week">{weekCount ?? '–'}</div>
          <div className="stat__label">próx. 7 dias</div>
        </div>
      </div>

      <div className="day-nav">
        <Button variant="ghost" className="btn--small" aria-label="Dia anterior" onClick={() => setDate(shiftDay(date, -1))}>
          ←
        </Button>
        <input
          type="date"
          className="field__input date-input"
          data-testid="agenda-date"
          value={date}
          onChange={(event) => event.target.value && setDate(event.target.value)}
        />
        <Button variant="ghost" className="btn--small" aria-label="Próximo dia" onClick={() => setDate(shiftDay(date, 1))}>
          →
        </Button>
        <Button variant="ghost" className="btn--small" onClick={() => setDate(todayISO())}>
          Hoje
        </Button>
      </div>

      <p className="muted">{formatDayLong(date)}</p>

      {items === null ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="muted">Nenhum atendimento neste dia.</p>
      ) : (
        <div className="appt-list">
          {items.map((appointment) => (
            <div key={appointment.id} className="appt" data-testid="agenda-appt">
              <div>
                <div className="appt__when">
                  <strong>{formatApptTime(appointment.start_at)}</strong>
                  {' – '}
                  {formatApptTime(appointment.end_at)} · {appointment.client?.name}
                </div>
                <div className="muted">
                  {appointment.services.map((s) => s.name).join(' + ')}
                  {appointment.client?.phone ? ` · ${appointment.client.phone}` : ''}
                </div>
              </div>

              {appointment.status === 'scheduled' ? (
                <div className="appt__actions">
                  <Button
                    className="btn--small"
                    data-testid="btn-done"
                    disabled={busy}
                    onClick={() => act(appointment.id, 'done')}
                  >
                    Concluir
                  </Button>
                  {confirmingId === appointment.id ? (
                    <Button
                      variant="ghost"
                      className="btn--small"
                      data-testid="btn-cancel-do"
                      disabled={busy}
                      onClick={() => act(appointment.id, 'cancel')}
                    >
                      Confirmar?
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="btn--small"
                      data-testid="btn-cancel-ask"
                      onClick={() => setConfirmingId(appointment.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              ) : (
                <span className="appt__status">{STATUS_LABEL[appointment.status]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
