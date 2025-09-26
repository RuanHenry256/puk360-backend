import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Review = sequelize.define("Review", {
  id: {
    type: DataTypes.INTEGER,
    field: "Review_ID",
    primaryKey: true,
    autoIncrement: true
  },
  reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "Reviewer_User_ID",
  },
  userId: {
    type: DataTypes.INTEGER,
    field: "Host_User_ID",
    allowNull: false
  },
  eventId: {
    type: DataTypes.INTEGER,
    field: "Event_ID",
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    field: "Rating",
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    field: "Comment",
    allowNull: true
  }
}, {
  timestamps: true
});

export default Review;