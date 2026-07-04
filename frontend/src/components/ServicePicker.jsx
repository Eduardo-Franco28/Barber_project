import { formatPrice } from '../lib/datetime.js';

export function ServicePicker({ services, selectedIds, onToggle, disabled = false }) {
  if (services.length === 0) {
    return <p className="muted">Nenhum serviço disponível no momento.</p>;
  }

  return (
    <div className="service-list">
      {services.map((service) => {
        const checked = selectedIds.includes(service.id);
        return (
          <label
            key={service.id}
            className={`service-item${checked ? ' service-item--on' : ''}`}
          >
            <input
              type="checkbox"
              className="service-item__input"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(service.id)}
            />
            <span className="service-item__check" aria-hidden="true" />
            <span className="service-item__name">{service.name}</span>
            <span className="service-item__meta">
              {service.duration_minutes ? `${service.duration_minutes} min` : 'duração padrão'}
              {' · '}
              {formatPrice(service.price)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
