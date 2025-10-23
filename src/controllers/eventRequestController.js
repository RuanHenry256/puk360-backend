/**
 * Event Host Request controller.
 * Creates and lists host applications for the authenticated user.
 */
import { insertHostApplication, selectHostApplicationsByUser } from "../data/eventRequestRepo.js";
import { logEvent } from "../data/auditRepo.js";

function normalizePayload(body = {}) {
  const get = (...keys) => keys.map(k => body[k]).find(v => typeof v === 'string' && v.trim().length > 0);
  const orgName = get('org_name', 'orgName', 'organization', 'organisation', 'society', 'org');
  let eventCategory = get('event_category', 'eventCategory', 'category', 'type', 'type_of_events', 'typeOfEvents', 'event_type', 'eventType');
  let motivation = get('motivation', 'Motivation', 'reason', 'details', 'detail');

  // If the incoming motivation itself is a concatenated string like
  // "Org: X Category: Y Motivation: Z", strip it down to just Z.
  if (typeof motivation === 'string') {
    const motOnly = motivation.match(/Motivation:\s*([\s\S]+)/i);
    if (motOnly) {
      motivation = motOnly[1].trim();
    }
  }

  // Try to derive from legacy summary format if needed
  const summary = get('proposed_event_summary', 'summary');
  if ((!eventCategory || !motivation) && typeof summary === 'string') {
    // Expected format we sent: "Category: X. Motivation: Y"
    const catMatch = summary.match(/Category:\s*([^\.\n]+)/i);
    const motMatch = summary.match(/Motivation:\s*([\s\S]+)/i);
    if (!eventCategory && catMatch) eventCategory = catMatch[1].trim();
    if (!motivation && motMatch) motivation = motMatch[1].trim();
    // Do NOT fall back to the entire summary. If we cannot
    // extract an explicit Motivation section, leave it empty
    // so validation can flag it as missing.
  }

  if (!eventCategory) eventCategory = 'General';

  return {
    orgName: orgName ? orgName.trim() : '',
    eventCategory: eventCategory ? eventCategory.trim() : '',
    motivation: motivation ? motivation.trim() : '',
  };
}

export async function submitEventHostRequest(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Debug log to help trace payload shape in development
    try { console.debug('[host-applications] payload:', JSON.stringify(req.body)); } catch {}

    const { orgName, eventCategory, motivation } = normalizePayload(req.body);
    const missing = [];
    if (!orgName) missing.push('org_name');
    if (!motivation) missing.push('motivation');
    if (missing.length) {
      return res.status(400).json({
        error: "Missing required fields.",
        missing,
      });
    }

    const applicationId = await insertHostApplication({ applicantUserId: userId, orgName, eventType: eventCategory, motivation });
    // Audit log: host application submitted
    logEvent({ eventType: 'host_application_submitted', userId, targetType: 'host_application', targetId: applicationId, metadata: { orgName, eventCategory } });

    return res.status(201).json({ application_id: applicationId, status: "PENDING" });
  } catch (err) {
    console.error("submitEventHostRequest error:", err);
    return res.status(500).json({ error: "Failed to submit host request." });
  }
}

export async function getMyEventHostRequests(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const apps = await selectHostApplicationsByUser(userId);
    return res.json({ data: apps });
  } catch (err) {
    console.error("getMyEventHostRequests error:", err);
    return res.status(500).json({ error: "Failed to fetch requests." });
  }
}
