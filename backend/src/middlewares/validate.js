function buildDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

// Valida e normaliza o body com um schema zod; substitui req.body pelos
// dados já saneados, para as camadas seguintes nunca verem entrada crua.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos.', details: buildDetails(result.error) });
    }
    req.body = result.data;
    next();
  };
}

// Mesmo papel do validate, para query string. Express 5 não permite
// reatribuir req.query, então o resultado saneado vai em req.validatedQuery.
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos.', details: buildDetails(result.error) });
    }
    req.validatedQuery = result.data;
    next();
  };
}
