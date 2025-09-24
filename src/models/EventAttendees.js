import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Event_Attendees = sequelize.define("Event_Attendees", {
    Event_ID: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: 'Event', key: 'Event_ID'}},
    User_ID: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: 'User', key: 'User_ID'}},
    RSVP_Status: { type: DataTypes.STRING(50), allowNull: true},
    Timestamp: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW}
}, {
    tableName: 'Event_Attendees', //Explicit table name
    timestamps: false, // Since there is already own Timestamp field
    Indexes: [
        {
            unique: true,
            fields: ['Event_ID', 'User_ID'] // composite primary key
        } 
    ]
});

export default Event_Attendees;