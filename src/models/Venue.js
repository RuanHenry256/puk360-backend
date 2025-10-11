import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class Venue extends Model {}

Venue.init(
  {
    Venue_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'Venue_ID' },
    Name: { type: DataTypes.STRING, allowNull: false, field: 'Name' },
    Capacity: { type: DataTypes.INTEGER, allowNull: true, field: 'Capacity' },
    Location: { type: DataTypes.STRING, allowNull: true, field: 'Location' },
  },
  {
    sequelize,
    modelName: 'Venue',
    tableName: 'Venue',
    timestamps: false,
  }
);

export default Venue;
export const VenueModel = Venue;
