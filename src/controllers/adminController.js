/** Admin controller */
import { selectAllHostApplications, reviewHostApplication } from '../data/eventRequestRepo.js';
import sequelize from '../config/db.js';
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
  updateUserPasswordSqlHash,
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
    const { name, email, roles, password } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing user id' });
    const updated = await updateUserAdmin({ userId: id, name, email });
    if (typeof password === 'string' && password.trim().length) {
      // Minimum password length check (basic safeguard)
      if (password.trim().length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      await updateUserPasswordSqlHash(id, password.trim());
    }
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

// List audit logs (read-only). Supports ?limit=500 and optional ?q=search
export const listAuditLogs = async (req, res) => {
  try {
    // Support lifetime export via limit=all|lifetime|0
    const rawLimit = (req.query.limit ?? '').toString().trim().toLowerCase();
    const isAll = rawLimit === 'all' || rawLimit === 'lifetime' || rawLimit === '0' || rawLimit === 'false';
    // Always use OFFSET/FETCH for consistency; for "all" use a very large cap
    const limitNum = isAll ? 2147483647 : Math.max(1, Math.min(5000, Number(rawLimit || 500)));
    const q = (req.query.q || '').toString().trim();

    // If table doesn't exist, return empty
    const [existsRows] = await sequelize.query(`SELECT CASE WHEN OBJECT_ID('dbo.Audit_Log','U') IS NULL THEN 0 ELSE 1 END AS ok`);
    const ok = Number(existsRows?.[0]?.ok || 0) === 1;
    if (!ok) return res.json({ data: [] });

    const where = q
      ? `WHERE (L.Event_Type LIKE @q OR L.Target_Type LIKE @q OR ISNULL(L.Metadata,'') LIKE @q OR ISNULL(U.Name,'') LIKE @q OR ISNULL(U.Email,'') LIKE @q)`
      : '';

    // Using OFFSET/FETCH for parameterized limit
    const baseSql = `
      SELECT L.Log_ID AS id,
             L.Created_At AS createdAt,
             L.Event_Type AS eventType,
             L.User_ID    AS userId,
             L.Target_Type AS targetType,
             L.Target_ID   AS targetId,
             L.Metadata    AS metadata,
             U.Name        AS userName,
             U.Email       AS userEmail
      FROM dbo.Audit_Log L
      LEFT JOIN [User] U ON U.User_ID = L.User_ID
      ${where}
      ORDER BY L.Created_At DESC, L.Log_ID DESC`;

    let rows;
    if (q) {
      const like = `%${q.replace(/'/g, "''")}%`;
      const sql = baseSql.replace(/@q/g, `'${like}'`) + ` OFFSET 0 ROWS FETCH NEXT ${limitNum} ROWS ONLY`;
      const [data] = await sequelize.query(sql);
      rows = data || [];
    } else {
      const sql = baseSql + ` OFFSET 0 ROWS FETCH NEXT ${limitNum} ROWS ONLY`;
      const [data] = await sequelize.query(sql);
      rows = data || [];
    }
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: e.message });
  }
};
