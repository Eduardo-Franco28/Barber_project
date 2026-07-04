export function Brand({ compact = false }) {
  if (compact) {
    return <span className="topbar__brand">BRYAN</span>;
  }
  return (
    <div className="brand">
      <div className="brand__name">BRYAN</div>
      <div className="brand__sub">Barbearia</div>
    </div>
  );
}
