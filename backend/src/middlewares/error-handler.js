export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

// Express only treats this as an error handler because of the 4-param signature — keep _next.
// Security requirement (CLAUDE.md): responses never include stack traces or internal details.
export function errorHandler(err, req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON malformado.' });
  }

  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status >= 500 ? 'Erro interno no servidor.' : err.message || 'Requisição inválida.';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}
