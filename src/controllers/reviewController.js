export const addReview = (req, res) => {
  res.status(201).json({ message: "Review added", data: req.body });
};

export const getReviews = (req, res) => {
  res.json([
    { id: 1, eventId: req.params.id, rating: 5, comment: "Awesome event!" }
  ]);
};

export const deleteReview = (req, res) => {
  res.json({ message: "Review deleted", id: req.params.id });
};
