import { Model, DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize';
import config from '../config/config.cjs';

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: 'mssql',
    port: config.development.port,
    dialectOptions: config.development.dialectOptions,
    logging: config.development.logging,
  }
);

class Event extends Model {}

Event.init(
  {
    Event_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'Event_ID'
    },
    Title: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'Title'
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Description'
    },
    Date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'Date'
    },
    Time: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'Time'
    },
    Host_User_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'Host_User_ID'
    },
    Venue_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'Venue_ID'
    },
    Status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'Status'
    },
    // New fields
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'General Event'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Entertainment'
    },
    hostedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NWU Events'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    campus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Potchefstroom',
      field: 'campus'
    },
    ImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ImageUrl'
    }
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'Event',
    timestamps: false,
  }
);

export default Event;
export const EventModel = Event;
