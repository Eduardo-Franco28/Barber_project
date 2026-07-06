import * as excelService from '../services/excel.service.js';
import { AppError } from '../utils/app-error.js';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Gera a planilha na hora, a partir do banco → o download é SEMPRE a versão
// mais atual. Baixar de novo é o que "atualiza" o arquivo do barbeiro.
export async function download(req, res) {
  const buffer = await excelService.generateBuffer();
  if (!buffer) {
    throw new AppError(503, 'Barbearia ainda não configurada.');
  }

  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', 'attachment; filename="agenda-bryan-barbearia.xlsx"');
  res.send(Buffer.from(buffer));
}
