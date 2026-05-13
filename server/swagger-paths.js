/**
 * Definiciones OpenAPI (swagger-jsdoc). Prefijo /api/v1 según routes.json.
 * json-server expone REST estándar sobre cada array en db.json.
 */

/**
 * @openapi
 * /api/v1/clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Listar clientes
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clientes]
 *     summary: Crear clientes
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/clientes/{id}:
 *   get:
 *     tags: [Clientes]
 *     summary: Obtener clientes por id
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
 *     tags: [Clientes]
 *     summary: Reemplazar clientes
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
 *     tags: [Clientes]
 *     summary: Parchear clientes
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
 *     tags: [Clientes]
 *     summary: Eliminar clientes
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
 */
/**
 * @openapi
 * /api/v1/especies:
 *   get:
 *     tags: [Pacientes]
 *     summary: Listar especies
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Pacientes]
 *     summary: Crear especies
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/especies/{id}:
 *   get:
 *     tags: [Pacientes]
 *     summary: Obtener especies por id
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
 *     tags: [Pacientes]
 *     summary: Reemplazar especies
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
 *     tags: [Pacientes]
 *     summary: Parchear especies
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
 *     tags: [Pacientes]
 *     summary: Eliminar especies
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
 */
/**
 * @openapi
 * /api/v1/razas:
 *   get:
 *     tags: [Pacientes]
 *     summary: Listar razas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Pacientes]
 *     summary: Crear razas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/razas/{id}:
 *   get:
 *     tags: [Pacientes]
 *     summary: Obtener razas por id
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
 *     tags: [Pacientes]
 *     summary: Reemplazar razas
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
 *     tags: [Pacientes]
 *     summary: Parchear razas
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
 *     tags: [Pacientes]
 *     summary: Eliminar razas
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
 */
/**
 * @openapi
 * /api/v1/mascotas:
 *   get:
 *     tags: [Pacientes]
 *     summary: Listar mascotas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Pacientes]
 *     summary: Crear mascotas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/mascotas/{id}:
 *   get:
 *     tags: [Pacientes]
 *     summary: Obtener mascotas por id
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
 *     tags: [Pacientes]
 *     summary: Reemplazar mascotas
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
 *     tags: [Pacientes]
 *     summary: Parchear mascotas
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
 *     tags: [Pacientes]
 *     summary: Eliminar mascotas
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
 */
/**
 * @openapi
 * /api/v1/estados_cita:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar estados_cita
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear estados_cita
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/estados_cita/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener estados_cita por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar estados_cita
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
 *     tags: [Catalogo]
 *     summary: Parchear estados_cita
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
 *     tags: [Catalogo]
 *     summary: Eliminar estados_cita
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
 */
/**
 * @openapi
 * /api/v1/motivos_consulta:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar motivos_consulta
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear motivos_consulta
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/motivos_consulta/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener motivos_consulta por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar motivos_consulta
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
 *     tags: [Catalogo]
 *     summary: Parchear motivos_consulta
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
 *     tags: [Catalogo]
 *     summary: Eliminar motivos_consulta
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
 */
/**
 * @openapi
 * /api/v1/citas:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar citas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear citas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/citas/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener citas por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar citas
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
 *     tags: [Clinica]
 *     summary: Parchear citas
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
 *     tags: [Clinica]
 *     summary: Eliminar citas
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
 */
/**
 * @openapi
 * /api/v1/consultas:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar consultas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear consultas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/consultas/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener consultas por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar consultas
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
 *     tags: [Clinica]
 *     summary: Parchear consultas
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
 *     tags: [Clinica]
 *     summary: Eliminar consultas
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
 */
/**
 * @openapi
 * /api/v1/tratamientos:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar tratamientos
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear tratamientos
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/tratamientos/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener tratamientos por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar tratamientos
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
 *     tags: [Clinica]
 *     summary: Parchear tratamientos
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
 *     tags: [Clinica]
 *     summary: Eliminar tratamientos
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
 */
/**
 * @openapi
 * /api/v1/tipos_vacuna:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar tipos_vacuna
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear tipos_vacuna
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/tipos_vacuna/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener tipos_vacuna por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar tipos_vacuna
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
 *     tags: [Catalogo]
 *     summary: Parchear tipos_vacuna
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
 *     tags: [Catalogo]
 *     summary: Eliminar tipos_vacuna
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
 */
/**
 * @openapi
 * /api/v1/vacunas:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar vacunas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear vacunas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/vacunas/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener vacunas por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar vacunas
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
 *     tags: [Clinica]
 *     summary: Parchear vacunas
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
 *     tags: [Clinica]
 *     summary: Eliminar vacunas
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
 */
/**
 * @openapi
 * /api/v1/estados_hospitalizacion:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar estados_hospitalizacion
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear estados_hospitalizacion
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/estados_hospitalizacion/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener estados_hospitalizacion por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar estados_hospitalizacion
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
 *     tags: [Catalogo]
 *     summary: Parchear estados_hospitalizacion
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
 *     tags: [Catalogo]
 *     summary: Eliminar estados_hospitalizacion
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
 */
/**
 * @openapi
 * /api/v1/hospitalizacion:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar hospitalizacion
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear hospitalizacion
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/hospitalizacion/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener hospitalizacion por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar hospitalizacion
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
 *     tags: [Clinica]
 *     summary: Parchear hospitalizacion
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
 *     tags: [Clinica]
 *     summary: Eliminar hospitalizacion
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
 */
/**
 * @openapi
 * /api/v1/medicamentos:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar medicamentos
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear medicamentos
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/medicamentos/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener medicamentos por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar medicamentos
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
 *     tags: [Catalogo]
 *     summary: Parchear medicamentos
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
 *     tags: [Catalogo]
 *     summary: Eliminar medicamentos
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
 */
/**
 * @openapi
 * /api/v1/medicacion_hospitalaria:
 *   get:
 *     tags: [Catalogo]
 *     summary: Listar medicacion_hospitalaria
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Catalogo]
 *     summary: Crear medicacion_hospitalaria
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/medicacion_hospitalaria/{id}:
 *   get:
 *     tags: [Catalogo]
 *     summary: Obtener medicacion_hospitalaria por id
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
 *     tags: [Catalogo]
 *     summary: Reemplazar medicacion_hospitalaria
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
 *     tags: [Catalogo]
 *     summary: Parchear medicacion_hospitalaria
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
 *     tags: [Catalogo]
 *     summary: Eliminar medicacion_hospitalaria
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
 */
/**
 * @openapi
 * /api/v1/notificaciones:
 *   get:
 *     tags: [Comunicacion]
 *     summary: Listar notificaciones
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Comunicacion]
 *     summary: Crear notificaciones
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/notificaciones/{id}:
 *   get:
 *     tags: [Comunicacion]
 *     summary: Obtener notificaciones por id
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
 *     tags: [Comunicacion]
 *     summary: Reemplazar notificaciones
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
 *     tags: [Comunicacion]
 *     summary: Parchear notificaciones
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
 *     tags: [Comunicacion]
 *     summary: Eliminar notificaciones
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
 */
/**
 * @openapi
 * /api/v1/recordatorios:
 *   get:
 *     tags: [Comunicacion]
 *     summary: Listar recordatorios
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Comunicacion]
 *     summary: Crear recordatorios
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/recordatorios/{id}:
 *   get:
 *     tags: [Comunicacion]
 *     summary: Obtener recordatorios por id
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
 *     tags: [Comunicacion]
 *     summary: Reemplazar recordatorios
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
 *     tags: [Comunicacion]
 *     summary: Parchear recordatorios
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
 *     tags: [Comunicacion]
 *     summary: Eliminar recordatorios
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
 */
/**
 * @openapi
 * /api/v1/dashboard_kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Listar dashboard_kpis
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Dashboard]
 *     summary: Crear dashboard_kpis
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/dashboard_kpis/{id}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener dashboard_kpis por id
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
 *     tags: [Dashboard]
 *     summary: Reemplazar dashboard_kpis
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
 *     tags: [Dashboard]
 *     summary: Parchear dashboard_kpis
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
 *     tags: [Dashboard]
 *     summary: Eliminar dashboard_kpis
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
 */
/**
 * @openapi
 * /api/v1/dashboard_citas:
 *   get:
 *     tags: [Dashboard]
 *     summary: Listar dashboard_citas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Dashboard]
 *     summary: Crear dashboard_citas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/dashboard_citas/{id}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener dashboard_citas por id
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
 *     tags: [Dashboard]
 *     summary: Reemplazar dashboard_citas
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
 *     tags: [Dashboard]
 *     summary: Parchear dashboard_citas
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
 *     tags: [Dashboard]
 *     summary: Eliminar dashboard_citas
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
 */
/**
 * @openapi
 * /api/v1/dashboard_alertas:
 *   get:
 *     tags: [Dashboard]
 *     summary: Listar dashboard_alertas
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Dashboard]
 *     summary: Crear dashboard_alertas
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/dashboard_alertas/{id}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener dashboard_alertas por id
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
 *     tags: [Dashboard]
 *     summary: Reemplazar dashboard_alertas
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
 *     tags: [Dashboard]
 *     summary: Parchear dashboard_alertas
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
 *     tags: [Dashboard]
 *     summary: Eliminar dashboard_alertas
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
 */
/**
 * @openapi
 * /api/v1/dashboard_actividad:
 *   get:
 *     tags: [Dashboard]
 *     summary: Listar dashboard_actividad
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Dashboard]
 *     summary: Crear dashboard_actividad
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/dashboard_actividad/{id}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener dashboard_actividad por id
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
 *     tags: [Dashboard]
 *     summary: Reemplazar dashboard_actividad
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
 *     tags: [Dashboard]
 *     summary: Parchear dashboard_actividad
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
 *     tags: [Dashboard]
 *     summary: Eliminar dashboard_actividad
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
 */
/**
 * @openapi
 * /api/v1/pacientes:
 *   get:
 *     tags: [Pacientes]
 *     summary: Listar pacientes
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Pacientes]
 *     summary: Crear pacientes
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/pacientes/{id}:
 *   get:
 *     tags: [Pacientes]
 *     summary: Obtener pacientes por id
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
 *     tags: [Pacientes]
 *     summary: Reemplazar pacientes
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
 *     tags: [Pacientes]
 *     summary: Parchear pacientes
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
 *     tags: [Pacientes]
 *     summary: Eliminar pacientes
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
 */
/**
 * @openapi
 * /api/v1/inventory_products:
 *   get:
 *     tags: [Backoffice]
 *     summary: Listar inventory_products
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Backoffice]
 *     summary: Crear inventory_products
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/inventory_products/{id}:
 *   get:
 *     tags: [Backoffice]
 *     summary: Obtener inventory_products por id
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
 *     tags: [Backoffice]
 *     summary: Reemplazar inventory_products
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
 *     tags: [Backoffice]
 *     summary: Parchear inventory_products
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
 *     tags: [Backoffice]
 *     summary: Eliminar inventory_products
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
 */
/**
 * @openapi
 * /api/v1/inventory_movements:
 *   get:
 *     tags: [Backoffice]
 *     summary: Listar inventory_movements
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Backoffice]
 *     summary: Crear inventory_movements
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/inventory_movements/{id}:
 *   get:
 *     tags: [Backoffice]
 *     summary: Obtener inventory_movements por id
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
 *     tags: [Backoffice]
 *     summary: Reemplazar inventory_movements
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
 *     tags: [Backoffice]
 *     summary: Parchear inventory_movements
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
 *     tags: [Backoffice]
 *     summary: Eliminar inventory_movements
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
 */
/**
 * @openapi
 * /api/v1/procurement_suppliers:
 *   get:
 *     tags: [Backoffice]
 *     summary: Listar procurement_suppliers
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Backoffice]
 *     summary: Crear procurement_suppliers
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/procurement_suppliers/{id}:
 *   get:
 *     tags: [Backoffice]
 *     summary: Obtener procurement_suppliers por id
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
 *     tags: [Backoffice]
 *     summary: Reemplazar procurement_suppliers
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
 *     tags: [Backoffice]
 *     summary: Parchear procurement_suppliers
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
 *     tags: [Backoffice]
 *     summary: Eliminar procurement_suppliers
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
 */
/**
 * @openapi
 * /api/v1/procurement_orders:
 *   get:
 *     tags: [Backoffice]
 *     summary: Listar procurement_orders
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Backoffice]
 *     summary: Crear procurement_orders
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/procurement_orders/{id}:
 *   get:
 *     tags: [Backoffice]
 *     summary: Obtener procurement_orders por id
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
 *     tags: [Backoffice]
 *     summary: Reemplazar procurement_orders
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
 *     tags: [Backoffice]
 *     summary: Parchear procurement_orders
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
 *     tags: [Backoffice]
 *     summary: Eliminar procurement_orders
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
 */
/**
 * @openapi
 * /api/v1/economics_entries:
 *   get:
 *     tags: [Economico]
 *     summary: Listar economics_entries
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Economico]
 *     summary: Crear economics_entries
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/economics_entries/{id}:
 *   get:
 *     tags: [Economico]
 *     summary: Obtener economics_entries por id
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
 *     tags: [Economico]
 *     summary: Reemplazar economics_entries
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
 *     tags: [Economico]
 *     summary: Parchear economics_entries
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
 *     tags: [Economico]
 *     summary: Eliminar economics_entries
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
 */
/**
 * @openapi
 * /api/v1/historial_clinico:
 *   get:
 *     tags: [Clinica]
 *     summary: Listar historial_clinico
 *     parameters:
 *       - in: query
 *         name: patientId
 *         description: Filtra por id de paciente (json-server)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Clinica]
 *     summary: Crear historial_clinico
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Creado
 * /api/v1/historial_clinico/{id}:
 *   get:
 *     tags: [Clinica]
 *     summary: Obtener historial_clinico por id
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
 *     tags: [Clinica]
 *     summary: Reemplazar historial_clinico
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
 *     tags: [Clinica]
 *     summary: Parchear historial_clinico
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
 *     tags: [Clinica]
 *     summary: Eliminar historial_clinico
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
 */
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
