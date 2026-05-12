+-- backoffice-admin/                   [SIMPLIFICADO] modulo administrador esencial
|   +-- inventory/                      [ESENCIAL] stock y alertas
|   |   +-- application/
|   |   |   +-- inventory.store.js
|   |   +-- domain/
|   |   |   +-- model/
|   |   |       +-- producto.entity.js
|   |   |       +-- movimiento-stock.entity.js
|   |   +-- infrastructure/
|   |   |   +-- inventory-api.js
|   |   +-- presentation/
|   |       +-- inventory-routes.js
|   |       +-- views/
|   |           +-- inventario-view.component.vue
|   |
|   +-- procurement/                    [ESENCIAL] compras y proveedores
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
|   |
|   +-- economics/                      [ESENCIAL] control economico basico
|       +-- application/
|       |   +-- economics.store.js
|       +-- domain/
|       |   +-- model/
|       |       +-- ingreso.entity.js
|       |       +-- egreso.entity.js
|       +-- infrastructure/
|       |   +-- economics-api.js
|       +-- presentation/
|           +-- economics-routes.js
|           +-- views/
|               +-- resumen-economico-view.component.vue
|
Funciones minimas del administrador:
1) Ver y actualizar inventario critico.
2) Registrar compras a proveedores.
3) Registrar ingresos y egresos.
4) Consultar resumen economico mensual (ingresos, egresos, balance).