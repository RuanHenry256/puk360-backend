/**
 * Sequelize model for Host Applications.
 */
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const HostApplication = sequelize.define(
  "HostApplication",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    org_name: { type: DataTypes.STRING, allowNull: false },
    // legacy optional fields kept for compatibility
    proposed_event_title: { type: DataTypes.STRING, allowNull: true },
    proposed_event_summary: { type: DataTypes.TEXT, allowNull: true },
    proposed_date: { type: DataTypes.DATE, allowNull: true },
    // new required field capturing the type/category of events
    event_category: { type: DataTypes.STRING, allowNull: false },
    motivation: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"), defaultValue: "PENDING" },
  },
  { tableName: "Host_Applications" }
);

export default HostApplication;
