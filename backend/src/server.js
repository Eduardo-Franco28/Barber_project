import app from './app.js';
import env from './config/env.js';
import * as excelService from './services/excel.service.js';

app.listen(env.port, () => {
  console.log(`Bryan Barbearia API rodando em http://localhost:${env.port} (${env.nodeEnv})`);
  excelService.scheduleSync(); // garante a planilha em dia já no boot
});
