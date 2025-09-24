import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PUK360 Event Management API',
      version: '1.0.0',
      description: 'API for managing events in PUK360',
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development server' },
      { url: 'https://puk360-backend.azurewebsites.net/api', description: 'Production server' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
export default specs;