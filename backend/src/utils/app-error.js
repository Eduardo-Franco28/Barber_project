// Erros esperados da aplicação: statusCode < 500 tem a mensagem exposta ao
// cliente pelo error handler; qualquer outro erro vira 500 genérico.
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
