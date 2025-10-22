/**
 * Review controller.
 * Stubs for adding, listing, and deleting reviews for events.
 */
import Review from "../models/review.js";
import Event from "../models/event.js";
import { getSqlPool, sql } from "../db/sql.js";

// Submit a new review
export const addReview = async (req, res) => {
  try {
    const eventId = Number(req.params.id || req.body.eventId);
    const { rating, comment, title } = req.body || {};
    const reviewerId = Number(req.user?.id || req.body.reviewerId);

    if (!eventId || !reviewerId || !rating) {
      return res.status(400).json({ error: "eventId (path), rating, and auth token are required" });
    }

    const event = await Event.findByPk(eventId, { attributes: ['Event_ID','Host_User_ID','Date','startTime','endTime'] });
    if (!event) {
      return res.status(400).json({ error: "Invalid eventId" });
    }

    // Only allow reviews once the event has concluded (Date + endTime/startTime)
    try {
      const datePart = typeof event.Date === 'string'
        ? event.Date
        : new Date(event.Date).toISOString().slice(0,10);
      const timePart = (event.endTime || event.startTime || '23:59').toString().slice(0,5);
      const eventEndLocal = new Date(`${datePart}T${timePart}:00`);
      const now = new Date();
      if (isFinite(eventEndLocal.getTime()) && now < eventEndLocal) {
        return res.status(400).json({ error: 'You can only review this event after it has finished.' });
      }
    } catch (_) {
      // If parsing fails, fall back to allowing (do not hard crash)
    }

    // Persist title within comment if a dedicated column doesn't exist
    const storedComment = title && String(title).trim().length
      ? `${String(title).trim()}\n---\n${comment ? String(comment).trim() : ''}`
      : (comment || null);

    const newReview = await Review.create({
      reviewerId,
      userId: event.Host_User_ID,
      eventId,
      rating,
      comment: storedComment,
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
    const pool = await getSqlPool();
    const q = `
      SELECT R.Review_ID AS id,
             R.Event_ID AS eventId,
             R.Reviewer_User_ID AS reviewerId,
             U.Name AS reviewerName,
             R.Rating AS rating,
             R.Comment AS comment,
             R.[Date] AS createdAt
      FROM [Review] R
      LEFT JOIN [User] U ON U.User_ID = R.Reviewer_User_ID
      WHERE R.Event_ID = @eventId
      ORDER BY R.[Date] DESC, R.Review_ID DESC`;
    const result = await pool.request().input('eventId', sql.Int, Number(id)).query(q);
    const rows = (result.recordset || []).map((r) => {
      let title = null;
      let body = r.comment || '';
      if (typeof body === 'string') {
        const marker = '\n---\n';
        const idx = body.indexOf(marker);
        if (idx >= 0) {
          title = body.slice(0, idx).trim();
          body = body.slice(idx + marker.length).trim();
        }
      }
      return { ...r, title, comment: body };
    });
    res.json({ status: 'success', data: rows });
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
