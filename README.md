# VetCare (Frontend)

Aplicación web de gestión veterinaria (Vue 3 + Vite). Incluye en este mismo monorepo una **API mock** con json-server en la carpeta `server/` para desarrollo y pruebas.

**Repositorio del curso:** [VetCare-Fronted](https://github.com/1ASI0730-2610-17953-G3-VetCare/VetCare-Fronted.git)

Ese remoto puede estar **vacío** al crearlo en GitHub: el primer `push` sube todo el historial y los archivos. **No hace falta clonar antes** si ya trabajas en una carpeta local con el proyecto; basta enlazar `origin` y hacer push (ver más abajo).

---

## Requisitos

- [Node.js](https://nodejs.org/) LTS (recomendado)
- [Git](https://git-scm.com/)

---

## Puesta en marcha local

### 1. Obtener el código e instalar dependencias

**Opción A — Ya tienes el proyecto en tu PC (recomendado si el repo en GitHub está vacío):** abre una terminal en la **carpeta raíz** del proyecto (donde está `package.json`) y ejecuta:

```bash
npm install
```

**Opción B — Clonar el remoto:** solo tiene sentido cuando el repositorio **ya tiene commits** (no está vacío). Si clonas un repo vacío, la carpeta casi no tendrá archivos: tendrías que copiar ahí tu proyecto antes de seguir.

```bash
git clone https://github.com/1ASI0730-2610-17953-G3-VetCare/VetCare-Fronted.git
cd VetCare-Fronted
npm install
```

### 2. Variables de entorno (frontend)

En la raíz del proyecto existen:

| Archivo            | Uso |
|--------------------|-----|
| `.env`             | Desarrollo: `VITE_API_URL` apunta al mock local |
| `.env.production`  | Build de producción: URL pública de la API (p. ej. Render) |

Ejemplo `.env`:

```env
VITE_API_URL=http://localhost:3000
```

Ajusta el valor según donde corra tu API mock.

### 3. API mock (json-server)

```bash
cd server
npm install
npm start
```

Por defecto escucha en el puerto definido por `PORT` o **3000**. La documentación Swagger suele estar en `http://localhost:3000/api-docs`.

### 4. Levantar el frontend

Desde la **raíz** del repo (otra terminal):

```bash
npm run dev
```

---

## Scripts útiles (raíz del repo)

| Comando        | Descripción |
|----------------|-------------|
| `npm run dev`  | Servidor de desarrollo Vite |
| `npm run build`| Build de producción → carpeta `dist/` |
| `npm run preview` | Vista previa del build |
| `npm run server` | Alternativa: json-server directo sobre `server/db.json` (si está definido en `package.json`) |

---

## Guía: subir tu código al repositorio (incluso si GitHub está vacío)

Hazlo desde la carpeta raíz de tu proyecto (donde está el `package.json` del frontend).

### Repositorio vacío en GitHub

Es lo normal al crear el repo sin marcar “Add a README”. No hay ramas ni commits en el remoto hasta el **primer push**. Tu flujo típico:

1. Tener todo el código listo en una carpeta local.
2. Inicializar Git (si no existe), hacer el primer commit y empujar a `main`.

GitHub mostrará el contenido tras el primer push exitoso.

### Si aún no tienes Git en esta carpeta

```bash
git init
git branch -M main
```

### Enlazar el remoto (solo la primera vez)

```bash
git remote add origin https://github.com/1ASI0730-2610-17953-G3-VetCare/VetCare-Fronted.git
```

Si ya existía otro `origin` y quieres apuntar a este repo:

```bash
git remote set-url origin https://github.com/1ASI0730-2610-17953-G3-VetCare/VetCare-Fronted.git
```

Comprueba con `git remote -v`.

### Primer commit y push (llena el repo vacío)

```bash
git status
git add .
git commit -m "Initial commit: VetCare frontend"
git push -u origin main
```

- La primera vez, `-u origin main` deja configurada la rama `main` para futuros `git push`.
- Si GitHub te pide autenticación, usa token (HTTPS) o SSH según la sección siguiente.

### Siguientes cambios

```bash
git add .
git commit -m "descripción del cambio"
git push
```

### Autenticación en GitHub

- **HTTPS:** usuario de GitHub y un [Personal Access Token](https://github.com/settings/tokens) como contraseña, o GitHub CLI (`gh auth login`).
- **SSH:** configura una clave SSH y usa la URL `git@github.com:1ASI0730-2610-17953-G3-VetCare/VetCare-Fronted.git`.

---

## Despliegue (referencia rápida)

| Pieza        | Tipo habitual | Notas |
|-------------|----------------|-------|
| **Frontend** | Netlify, Vercel, etc. | Build: `npm run build`, carpeta de publicación: `dist`. Variables `VITE_*` deben estar en el panel o en `.env.production` en el repo. |
| **API mock** | Render, Railway, etc. | Carpeta raíz del servicio: `server`, comando de arranque típico: `npm start`. Sin `npm run build` del frontend ahí. |

La URL pública de la API debe coincidir con `VITE_API_URL` en el build del frontend.

---

## Estructura relevante

```
├── src/                 # Código Vue (módulos por dominio)
├── server/              # API mock (Express + json-server)
│   ├── db.json          # Datos de prueba
│   ├── index.js         # Entrada del servidor
│   ├── routes.json      # Reglas (p. ej. prefijo /api/v1)
│   └── swagger-paths.js # Definiciones OpenAPI para Swagger UI
├── .env
├── .env.production
└── package.json
```

---

## Documentación adicional

- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [json-server](https://github.com/typicode/json-server)
