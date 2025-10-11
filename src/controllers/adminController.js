/** Admin controller */
import { selectAllHostApplications, reviewHostApplication } from '../data/eventRequestRepo.js';

export const getPendingEvents = (req, res) => {
  res.json([{ id: 1, title: 'Pending Event', status: 'pending' }]);
};

export const approveEvent = (req, res) => {
  res.json({ message: 'Event approved', id: req.params.id });
};

export const rejectEvent = (req, res) => {
  res.json({ message: 'Event rejected', id: req.params.id });
};

// Host applications admin endpoints
export const listHostApplications = async (req, res) => {
  try {
    const status = req.query.status || 'All';
    const apps = await selectAllHostApplications(status);
    res.json({ data: apps });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch host applications', details: e.message });
  }
};

export const reviewHostApp = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const decision = String(req.body?.decision || '').toUpperCase(); // APPROVED | REJECTED
    const comment = req.body?.comment || null;
    const reviewerUserId = req.user?.id || null;
    if (!id) return res.status(400).json({ error: 'Missing application id' });
    if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ error: 'Invalid decision' });
    await reviewHostApplication({ applicationId: id, reviewerUserId, decision, comment });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to review application', details: e.message });
  }
};

export const getHosts = (req, res) => {
  res.json([{ id: 1, name: 'Jane Doe', status: 'pending' }]);
};

export const approveHost = (req, res) => {
  res.json({ message: 'Host approved', id: req.params.id });
};

export const getAnalytics = (req, res) => {
  res.json({ totalEvents: 42, totalStudents: 300 });
};
