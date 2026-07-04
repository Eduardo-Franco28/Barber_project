export function SlotPicker({ slots, selected, onSelect }) {
  if (slots.length === 0) {
    return <p className="muted">Sem horários livres neste dia — tente outra data.</p>;
  }

  return (
    <div className="slot-grid" data-testid="slot-grid">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          className={`slot${selected === slot ? ' slot--on' : ''}`}
          onClick={() => onSelect(slot)}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
