import * as businessHoursService from '../services/business-hours.service.js';

export async function list(req, res) {
  const businessHours = await businessHoursService.list(req.user.id);
  res.status(200).json({ business_hours: businessHours });
}

export async function update(req, res) {
  const businessHours = await businessHoursService.update(req.user.id, req.body.days);
  res.status(200).json({ business_hours: businessHours });
}
