import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

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
