# DOTTS

Aplicación para conectar clientes con técnicos de oficios (plomería, electricidad, carpintería, etc.). Incluye:

- `backend/` API REST (Node.js + Express + TypeScript) conectada a **SQL Server** con `mssql`.
- `web/` App web (React + Vite).
- `mobile/` App móvil (Expo / React Native).
- `dotts_app.html` Prototipo UI (referencia).

## Requisitos

- Node.js 20+
- SQL Server (local instalado o Azure SQL)

## 1) Base de datos (SQL Server)

1. Crea la base de datos `dotts` en tu SQL Server.
2. Ejecuta el esquema:
   - Archivo: `backend/sql/schema.sql`
   - Ejecutarlo **dentro** de la base `dotts` (SSMS / Azure Data Studio).

## 2) Backend

```bash
cd backend
copy .env.example .env
# Edita DATABASE_URL y JWT_SECRET
npm install
npm run db:seed
npm run dev
```

- Healthcheck: `GET /health` → `http://localhost:4000/health`

### DATABASE_URL (ejemplos)

SQL Server local:

```
sqlserver://localhost:1433;database=dotts;user=sa;password=TU_CLAVE;encrypt=true;trustServerCertificate=true
```

Azure SQL (ejemplo típico):

```
sqlserver://TU_SERVER.database.windows.net:1433;database=dotts;user=TU_USER;password=TU_PASS;encrypt=true;trustServerCertificate=false
```

## 3) App web

```bash
cd web
copy .env.example .env
npm install
npm run dev
```

Por defecto usa `VITE_API_URL=http://localhost:4000`.

## 4) App móvil

```bash
cd mobile
copy .env.example .env
npm install
npm start
```

En emulador Android suele funcionar `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`.

## Correr todo (Windows)

Ejecuta:

```bat
run-dev.bat
```

Abre 3 terminales: backend, web y mobile.

# DOTTS
