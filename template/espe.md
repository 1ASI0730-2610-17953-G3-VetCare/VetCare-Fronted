# Reglas y Estructura del Proyecto (Arquitectura DDD)

Este documento define la estructura de carpetas, reglas arquitectónicas, y clarifica qué responsabilidades tiene cada componente del proyecto. Está basado en la arquitectura Domain-Driven Design (DDD) planteada en el esquema principal (`vetcare.md`) y la plantilla dentro de `src/`.

---

## Anatomía de un Bounded Context
Cada módulo principal o *Bounded Context* (ej. `gestion-clinica`, `agenda-veterinaria`, `atencion-propietario`) sigue un principio de segregación en 4 capas strictas.

### 1. `domain/` (Dominio)
El núcleo de tu aplicación. Contiene el modelado puro de los problemas y las reglas del negocio.
*   **¿Qué SÍ debe ir aquí?**
    *   **Entidades (`*.entity.js`):** Clases que definen la estructura core de tus datos y sus reglas más básicas (ej. `mascota.entity.js`). Estas entidades tienen "identidad" única (como un `id`).
    *   **Value Objects / VOs (`*.value.js`):** Clases inmutables que enriquecen a las entidades. No tienen identidad, pero describen propiedades complejas (ej. `diagnostico.value.js`, `horario.value.js`).
    *   **Aggregate Roots:** Entidades principales que encapsulan el acceso y consistencia de un grupo de entidades relacionadas (ej. `consulta.entity.js` o `cita.entity.js`).
*   **¿Qué NO debe ir aquí?**
    *   Lógica de Framework (imports de la UI, Pinia, Vue.js, etc.).
    *   Configuraciones HTTP (Axios) o detalles de acceso al backend.
    *   Reglas para manipular cómo se renderiza algo en la pantalla.

### 2. `infrastructure/` (Infraestructura)
La capa externa encargada de comunicarse con recursos, APIS y servicios fuera del módulo o fuera del fron-tend.
*   **¿Qué SÍ debe ir aquí?**
    *   **APIs (`*-api.js`):** Clases/servicios para manejar el consumo y llamados HTTP al backend para ese módulo utilizando Axios o fetch.
    *   **Assemblers / Mappers (`*.assembler.js`):** Traductores de datos. Si una API externa devuelve un esquema asombrosamente distinto, el assembler se asegura de mapear esa respuesta en bruto a nuestra pura y perfecta Entidad del Dominio (y viceversa).
*   **¿Qué NO debe ir aquí?**
    *   Lógica de validación compleja o de negocio (ej. verificar que un paciente está sano; esto es del dominio).
    *   Interacciones o modificaciones de Vista.

### 3. `application/` (Aplicación)
La capa mediadora. Traduce las acciones del usuario de la Vista, en operaciones utilizando Dominio e Infraestructura. Aquí viven los Casos de Uso.
*   **¿Qué SÍ debe ir aquí?**
    *   **Stores / Gestores de Estado (`*.store.js`):** Por ejemplo, los stores de Pinia locales al módulo (`gestion-clinica.store.js`). 
    *   **Orquestación:** Llamar a los servicios de infraestructura y guardar respuestas en la tienda para hacerlas accesibles a las vistas de presentation. Administra el flujo general del caso de uso.
*   **¿Qué NO debe ir aquí?**
    *   Peticiones o endpoints quemados o en bruto (estos deben abstraerse e invocarse a través de la infraestructura).
    *   Pintar componentes en pantalla o importar archivos `.vue`.

### 4. `presentation/` (Presentación)
Capa estrictamente visual. El objetivo último es mostrar la data en el navegador y capturar eventos del usuario hacia el store.
*   **¿Qué SÍ debe ir aquí?**
    *   **Componentes de Vista (`views/*.component.vue`):** Todo componente de Vue.js relacionado específicamente al módulo (fomularios, tarjetas, paginas completas, etc).
    *   **Rrutas modulares (`*-routes.js`):** Archivo que define de forma aislada las propias rutas Vue-Router pertenecientes a este contexto para que luego sean importadas globalmente.
*   **¿Qué NO debe ir aquí?**
    *   Lógica de aplicación directa (ej. mapear arrays sucios que vienen del backend; de esto se debuta el assembler).
    *   Avisar al backend con promesas crudas locales (`axios.post(...)` no debe existir aquí, se debe ejecutar una acción al Store en `application`, el cual usa a la `infrastructure`).

---

## 5. El Directorio `shared/`
Contiene lógica común, abstracta y transversal a TODO el proyecto. Mismos principios, ámbito más general.

*   **¿Qué SÍ debe ir?**
    *   Componentes visuales puros que no saben nada del negocio: botones con estilos genéricos, layouts, modales reutilizables, lenguajes genéricos (`base-button.component.vue`).
    *   Utilidades de infraestructura puras (ej. configuración global base de Axios mediante `base-api.js`, el cual todos los Bounded Context consumirán).
*   **¿Qué NO debe ir?**
    *   Vistas con reglas de negocio atadas a ellas (una tabla genérica está bien, pero una "Tabla de Mascota" no. Esa última debe ir en el módulo `gestion-clinica`).

## 6. Las raíces de `src/` (`main.js`, `App.vue`, `router.js`, `pinia.js`)
*   **Objetivo exclusivo:** Proveer un punto de ensamblaje (Entry point). No se permite incluir ni lógica de aplicación general, ni entidades, únicamente actúan para inicializar componentes base del Framework, cargar estilos maestros (`style.css`), y registrar el router maestro sumando los routers particulares.
