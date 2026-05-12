Plan de implementación: ventana Clientes

Objetivo

Implementar Clientes como módulo funcional completo (listado, filtros, alta/edición, feedback UI) manteniendo consistencia visual, técnica y de arquitectura con el resto de gestion-clinica.

Alcance funcional (MVP profesional)

Listar clientes con búsqueda por nombre/teléfono/email/código.
Filtrar por estado (Activo, Inactivo, Con deuda).
Crear cliente desde modal con validaciones mínimas.
Editar cliente desde acciones de tabla/card.
Mostrar métricas rápidas (total, activos, nuevos, con deuda).
Mostrar estado vacío y toasts de éxito/error.

Archivos a crear/actualizar

Vista principal: d:/WebStorm/vetcare/src/gestion-clinica/presentation/views/clientes-view.component.vue

Entidad de dominio: d:/WebStorm/vetcare/src/gestion-clinica/domain/model/client.entity.js

Servicio HTTP: d:/WebStorm/vetcare/src/gestion-clinica/infrastructure/services/client.service.js

Store de aplicación: d:/WebStorm/vetcare/src/gestion-clinica/application/store/client.store.js

Textos i18n ES: d:/WebStorm/vetcare/src/locales/es.json

Textos i18n EN: d:/WebStorm/vetcare/src/locales/en.json

Diseño técnico (alineado al proyecto)

flowchart LR
  clientesView[clientesView.component.vue] --> clientStore[client.store.js]
  clientStore --> clientService[client.service.js]
  clientService --> apiClientes[/api/pacientes or /api/clientes]
  clientService --> clientEntity[client.entity.js]
  clientesView --> i18n[es.json and en.json]

Estructura visual propuesta (UI)

Bloque 1: Header de vista


Título y descripción.
Botón primario Registrar cliente.

Bloque 2: Tarjetas de resumen

Total clientes, Activos, Nuevos del mes, Con deuda.
Mismo patrón de tarjetas usadas en vacunas.

Bloque 3: Filtros

Input de búsqueda con icono.
Select de estado.
Botón opcional Limpiar filtros.


Bloque 4: Listado principal

Tabla desktop y adaptación móvil tipo cards.
Columnas: código, cliente, contacto, mascotas, próxima cita, estado, acciones.

Bloque 5: Modales


Modal único para crear/editar cliente.
Secciones internas: datos personales, contacto y observaciones.

Bloque 6: Estados de interfaz

loading, emptyState, errorToast, successToast.
Estructura estructural del módulo (capas y responsabilidades)

Presentation

clientes-view.component.vue: renderiza UI, dispara acciones del store, controla estado local de modal/filtros.

Application

client.store.js: orquesta carga/alta/edición, mantiene clients, loading, error.

Infrastructure

client.service.js: llamadas HTTP y mapeo de DTOs.

Domain


client.entity.js: shape estable del cliente para la app.

Localization

es.json y en.json: textos y labels de toda la vista.

flowchart TB
  subgraph presentationLayer [Presentation]
    clientesViewNode[clientesView]
  end
  subgraph applicationLayer [Application]
    clientStoreNode[clientStore]
  end
  subgraph infrastructureLayer [Infrastructure]
    clientServiceNode[clientService]
  end
  subgraph domainLayer [Domain]
    clientEntityNode[clientEntity]
  end
  subgraph localizationLayer [Localization]
    i18nNode[i18nClients]
  end
  clientesViewNode --> clientStoreNode
  clientStoreNode --> clientServiceNode
  clientServiceNode --> clientEntityNode
  clientesViewNode --> i18nNode

Fases de implementación

Modelo y servicio

Crear Client entity con campos: id, code, fullName, documentId, phone, email, status, petsCount, lastVisitAt, nextAppointmentAt, outstandingBalance.

Implementar ClientService con getAllClients() y createClient() (y opcional updateClient()).

Definir temporalmente el endpoint según backend disponible; si no existe /clientes, mapear desde /pacientes para MVP.


Store de clientes

Crear store Pinia con clients, loading, error.

Acciones: fetchClients, addClient, updateClient.

Centralizar manejo de errores para que la vista solo consuma estado/acciones.

UI de clientes (vista principal)

Reemplazar estado vacío por estructura completa:

Header con acción Registrar cliente.

Tarjetas KPI (4 indicadores).

Barra de filtros (search + estado).

Tabla o grid responsivo con acciones (ver, editar).


Modal crear/editar con validación y submit async.
Toast de resultado.
Reusar patrones visuales existentes de pacientes, consultas, vacunas para mantener armonía.
i18n completo
Agregar bloque clinicManagement.clients en ES/EN con:
title, description, register, search, allStatuses, columns, status, emptyState, registerForm, actions, kpis.
Eliminar textos hardcodeados en la vista de clientes.

Integración y calidad

Verificar consistencia de import paths (.js) como en módulos actuales.
Revisar estados de carga/errores y comportamiento en lista vacía.
Validar responsiveness y continuidad visual con layout/tabs.

Criterios de aceptación

La ruta /gestion-clinica/clientes muestra una pantalla funcional y no placeholder.
Alta de cliente funciona con validación y feedback visual.
Búsqueda y filtros alteran la lista correctamente.
Textos están internacionalizados en ES y EN.
Arquitectura respeta capas domain/infrastructure/application/presentation.
No rompe navegación ni estilos globales del módulo clínico.

Riesgos y mitigación

Endpoint de clientes inexistente: iniciar con adapter temporal desde datos de pacientes y dejar TODO claro para backend real.

Desalineación de estilos: copiar patrón estructural de pacientes y consultas antes de ajustar detalles.

Duplicación de lógica UI: mover utilidades simples (formateo/validación) a funciones locales reutilizables en la vista.