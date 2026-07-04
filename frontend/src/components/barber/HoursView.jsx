import { useEffect, useState } from 'react';

import { getBusinessHours, getSettings, saveBusinessHours, saveSettings } from '../../api/barber.js';
import { Button } from '../Button.jsx';
import { WEEKDAYS } from './RecurringView.jsx';

export function HoursView() {
  const [days, setDays] = useState(null);
  const [slotMinutes, setSlotMinutes] = useState('');
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [hours, settings] = await Promise.all([getBusinessHours(), getSettings()]);
        const byWeekday = new Map(hours.business_hours.map((d) => [d.weekday, d]));
        setDays(
          [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
            const row = byWeekday.get(weekday);
            return {
              weekday,
              closed: row ? row.closed : true, // dia sem configuração = fechado
              open_time: row?.open_time?.slice(0, 5) ?? '09:00',
              close_time: row?.close_time?.slice(0, 5) ?? '19:00',
            };
          })
        );
        setSlotMinutes(String(settings.settings.default_slot_minutes));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  function patchDay(weekday, patch) {
    setSavedMsg(null);
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }

  async function submitHours() {
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      await saveBusinessHours(
        days.map((d) => ({
          weekday: d.weekday,
          closed: d.closed,
          open_time: d.closed ? null : d.open_time,
          close_time: d.closed ? null : d.close_time,
        }))
      );
      setSavedMsg('Horários salvos. Valem para novos agendamentos.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitSettings() {
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      await saveSettings({ default_slot_minutes: Number(slotMinutes) });
      setSavedMsg('Intervalo padrão salvo. Vale para novos agendamentos.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (days === null) {
    return (
      <div className="view">
        {error && <div className="form-error">{error}</div>}
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="view" data-testid="hours-view">
      {error && <div className="form-error">{error}</div>}
      {savedMsg && (
        <div className="banner" data-testid="hours-saved">
          {savedMsg}
        </div>
      )}

      <div className="subheading">Horário de funcionamento</div>
      <div>
        {days.map((day) => (
          <div key={day.weekday} className="hours-row" data-testid={`hours-row-${day.weekday}`}>
            <label className="hours-row__day">
              <input
                type="checkbox"
                data-testid={`day-open-${day.weekday}`}
                checked={!day.closed}
                onChange={(e) => patchDay(day.weekday, { closed: !e.target.checked })}
              />
              {WEEKDAYS[day.weekday]}
            </label>
            {day.closed ? (
              <span className="muted">Fechado</span>
            ) : (
              <>
                <input
                  type="time"
                  className="field__input"
                  data-testid={`day-from-${day.weekday}`}
                  value={day.open_time}
                  onChange={(e) => patchDay(day.weekday, { open_time: e.target.value })}
                />
                <span className="muted">às</span>
                <input
                  type="time"
                  className="field__input"
                  data-testid={`day-to-${day.weekday}`}
                  value={day.close_time}
                  onChange={(e) => patchDay(day.weekday, { close_time: e.target.value })}
                />
              </>
            )}
          </div>
        ))}
      </div>
      <div>
        <Button onClick={submitHours} disabled={busy} data-testid="hours-save">
          Salvar horários
        </Button>
      </div>

      <div className="subheading">Intervalo padrão entre horários</div>
      <p className="muted">
        Define a grade de horários e a duração de serviços sem duração própria. Mudanças valem
        só para novos agendamentos.
      </p>
      <div className="form-row">
        <label className="field">
          <span className="field__label">Minutos</span>
          <input
            type="number"
            className="field__input"
            data-testid="slot-minutes"
            min="10"
            max="240"
            value={slotMinutes}
            onChange={(e) => {
              setSlotMinutes(e.target.value);
              setSavedMsg(null);
            }}
          />
        </label>
        <Button onClick={submitSettings} disabled={busy} data-testid="settings-save">
          Salvar intervalo
        </Button>
      </div>
    </div>
  );
}
