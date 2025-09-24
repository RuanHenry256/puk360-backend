/**
 * Sequelize DB configuration and instance.
 * Creates and exports a Sequelize connection using environment variables
 * (Azure SQL/Postgres), enabling encrypted connections for Azure by default.
 */
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dialect = process.env.DB_DIALECT || 'mssql';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port,
    dialect,
    dialectOptions: dialect === 'mssql'
      ? { options: { encrypt: true, trustServerCertificate: false } }
      : {},
    logging: false,
  }
);

export default sequelize;
