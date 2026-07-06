const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const FILENAME = 'agenda-bryan-barbearia.xlsx';

function fetchSpreadsheet() {
  return fetch(`${API_URL}/spreadsheet`, { credentials: 'include' });
}

// Baixa a planilha SEMPRE atual (gerada na hora pelo servidor). Renova a
// sessão uma vez no 401 — mesmo padrão do client de API.
export async function downloadSpreadsheet() {
  let response = await fetchSpreadsheet();

  if (response.status === 401) {
    await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    response = await fetchSpreadsheet();
  }

  if (!response.ok) {
    throw new Error('Não foi possível baixar a planilha. Tente novamente.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
