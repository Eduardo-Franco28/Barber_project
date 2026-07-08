import * as blockedTimesService from '../services/blocked-times.service.js';

export async function list(req, res) {
  const blockedTimes = await blockedTimesService.list(req.user.id);
  res.status(200).json({ blocked_times: blockedTimes });
}

export async function create(req, res) {
  const blockedTime = await blockedTimesService.create(
    req.user.barbershopId,
    req.user.id,
    req.body
  );
  res.status(201).json({ blocked_time: blockedTime });
}

export async function remove(req, res) {
  await blockedTimesService.remove(req.user.id, req.params.id);
  res.status(204).end();
}
