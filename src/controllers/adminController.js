/** Admin controller */
import { selectAllHostApplications, reviewHostApplication } from '../data/eventRequestRepo.js';
import {
  listUsers as repoListUsers,
  listRoles as repoListRoles,
  updateUserAdmin,
  replaceUserRolesByIds,
  resolveRoleIds,
  getUserRoles,
  deleteUser as repoDeleteUser,
  getUserWithRolesAndHostStatus,
  reactivateHost,
} from '../data/userRepo.js';

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

// Users listing for admin
export const listUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    const users = await repoListUsers({ q });
    res.json({ data: users });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users', details: e.message });
  }
};

// List all roles
export const listRoles = async (_req, res) => {
  try {
    const roles = await repoListRoles();
    res.json({ data: roles });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch roles', details: e.message });
  }
};

// Update a user and their roles
export const updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, roles } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing user id' });
    const updated = await updateUserAdmin({ userId: id, name, email });
    // Replace roles if provided
    if (Array.isArray(roles)) {
      const roleIds = await resolveRoleIds(roles);
      await replaceUserRolesByIds(id, roleIds);
    }
    const finalRoles = await getUserRoles(id);
    res.json({ data: { ...updated, Roles: finalRoles } });
  } catch (e) {
    const msg = e.code === 'EMAIL_IN_USE' ? e.message : 'Failed to update user';
    res.status(400).json({ error: msg, details: e.message });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing user id' });
    const ok = await repoDeleteUser(id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user', details: e.message });
  }
};

// Get a single user's details incl. roles and host status
export const getUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing user id' });
    const details = await getUserWithRolesAndHostStatus(id);
    if (!details) return res.status(404).json({ error: 'User not found' });
    res.json({ data: details });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user', details: e.message });
  }
};

// Reactivate a host account for a user
export const reactivateHostAccount = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing user id' });
    const status = await reactivateHost(id);
    res.json({ data: status });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reactivate host', details: e.message });
  }
};
