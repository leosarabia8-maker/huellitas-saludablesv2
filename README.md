# 🐾 Huellitas Saludables — Plataforma Web de Gestión Veterinaria

Demo del proyecto de Ingeniería de Requerimientos de Software (Equipo 7).
Plataforma web para digitalizar los procesos de la clínica veterinaria: citas, historiales clínicos, recetas digitales, alertas de alergias y vacunación.

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TailwindCSS + FullCalendar |
| Backend | Node.js + Express + Prisma ORM |
| Base de datos | PostgreSQL en **Neon** (gratis, no expira) |
| Despliegue | Vercel (frontend) + Render (backend) |

## 👥 Roles y funcionalidades

- **Veterinario**: búsqueda de pacientes en tiempo real, ficha clínica con **banner rojo parpadeante de alergias**, registro de consultas con receta digital (con confirmación al prescribir un alérgeno), registro de vacunas con **cálculo automático de próxima dosis**.
- **Recepcionista**: registro de pacientes con **ID único alfanumérico**, agenda con vistas día/semana/mes, **bloqueo automático de cruces de horario**, reprogramación y cancelación. También **gestiona doctores**: altas y activación/desactivación (sin borrar historiales, por trazabilidad).
- **Cliente**: portal con auto-registro, **registro de sus propias mascotas**, agendamiento autónomo con disponibilidad en vivo, **carné de vacunación digital** y confirmación de cita en pantalla.

## 🚀 Ejecutar en local (Ubuntu)

Requisitos: Node.js 20+ y una base de datos PostgreSQL (Neon).

```bash
# 1. Backend
cd backend
cp .env.example .env          # pega tu DATABASE_URL de Neon
npm install
npm run setup                 # crea las tablas y carga datos de demo
npm run dev                   # API en http://localhost:4000

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev                   # app en http://localhost:5173
```

### Cuentas de demostración

| Rol | Email | Contraseña |
|---|---|---|
| 👩‍⚕️ Veterinario | `vet@huellitas.dev` | `vet123` |
| 🗂️ Recepción | `recepcion@huellitas.dev` | `recepcion123` |
| 🐾 Cliente | `cliente@huellitas.dev` | `cliente123` |

## ☁️ Despliegue gratuito

### 1. Base de datos — [Neon](https://neon.tech)
1. Crear cuenta → **New Project** → región más cercana.
2. Copiar el **connection string** (`postgresql://...sslmode=require`).

### 2. Backend — [Render](https://render.com)
1. **New → Web Service** → conectar el repo de GitHub.
2. Root directory: `backend`.
3. Build command: `npm install && npx prisma db push && node prisma/seed.js`
4. Start command: `node src/index.js`
5. Variables de entorno:
   - `DATABASE_URL` = connection string de Neon
   - `JWT_SECRET` = un texto largo aleatorio
   - `FRONTEND_URL` = la URL de Vercel (se configura al final del paso 3)

### 3. Frontend — [Vercel](https://vercel.com)
1. **Import Project** → el mismo repo.
2. Root directory: `frontend`.
3. Variable de entorno: `VITE_API_URL` = URL del backend en Render (ej: `https://huellitas-api.onrender.com`)
4. Deploy → copia la URL pública y ponla como `FRONTEND_URL` en Render.

## 📝 Notas de la demo

- **Correo de confirmación (RS-11):** simulado — la confirmación se muestra en pantalla con fecha y hora. Para correos reales se puede integrar Resend (100/día gratis).
- **Trazabilidad (RF-05):** fecha, hora y veterinario de cada consulta se guardan automáticamente y no son editables. Por eso los doctores se **desactivan** en lugar de eliminarse (sección "Doctores" de recepción): su historial se conserva.
- Los datos se regeneran con `npm run db:seed` en `backend/` — ⚠️ **borra todos los datos** y recrea solo los de demo.
