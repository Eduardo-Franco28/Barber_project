import { useEffect, useState } from 'react';

import {
  createBlocked,
  createFixed,
  deleteBlocked,
  deleteFixed,
  listBlocked,
  listFixed,
} from '../../api/barber.js';
import { formatApptDate, formatApptTime } from '../../lib/datetime.js';
import { Button } from '../Button.jsx';
import { Field } from '../Field.jsx';

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const EMPTY_FIXED = { client_name: '', weekday: '1', start_time: '', duration: '50' };
const EMPTY_BLOCK = { start_date: '', start_time: '', end_date: '', end_time: '', reason: '' };

export function RecurringView() {
  const [fixed, setFixed] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [fxForm, setFxForm] = useState(EMPTY_FIXED);
  const [blForm, setBlForm] = useState(EMPTY_BLOCK);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null); // { type, id }
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [fx, bl] = await Promise.all([listFixed(), listBlocked()]);
      setFixed(fx.fixed_appointments);
      setBlocked(bl.blocked_times);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(null);
      setBusy(false);
    }
  }

  function addFixed(event) {
    event.preventDefault();
    run(async () => {
      await createFixed({
        client_name: fxForm.client_name,
        weekday: Number(fxForm.weekday),
        start_time: fxForm.start_time,
        duration_minutes: Number(fxForm.duration),
      });
      setFxForm(EMPTY_FIXED);
    });
  }

  function addBlocked(event) {
    event.preventDefault();
    run(async () => {
      await createBlocked({
        start_date: blForm.start_date,
        start_time: blForm.start_time,
        end_date: blForm.end_date,
        end_time: blForm.end_time,
        reason: blForm.reason || undefined,
      });
      setBlForm(EMPTY_BLOCK);
    });
  }

  function removeButton(type, id, testid) {
    const isConfirming = confirming?.type === type && confirming?.id === id;
    return isConfirming ? (
      <Button
        variant="primary"
        className="btn--small"
        data-testid={`${testid}-do`}
        disabled={busy}
        onClick={() => run(() => (type === 'fixed' ? deleteFixed(id) : deleteBlocked(id)))}
      >
        Confirmar?
      </Button>
    ) : (
      <Button
        variant="ghost"
        className="btn--small"
        data-testid={`${testid}-ask`}
        onClick={() => setConfirming({ type, id })}
      >
        Remover
      </Button>
    );
  }

  return (
    <div className="view" data-testid="recurring-view">
      {error && <div className="form-error">{error}</div>}

      <div className="subheading">Atendimentos fixos (semanais)</div>
      <form className="form-row" onSubmit={addFixed}>
        <Field
          label="Cliente"
          data-testid="fx-name"
          value={fxForm.client_name}
          onChange={(e) => setFxForm({ ...fxForm, client_name: e.target.value })}
        />
        <label className="field">
          <span className="field__label">Dia da semana</span>
          <select
            className="field__input"
            data-testid="fx-weekday"
            value={fxForm.weekday}
            onChange={(e) => setFxForm({ ...fxForm, weekday: e.target.value })}
          >
            {WEEKDAYS.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Horário"
          data-testid="fx-time"
          type="time"
          value={fxForm.start_time}
          onChange={(e) => setFxForm({ ...fxForm, start_time: e.target.value })}
        />
        <Field
          label="Duração (min)"
          data-testid="fx-duration"
          type="number"
          min="5"
          max="480"
          value={fxForm.duration}
          onChange={(e) => setFxForm({ ...fxForm, duration: e.target.value })}
        />
        <Button type="submit" data-testid="fx-add" disabled={busy}>
          Adicionar
        </Button>
      </form>

      {fixed === null ? (
        <p className="muted">Carregando…</p>
      ) : fixed.length === 0 ? (
        <p className="muted">Nenhum atendimento fixo cadastrado.</p>
      ) : (
        <div className="appt-list">
          {fixed.map((item) => (
            <div key={item.id} className="appt" data-testid="fx-row">
              <div>
                <div className="appt__when">
                  {WEEKDAYS[item.weekday]} · <strong>{item.start_time.slice(0, 5)}</strong> ·{' '}
                  {item.duration_minutes} min
                </div>
                <div className="muted">{item.client_name}</div>
              </div>
              {removeButton('fixed', item.id, 'fx-del')}
            </div>
          ))}
        </div>
      )}

      <div className="subheading">Bloqueios de agenda</div>
      <form className="form-row" onSubmit={addBlocked}>
        <Field
          label="Início — dia"
          data-testid="bl-sdate"
          type="date"
          value={blForm.start_date}
          onChange={(e) => setBlForm({ ...blForm, start_date: e.target.value })}
        />
        <Field
          label="Hora"
          data-testid="bl-stime"
          type="time"
          value={blForm.start_time}
          onChange={(e) => setBlForm({ ...blForm, start_time: e.target.value })}
        />
        <Field
          label="Fim — dia"
          data-testid="bl-edate"
          type="date"
          value={blForm.end_date}
          onChange={(e) => setBlForm({ ...blForm, end_date: e.target.value })}
        />
        <Field
          label="Hora"
          data-testid="bl-etime"
          type="time"
          value={blForm.end_time}
          onChange={(e) => setBlForm({ ...blForm, end_time: e.target.value })}
        />
        <Field
          label="Motivo (opcional)"
          data-testid="bl-reason"
          value={blForm.reason}
          onChange={(e) => setBlForm({ ...blForm, reason: e.target.value })}
        />
        <Button type="submit" data-testid="bl-add" disabled={busy}>
          Bloquear
        </Button>
      </form>

      {blocked === null ? (
        <p className="muted">Carregando…</p>
      ) : blocked.length === 0 ? (
        <p className="muted">Nenhum bloqueio futuro.</p>
      ) : (
        <div className="appt-list">
          {blocked.map((item) => (
            <div key={item.id} className="appt" data-testid="bl-row">
              <div>
                <div className="appt__when">
                  {formatApptDate(item.start_at)} {formatApptTime(item.start_at)}
                  {' → '}
                  {formatApptDate(item.end_at)} {formatApptTime(item.end_at)}
                </div>
                {item.reason && <div className="muted">{item.reason}</div>}
              </div>
              {removeButton('blocked', item.id, 'bl-del')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
