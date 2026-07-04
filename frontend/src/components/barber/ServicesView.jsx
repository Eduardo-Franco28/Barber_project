import { useEffect, useState } from 'react';

import { createService, listServices, updateService } from '../../api/services.js';
import { formatPrice } from '../../lib/datetime.js';
import { Button } from '../Button.jsx';
import { Field } from '../Field.jsx';

const EMPTY_FORM = { name: '', duration: '', price: '' };

function toPayload(form) {
  return {
    name: form.name,
    duration_minutes: form.duration === '' ? null : Number(form.duration),
    price: Number(form.price),
  };
}

export function ServicesView() {
  const [services, setServices] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await listServices();
      setServices(data.services);
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
      setBusy(false);
    }
  }

  function add(event) {
    event.preventDefault();
    run(async () => {
      await createService(toPayload(form));
      setForm(EMPTY_FORM);
    });
  }

  function saveEdit(event) {
    event.preventDefault();
    run(async () => {
      await updateService(editingId, toPayload(editForm));
      setEditingId(null);
    });
  }

  function toggleActive(service) {
    run(() => updateService(service.id, { active: !service.active }));
  }

  return (
    <div className="view" data-testid="services-view">
      {error && <div className="form-error">{error}</div>}

      <form className="form-row" onSubmit={add}>
        <Field
          label="Serviço"
          name="svc-name"
          data-testid="svc-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Field
          label="Duração (min)"
          name="svc-duration"
          data-testid="svc-duration"
          type="number"
          min="5"
          max="480"
          placeholder="padrão"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
        <Field
          label="Preço (R$)"
          name="svc-price"
          data-testid="svc-price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <Button type="submit" data-testid="svc-add" disabled={busy}>
          Adicionar
        </Button>
      </form>
      <p className="muted">Duração em branco = usa o intervalo padrão da agenda.</p>

      {services === null ? (
        <p className="muted">Carregando…</p>
      ) : services.length === 0 ? (
        <p className="muted">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="appt-list">
          {services.map((service) =>
            editingId === service.id ? (
              <form key={service.id} className="appt form-row" onSubmit={saveEdit}>
                <Field
                  label="Serviço"
                  data-testid="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Field
                  label="Duração (min)"
                  data-testid="edit-duration"
                  type="number"
                  min="5"
                  max="480"
                  placeholder="padrão"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                />
                <Field
                  label="Preço (R$)"
                  data-testid="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
                <Button type="submit" className="btn--small" data-testid="edit-save" disabled={busy}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="btn--small"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </form>
            ) : (
              <div key={service.id} className="appt" data-testid="svc-row">
                <div>
                  <div className="appt__when">
                    {service.name} {!service.active && <span className="badge">Inativo</span>}
                  </div>
                  <div className="muted">
                    {service.duration_minutes
                      ? `${service.duration_minutes} min`
                      : 'duração padrão'}
                    {' · '}
                    {formatPrice(service.price)}
                  </div>
                </div>
                <div className="appt__actions">
                  <Button
                    variant="ghost"
                    className="btn--small"
                    data-testid="svc-edit"
                    onClick={() => {
                      setEditingId(service.id);
                      setEditForm({
                        name: service.name,
                        duration: service.duration_minutes ?? '',
                        price: String(service.price),
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="btn--small"
                    data-testid="svc-toggle"
                    disabled={busy}
                    onClick={() => toggleActive(service)}
                  >
                    {service.active ? 'Desativar' : 'Reativar'}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
