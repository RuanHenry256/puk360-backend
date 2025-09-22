export const getAllEvents = (req, res) => {
  res.json([{ id: 1, title: "Welcome Bash", date: "2025-08-20" }]);
};

export const getEvent = (req, res) => {
  res.json({ id: req.params.id, title: "Sample Event", date: "2025-08-21" });
};

export const createEvent = (req, res) => {
  res.status(201).json({ message: "Event created", data: req.body });
};

export const updateEvent = (req, res) => {
  res.json({ message: "Event updated", id: req.params.id });
};

export const deleteEvent = (req, res) => {
  res.json({ message: "Event deleted", id: req.params.id });
};
