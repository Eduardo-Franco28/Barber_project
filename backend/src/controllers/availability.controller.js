import * as availabilityService from '../services/availability.service.js';

export async function get(req, res) {
  const { date, service_ids: serviceIds } = req.validatedQuery;
  const availability = await availabilityService.getAvailability({ date, serviceIds });
  res.status(200).json(availability);
}
