/**
 * Admin controller.
 * Stubs for reviewing events/hosts and returning simple analytics.
 */
export const getPendingEvents = (req, res) => {
  res.json([{ id: 1, title: "Pending Event", status: "pending" }]);
};

export const approveEvent = (req, res) => {
  res.json({ message: "Event approved", id: req.params.id });
};

export const rejectEvent = (req, res) => {
  res.json({ message: "Event rejected", id: req.params.id });
};

export const getHosts = (req, res) => {
  res.json([{ id: 1, name: "Jane Doe", status: "pending" }]);
};

export const approveHost = (req, res) => {
  res.json({ message: "Host approved", id: req.params.id });
};

export const getAnalytics = (req, res) => {
  res.json({ totalEvents: 42, totalStudents: 300 });
};
