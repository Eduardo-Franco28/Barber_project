import { Button } from './Button.jsx';
import { formatApptDate, formatApptTime } from '../lib/datetime.js';

const STATUS_LABEL = { canceled: 'Cancelado', done: 'Concluído' };

export function AppointmentList({
  appointments,
  confirmingId = null,
  onAskCancel,
  onCancel,
  canceling = false,
  readOnly = false,
}) {
  return (
    <div className="appt-list">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="appt" data-testid="appt">
          <div>
            <div className="appt__when">
              {formatApptDate(appointment.start_at)} ·{' '}
              <strong>{formatApptTime(appointment.start_at)}</strong>
            </div>
            <div className="muted">
              {appointment.services.map((service) => service.name).join(' + ')}
            </div>
          </div>

          {readOnly || appointment.status !== 'scheduled' ? (
            <span className="appt__status">
              {STATUS_LABEL[appointment.status] ?? 'Marcado'}
            </span>
          ) : confirmingId === appointment.id ? (
            <Button
              variant="primary"
              className="btn--small"
              data-testid="do-cancel"
              disabled={canceling}
              onClick={() => onCancel(appointment.id)}
            >
              {canceling ? 'Cancelando…' : 'Confirmar cancelamento'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="btn--small"
              data-testid="ask-cancel"
              onClick={() => onAskCancel(appointment.id)}
            >
              Cancelar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
