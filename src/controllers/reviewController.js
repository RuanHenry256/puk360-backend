/**
 * Review controller.
 * Stubs for adding, listing, and deleting reviews for events.
 */
import Review from "../models/review.js";
import Event from "../models/event.js";

// Submit a new review
export const addReview = async (req, res) => {
  try {
    const { reviewerId, userId,eventId, rating, comment } = req.body;

    // Validate input
    if (!reviewerId|| !userId ||!eventId || !rating) {
      return res.status(400).json({ error: "eventId, userId and rating are required" });
    }
    
        /**if event doesnt exist in our table
     const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(400).json({ error: "Invalid eventId" });
    }
      **/
     
    // Create review in DB
    const newReview = await Review.create({
      reviewerId,
      userId,
      eventId,
      rating,
      comment
    });

    res.status(201).json({ message: "Review added", data: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
};

// Get all reviews for a specific event
export const getReviews = async (req, res) => {
  try {
    const { id } = req.params; // eventId
    const reviews = await Review.findAll({ where: { eventId: id } });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params; // reviewId
    const deleted = await Review.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: "Review deleted", id });
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }


};