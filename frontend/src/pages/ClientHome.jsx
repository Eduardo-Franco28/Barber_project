import { useEffect, useRef, useState } from 'react';

import {
  cancelAppointment,
  createAppointment,
  getAvailability,
  listAppointments,
} from '../api/appointments.js';
import { listServices } from '../api/services.js';
import { AppointmentList } from '../components/AppointmentList.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { ServicePicker } from '../components/ServicePicker.jsx';
import { SlotPicker } from '../components/SlotPicker.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDayLong, formatPrice, plusDaysISO, todayISO } from '../lib/datetime.js';

const BOOKING_HORIZON_DAYS = 60; // espelha a regra do backend

export function ClientHome() {
  const { user } = useAuth();

  const [services, setServices] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [pageError, setPageError] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState(null);

  const [bookingError, setBookingError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmingId, setConfirmingId] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Descarta respostas de disponibilidade que chegarem fora de ordem.
  const requestSeq = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [svc, appts] = await Promise.all([listServices(), listAppointments()]);
        setServices(svc.services);
        setAppointments(appts.appointments);
      } catch (err) {
        setPageError(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    setTime(null);
    setAvailability(null);
    setBookingError(null);
    if (!date || selectedIds.length === 0) return;

    const seq = ++requestSeq.current;
    setSlotsLoading(true);
    getAvailability(date, selectedIds)
      .then((data) => {
        if (seq === requestSeq.current) setAvailability(data);
      })
      .catch((err) => {
        if (seq === requestSeq.current) setBookingError(err.message);
      })
      .finally(() => {
        if (seq === requestSeq.current) setSlotsLoading(false);
      });
  }, [date, selectedIds]);

  function toggleService(id) {
    setSuccessMsg(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function refreshAppointments() {
    const data = await listAppointments();
    setAppointments(data.appointments);
  }

  async function confirmBooking() {
    setSubmitting(true);
    setBookingError(null);
    try {
      await createAppointment({ serviceIds: selectedIds, date, time });
      setSuccessMsg(`Horário confirmado: ${formatDayLong(date)} às ${time}.`);
      setSelectedIds([]);
      setDate('');
      setAvailability(null);
      setTime(null);
      await refreshAppointments();
    } catch (err) {
      setBookingError(err.message);
      // Slot disputado: recarrega a grade para o cliente escolher outro.
      if (err.status === 409 && date && selectedIds.length > 0) {
        setTime(null);
        const data = await getAvailability(date, selectedIds).catch(() => null);
        if (data) setAvailability(data);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function doCancel(id) {
    setCanceling(true);
    setCancelError(null);
    try {
      await cancelAppointment(id);
      await refreshAppointments();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setConfirmingId(null);
      setCanceling(false);
    }
  }

  const now = Date.now();
  const upcoming = (appointments ?? []).filter(
    (a) => a.status === 'scheduled' && new Date(a.end_at).getTime() > now
  );
  const past = (appointments ?? []).filter((a) => !upcoming.includes(a));

  const selectedServices = (services ?? []).filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <AppShell>
      <h1>Olá, {user.name.split(' ')[0]}</h1>
      {pageError && <div className="form-error">{pageError}</div>}

      <section className="section" data-testid="my-appointments">
        <h2 className="section__title">Seus horários</h2>
        {cancelError && <div className="form-error">{cancelError}</div>}
        {appointments === null ? (
          <p className="muted">Carregando…</p>
        ) : upcoming.length === 0 ? (
          <p className="muted">Você ainda não tem horário marcado.</p>
        ) : (
          <AppointmentList
            appointments={upcoming}
            confirmingId={confirmingId}
            onAskCancel={setConfirmingId}
            onCancel={doCancel}
            canceling={canceling}
          />
        )}
        {past.length > 0 && (
          <details className="history">
            <summary>Anteriores ({past.length})</summary>
            <AppointmentList appointments={past} readOnly />
          </details>
        )}
      </section>

      <section className="section" data-testid="booking">
        <h2 className="section__title">Marcar horário</h2>
        {successMsg && (
          <div className="banner" data-testid="success">
            {successMsg}
          </div>
        )}

        <div className="section__sub">1 · Escolha os serviços</div>
        {services === null ? (
          <p className="muted">Carregando…</p>
        ) : (
          <ServicePicker
            services={services}
            selectedIds={selectedIds}
            onToggle={toggleService}
          />
        )}
        {selectedServices.length > 0 && (
          <p className="muted">
            {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} ·{' '}
            {formatPrice(totalPrice)}
          </p>
        )}

        <div className="section__sub">2 · Escolha o dia</div>
        <input
          type="date"
          className="field__input date-input"
          data-testid="date-input"
          min={todayISO()}
          max={plusDaysISO(BOOKING_HORIZON_DAYS)}
          value={date}
          disabled={selectedIds.length === 0}
          onChange={(event) => {
            setDate(event.target.value);
            setSuccessMsg(null);
          }}
        />
        {selectedIds.length === 0 && (
          <p className="muted">Escolha ao menos um serviço primeiro.</p>
        )}

        <div className="section__sub">3 · Escolha o horário</div>
        {slotsLoading ? (
          <p className="muted">Buscando horários…</p>
        ) : availability ? (
          <SlotPicker
            slots={availability.slots}
            selected={time}
            onSelect={(slot) => {
              setTime(slot);
              setSuccessMsg(null);
            }}
          />
        ) : (
          <p className="muted">Escolha os serviços e o dia para ver os horários.</p>
        )}

        {bookingError && (
          <div className="form-error" data-testid="booking-error">
            {bookingError}
          </div>
        )}

        {time && availability && (
          <div className="confirm-bar" data-testid="confirm-bar">
            <div>
              <div>
                <strong>{formatDayLong(date)}</strong> às <strong>{time}</strong>
              </div>
              <div className="muted">
                {selectedServices.map((s) => s.name).join(' + ')} ·{' '}
                {availability.duration_minutes} min · {formatPrice(totalPrice)}
              </div>
            </div>
            <Button
              onClick={confirmBooking}
              disabled={submitting}
              data-testid="confirm-booking"
            >
              {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
            </Button>
          </div>
        )}
      </section>
    </AppShell>
  );
}
