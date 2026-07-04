import { useState } from 'react';

import { AppShell } from '../components/AppShell.jsx';
import { AgendaView } from '../components/barber/AgendaView.jsx';
import { HoursView } from '../components/barber/HoursView.jsx';
import { RecurringView } from '../components/barber/RecurringView.jsx';
import { ServicesView } from '../components/barber/ServicesView.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'fixos', label: 'Fixos & bloqueios' },
  { id: 'horarios', label: 'Horários' },
];

export function BarberHome() {
  const { user } = useAuth();
  const [tab, setTab] = useState('agenda');

  return (
    <AppShell>
      <h1>Olá, {user.name.split(' ')[0]}</h1>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`tab-${item.id}`}
            className={`tab${tab === item.id ? ' tab--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'agenda' && <AgendaView />}
      {tab === 'servicos' && <ServicesView />}
      {tab === 'fixos' && <RecurringView />}
      {tab === 'horarios' && <HoursView />}
    </AppShell>
  );
}
