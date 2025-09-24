import { Sequelize } from 'sequelize';
import config from './src/config/config.cjs';

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
    port: config.development.port,
    dialectOptions: config.development.dialectOptions,
    logging: config.development.logging,
  }
);

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