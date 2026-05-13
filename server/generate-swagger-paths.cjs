const fs = require('fs');
const path = require('path');

const arrays = [
  'clientes', 'especies', 'razas', 'mascotas', 'estados_cita', 'motivos_consulta', 'citas', 'consultas',
  'tratamientos', 'tipos_vacuna', 'vacunas', 'estados_hospitalizacion', 'hospitalizacion', 'medicamentos',
  'medicacion_hospitalaria', 'notificaciones', 'recordatorios', 'dashboard_kpis', 'dashboard_citas',
  'dashboard_alertas', 'dashboard_actividad', 'pacientes', 'inventory_products', 'inventory_movements',
  'procurement_suppliers', 'procurement_orders', 'economics_entries', 'historial_clinico',
];

function tagFor(name) {
  if (name.startsWith('dashboard_')) return 'Dashboard';
  if (name.includes('procurement') || name === 'inventory_products' || name === 'inventory_movements') {
    return 'Backoffice';
  }
  if (name === 'economics_entries') return 'Economico';
  if (['citas', 'consultas', 'tratamientos', 'historial_clinico', 'vacunas', 'hospitalizacion'].includes(name)) {
    return 'Clinica';
  }
  if (['pacientes', 'mascotas', 'especies', 'razas'].includes(name)) return 'Pacientes';
  if (name === 'clientes') return 'Clientes';
  if (name === 'notificaciones' || name === 'recordatorios') return 'Comunicacion';
  return 'Catalogo';
}

function block(name) {
  const tag = tagFor(name);
  const afterSummary =
    name === 'historial_clinico'
      ? `
 *     parameters:
 *       - in: query
 *         name: patientId
 *         description: Filtra por id de paciente (json-server)
 *         schema:
 *           type: integer`
      : '';

  return `
/**
 * @openapi
 * /api/v1/${name}:
 *   get:
 *     tags: [${tag}]
 *     summary: Listar ${name}${afterSummary}
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [${tag}]
 *     summary: Crear ${name}
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/${name}/{id}:
 *   get:
 *     tags: [${tag}]
 *     summary: Obtener ${name} por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *     responses:
 *       200:
 *         description: OK
 *   put:
 *     tags: [${tag}]
 *     summary: Reemplazar ${name}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [${tag}]
 *     summary: Parchear ${name}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [${tag}]
 *     summary: Eliminar ${name}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *     responses:
 *       204:
 *         description: Eliminado
 */`;
}

let out = `/**
 * Definiciones OpenAPI (swagger-jsdoc). Prefijo /api/v1 según routes.json.
 * json-server expone REST estándar sobre cada array en db.json.
 */
`;

arrays.forEach((n) => {
  out += block(n);
});

out += `
/**
 * @openapi
 * /api/v1/perfil:
 *   get:
 *     tags: [Usuario]
 *     summary: Obtener perfil
 *     responses:
 *       200:
 *         description: OK
 *   put:
 *     tags: [Usuario]
 *     summary: Reemplazar perfil
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 */
/**
 * @openapi
 * /api/v1/historial_stats:
 *   get:
 *     tags: [Clinica]
 *     summary: Estadísticas agregadas del historial
 *     responses:
 *       200:
 *         description: OK
 *   put:
 *     tags: [Clinica]
 *     summary: Reemplazar estadísticas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 */
module.exports = {};
`;

fs.writeFileSync(path.join(__dirname, 'swagger-paths.js'), out, 'utf8');
console.log('swagger-paths.js written', out.length, 'chars');
