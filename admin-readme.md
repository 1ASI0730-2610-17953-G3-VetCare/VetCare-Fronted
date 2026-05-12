# Backoffice Admin - VetCare Pro

Este documento describe la estructura y funcionalidades del módulo de administración (`backoffice-admin`) del sistema VetCare Pro. Está diseñado para servir como referencia para la generación de mockups y diseño de UI.

El módulo de administración es exclusivo para usuarios con el rol `admin` y consta de tres secciones principales accesibles desde el menú lateral.

---

## 1. Inventario (`/admin/inventory`)

Esta vista permite al administrador gestionar el catálogo de productos, medicamentos y alimentos de la clínica, así como controlar el nivel de stock.

### Elementos de la interfaz:
- **Header de la tarjeta**: Título "Inventario".
- **Tabla de datos (Data List)**:
  - **Columnas**: Código, Producto, Categoría, Stock, Estado, Acciones.
  - **Fila de producto**:
    - Texto simple para Código, Producto y Categoría.
    - **Input numérico**: Campo editable para modificar la cantidad de stock directamente en la tabla.
    - **Etiqueta de Estado (Status Tag)**: Indicador visual del nivel de stock.
      - Verde ("Normal") si el stock es mayor al mínimo.
      - Rojo ("Bajo Stock") si el stock es igual o menor al mínimo.
    - **Botón de Acción**: Botón primario "Actualizar" para guardar el nuevo valor de stock ingresado.

### Funcionalidad:
- Listar todos los productos del inventario.
- Identificar rápidamente productos con bajo stock mediante etiquetas de color.
- Actualizar la cantidad de stock de un producto específico.

---

## 2. Compras y Proveedores (`/admin/procurement`)

Esta vista está dividida en dos secciones principales (tarjetas) para gestionar la relación con los proveedores y registrar nuevas órdenes de compra.

### Elementos de la interfaz:

#### Sección A: Proveedores (Listado)
- **Header de la tarjeta**: Título "Proveedores".
- **Tabla de datos**:
  - **Columnas**: Nombre, Contacto, Teléfono, Email, Estado.
  - **Fila de proveedor**: Información de contacto y una etiqueta visual verde ("Activo") para el estado.

#### Sección B: Nueva Orden de Compra (Formulario)
- **Header de la tarjeta**: Título "Nueva Orden de Compra".
- **Formulario (Form Container)**:
  - **Select (Dropdown)**: "Proveedor". Permite seleccionar un proveedor de la lista cargada previamente.
  - **Input numérico**: "Total ($)". Campo para ingresar el monto total de la orden.
  - **Botón de Acción**: Botón primario "Crear Orden" para enviar el formulario.

### Funcionalidad:
- Consultar el directorio de proveedores activos.
- Registrar rápidamente una nueva orden de compra asociándola a un proveedor existente y definiendo su monto total.

---

## 3. Económico (`/admin/economics`)

Esta vista proporciona un resumen financiero de la clínica y permite registrar nuevos movimientos de dinero. Utiliza un diseño asimétrico (grid 70/30) similar al dashboard principal.

### Elementos de la interfaz:

#### Sección A: KPIs (Tarjetas de métricas superiores)
- Tres tarjetas (Stat Cards) alineadas horizontalmente:
  1. **Ingresos**: Icono de flecha arriba (verde), título "Ingresos", valor monetario total.
  2. **Egresos**: Icono de flecha abajo (rojo), título "Egresos", valor monetario total.
  3. **Balance**: Icono de billetera (azul/info), título "Balance", valor monetario resultante (Ingresos - Egresos).

#### Sección B: Movimientos Recientes (Columna principal - 70%)
- **Header de la tarjeta**: Título "Movimientos Recientes".
- **Tabla de datos**:
  - **Columnas**: Fecha, Tipo, Categoría, Descripción, Monto.
  - **Fila de movimiento**:
    - Fecha formateada.
    - **Etiqueta de Tipo**: Verde para "Ingreso", Rojo para "Egreso".
    - Texto para Categoría y Descripción.
    - Monto en formato moneda (negrita).

#### Sección C: Nuevo Movimiento (Columna lateral - 30%)
- **Header de la tarjeta**: Título "Nuevo Movimiento".
- **Formulario (Form Container)**:
  - **Select (Dropdown)**: "Tipo". Opciones: "Ingreso" o "Egreso".
  - **Input de texto**: "Categoría". (Ej. Consulta, Insumos).
  - **Input de texto**: "Descripción". Detalle del movimiento.
  - **Input numérico**: "Monto ($)".
  - **Botón de Acción**: Botón primario "Registrar" para guardar el movimiento.

### Funcionalidad:
- Visualizar de un vistazo el estado financiero actual (Ingresos, Egresos, Balance).
- Consultar el historial detallado de transacciones.
- Registrar nuevos ingresos o egresos de forma rápida, actualizando automáticamente los KPIs y la tabla de movimientos.
