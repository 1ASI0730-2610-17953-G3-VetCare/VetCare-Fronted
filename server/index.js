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
      description: 'API de pruebas para el proyecto VetCare',
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
  apis: [path.join(__dirname, 'index.js')], // Buscaremos las definiciones en este mismo archivo
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middlewares
server.use(cors());
server.use(express.json());
server.use(middlewares);
server.use(jsonServer.rewriter(routes));

// Documentación Swagger en la ruta /api-docs
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /pacientes:
 *   get:
 *     summary: Obtiene todos los pacientes
 *     tags: [Pacientes]
 *     responses:
 *       200:
 *         description: Lista de pacientes
 */

/**
 * @openapi
 * /citas:
 *   get:
 *     summary: Obtiene todas las citas
 *     tags: [Agenda]
 *     responses:
 *       200:
 *         description: Lista de citas
 */

/**
 * @openapi
 * /clientes:
 *   get:
 *     summary: Obtiene todos los clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */

/**
 * @openapi
 * /notificaciones:
 *   get:
 *     summary: Obtiene las notificaciones
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */

/**
 * @openapi
 * /perfil:
 *   get:
 *     summary: Obtiene el perfil del veterinario
 *     tags: [Usuario]
 *     responses:
 *       200:
 *         description: Datos del perfil
 */

/**
 * @openapi
 * /dashboard_kpis:
 *   get:
 *     summary: Obtiene los indicadores del dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Lista de KPIs
 */

/**
 * @openapi
 * /mascotas:
 *   get:
 *     summary: Obtiene todas las mascotas
 *     tags: [Pacientes]
 *     responses:
 *       200:
 *         description: Lista de mascotas
 */

/**
 * @openapi
 * /consultas:
 *   get:
 *     summary: Obtiene el historial de consultas
 *     tags: [Clínica]
 *     responses:
 *       200:
 *         description: Lista de consultas
 */

/**
 * @openapi
 * /especies:
 *   get:
 *     summary: Obtiene catálogo de especies
 *     tags: [Configuración]
 *     responses:
 *       200:
 *         description: Lista de especies
 */

// Usar el router de json-server
server.use(router);

server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});
