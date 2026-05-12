Propuesta no destructiva de arbol para `src` (DDD por bounded context)

Objetivo:
- Definir estructura destino sin borrar nada de golpe.
- Etiquetar que existe hoy, que es nuevo, y que es futuro opcional.

Leyenda:
- [EXISTENTE] Ya esta en el proyecto.
- [NUEVO] Se puede agregar en fases.
- [FUTURO] Opcional para una etapa posterior.
- [NO BORRAR AUN] Mantener hasta terminar migracion.

Regla DDD:
- No hay bounded contexts dentro de otro bounded context.
- Son modulos hermanos y se integran por API/eventos/read-model.

src/
|
+-- iam/                                [EXISTENTE] BC: identidad y acceso
|   +-- application/
|   |   +-- iam.store.js
|   +-- infrastructure/
|   |   +-- iam-api.js
|   |   +-- token-storage.js
|   +-- presentation/
|       +-- iam-routes.js
|       +-- guards/
|       |   +-- auth.guard.js
|       +-- views/
|           +-- login-view.component.vue
|
+-- agenda-veterinaria/                 [EXISTENTE] BC: agenda y citas
|   +-- application/
|   |   +-- agenda.store.js
|   +-- domain/
|   |   +-- model/
|   |       +-- cita.entity.js
|   +-- infrastructure/
|   |   +-- agenda-api.js
|   |   +-- cita.assembler.js
|   +-- presentation/
|       +-- agenda-routes.js
|       +-- views/
|           +-- agenda-view.component.vue
|
+-- gestion-clinica/                    [EXISTENTE] BC: atencion medica
|   +-- application/
|   |   +-- store/
|   |       +-- patient.store.js
|   |       +-- client.store.js
|   |   +-- gestion-clinica.store.js    [NO BORRAR AUN]
|   +-- domain/
|   |   +-- model/
|   |       +-- patient.entity.js
|   |       +-- client.entity.js
|   +-- infrastructure/
|   |   +-- services/
|   |       +-- patient.service.js
|   |       +-- client.service.js
|   +-- presentation/
|       +-- gestion-clinica-routes.js
|       +-- components/
|       |   +-- gestion-clinica-layout.component.vue
|       +-- views/
|           +-- pacientes-view.component.vue
|           +-- clientes-view.component.vue
|           +-- consultas-view.component.vue
|           +-- historial-view.component.vue
|           +-- vacunas-view.component.vue
|           +-- hospitalizacion-view.component.vue
|
+-- comunicacion/                       [EXISTENTE] BC: comunicacion
|   +-- domain/
|   |   +-- notificacion.entity.js
|   |   +-- recordatorio.entity.js
|   +-- infrastructure/
|   |   +-- comunicacion-api.js
|   +-- presentation/
|       +-- comunicacion-routes.js
|       +-- views/
|           +-- comunicacion-view.component.vue
|   +-- application/                    [NUEVO]
|       +-- comunicacion.store.js
|
+-- perfil/                             [EXISTENTE] BC: perfil de usuario
|   +-- domain/
|   |   +-- perfil.entity.js
|   +-- infrastructure/
|   |   +-- perfil-api.js
|   +-- presentation/
|       +-- perfil-routes.js
|       +-- views/
|           +-- perfil-view.component.vue
|   +-- application/                    [NUEVO]
|       +-- perfil.store.js
|
+-- panel-resumen/                      [EXISTENTE] read model de dashboard
|   +-- application/
|   |   +-- panel-resumen.store.js
|   +-- infrastructure/
|   |   +-- panel-resumen-api.js
|   +-- presentation/
|       +-- views/
|           +-- dashboard-view.component.vue
|
+-- reporting/                          [FUTURO] renombre opcional de panel-resumen
|   +-- application/
|   |   +-- dashboard.store.js
|   +-- infrastructure/
|   |   +-- reporting-api.js
|   +-- presentation/
|       +-- reporting-routes.js
|       +-- views/
|           +-- dashboard-view.component.vue
|
+-- backoffice-admin/                   [NUEVO] area para segmento administrador
|   +-- inventory/                      [NUEVO] BC: inventario
|   |   +-- application/
|   |   |   +-- inventory.store.js
|   |   +-- domain/
|   |   |   +-- model/
|   |   |       +-- producto.entity.js
|   |   |       +-- movimiento-stock.entity.js
|   |   |       +-- alerta-stock.value.js
|   |   +-- infrastructure/
|   |   |   +-- inventory-api.js
|   |   |   +-- producto.assembler.js
|   |   +-- presentation/
|   |       +-- inventory-routes.js
|   |       +-- views/
|   |           +-- inventario-view.component.vue
|   |
|   +-- procurement/                    [NUEVO] BC: compras y proveedores
|   |   +-- application/
|   |   |   +-- procurement.store.js
|   |   +-- domain/
|   |   |   +-- model/
|   |   |       +-- proveedor.entity.js
|   |   |       +-- orden-compra.entity.js
|   |   +-- infrastructure/
|   |   |   +-- procurement-api.js
|   |   +-- presentation/
|   |       +-- procurement-routes.js
|   |       +-- views/
|   |           +-- proveedores-view.component.vue
|   |           +-- ordenes-compra-view.component.vue
|   |
|   +-- billing/                        [NUEVO] BC: facturacion y cobros
|   |   +-- application/
|   |   |   +-- billing.store.js
|   |   +-- domain/
|   |   |   +-- model/
|   |   |       +-- factura.entity.js
|   |   |       +-- pago.entity.js
|   |   +-- infrastructure/
|   |   |   +-- billing-api.js
|   |   |   +-- factura.assembler.js
|   |   +-- presentation/
|   |       +-- billing-routes.js
|   |       +-- views/
|   |           +-- facturacion-view.component.vue
|   |
|   +-- accounting/                     [NUEVO] BC: finanzas y reportes
|       +-- application/
|       |   +-- accounting.store.js
|       +-- domain/
|       |   +-- model/
|       |       +-- ingreso.entity.js
|       |       +-- egreso.entity.js
|       |       +-- reporte-financiero.entity.js
|       |       +-- rentabilidad.value.js
|       +-- infrastructure/
|       |   +-- accounting-api.js
|       |   +-- reporte.assembler.js
|       +-- presentation/
|           +-- accounting-routes.js
|           +-- views/
|               +-- reportes-view.component.vue
|               +-- ganancias-perdidas-view.component.vue
|
+-- shared/                             [EXISTENTE] reutilizable, sin negocio
|   +-- infrastructure/
|   |   +-- base-api.js
|   +-- presentation/
|       +-- components/
|           +-- layout.component.vue
|           +-- language-switcher.component.vue
|
+-- locales/                            [EXISTENTE]
+-- App.vue                             [EXISTENTE]
+-- i18n.js                             [EXISTENTE]
+-- main.js                             [EXISTENTE]
+-- router.js                           [EXISTENTE]
+-- style.css                           [EXISTENTE]

Plan de migracion seguro (sin borrar de golpe)

Fase 1 - Agregar sin romper
1) Crear `backoffice-admin/*` con rutas aisladas.
2) Crear `comunicacion/application/comunicacion.store.js`.
3) Crear `perfil/application/perfil.store.js`.
4) Mantener `panel-resumen` tal cual.

Fase 2 - Integrar y probar
1) Conectar rutas nuevas en `router.js`.
2) Integrar menu por roles (IAM).
3) Validar que no se rompan vistas actuales.

Fase 3 - Migrar opcional
1) Si quieres, introducir `reporting/` como reemplazo de `panel-resumen`.
2) Mantener ambos temporalmente con alias de ruta.

Fase 4 - Deprecar y eliminar
1) Marcar archivos antiguos como deprecados.
2) Eliminar solo cuando no haya imports/rutas activos.