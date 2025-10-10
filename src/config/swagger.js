// swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PUK360 API",
      version: "1.0.0",
      description: "API documentation for the PUK360 project",
    },
    servers: [
      {
        url: "http://localhost:5000", // Change if your backend runs elsewhere
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  // Use project-root relative path for reliability when running from repo root
  apis: ["src/routes/*.js"],
};

const swaggerSpecs = swaggerJsdoc(options);

export default swaggerSpecs;
