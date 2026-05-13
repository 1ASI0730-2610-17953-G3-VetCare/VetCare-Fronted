const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

const server = express();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();
const routes = require(path.join(__dirname, 'routes.json'));
const port = process.env.PORT || 3000;

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VetCare Mock API',
      version: '1.0.0',
      description:
        'Fake API (json-server). Rutas bajo /api/v1/* (routes.json). ' +
        'Colecciones en db.json: GET/POST en la raíz del recurso, GET/PUT/PATCH/DELETE en /{id}. ' +
        'Objetos únicos: perfil e historial_stats (GET/PUT).',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Servidor Local',
      },
      {
        url: 'https://fake-api-flfx.onrender.com',
        description: 'Servidor de Producción (Render)',
      },
    ],
  },
  apis: [path.join(__dirname, 'index.js'), path.join(__dirname, 'swagger-paths.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middlewares
server.use(cors());
server.use(express.json());
server.use(middlewares);
server.use(jsonServer.rewriter(routes));

// Documentación Swagger en /api-docs (rutas OpenAPI en swagger-paths.js)
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Usar el router de json-server
server.use(router);

server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});
