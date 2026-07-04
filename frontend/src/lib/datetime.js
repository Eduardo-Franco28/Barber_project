// Formatação de datas/horas na perspectiva da barbearia.
const SHOP_TZ = import.meta.env.VITE_BARBERSHOP_TZ ?? 'America/Sao_Paulo';

// 'AAAA-MM-DD' → 'terça-feira, 21 de julho' (meio-dia UTC evita virada de dia)
export function formatDayLong(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatApptDate(iso) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SHOP_TZ,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso));
}

export function formatApptTime(iso) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SHOP_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Data de hoje (fuso da barbearia) em 'AAAA-MM-DD' — para min/max do <input type="date">
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function plusDaysISO(days) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}

// Instante UTC → data 'AAAA-MM-DD' no fuso da barbearia.
export function instantToShopDate(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value)
  );
}
