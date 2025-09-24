<<<<<<< HEAD
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import sequelize from './src/config/db.js';
=======
/**
 * Sequelize DB configuration and instance.
 * Creates and exports a Sequelize connection using environment variables
 * (Azure SQL/Postgres), enabling encrypted connections for Azure by default.
 */
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
>>>>>>> ca054b5 (Added LoginScreen functionality that uses the database connection to compare user input and to validate credentials. Added updates to controllers, routes, middleware and docs)

dotenv.config();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await sequelize.close();
  }
})();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // 'mssql' or 'postgres'
    port: process.env.DB_PORT,
    dialectOptions: {
      options: {
        encrypt: true, // required for Azure SQL
        trustServerCertificate: false
      }
    },
    logging: false,
  }
);

export default sequelize;