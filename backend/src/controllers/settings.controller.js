import * as settingsService from '../services/settings.service.js';

export async function get(req, res) {
  const settings = await settingsService.get(req.user.id);
  res.status(200).json({ settings });
}

export async function update(req, res) {
  const settings = await settingsService.update(req.user.id, req.body);
  res.status(200).json({ settings });
}
