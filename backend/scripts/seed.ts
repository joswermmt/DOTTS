import "dotenv/config";
import sql from "mssql";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { parsePrismaSqlServerUrl } from "../src/lib/sqlConfig.js";
import { Rol } from "../src/constants/enums.js";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  const config = parsePrismaSqlServerUrl(url);
  const pool = await sql.connect(config);

  const categorias = [
    { nombre: "Plomería", descripcion: "Tuberías, fugas, instalaciones" },
    { nombre: "Electricidad", descripcion: "Instalaciones y reparaciones eléctricas" },
    { nombre: "Carpintería", descripcion: "Muebles, puertas, estructuras de madera" },
    { nombre: "Pintura", descripcion: "Interiores y exteriores" },
    { nombre: "Climatización", descripcion: "Aires acondicionados y ventilación" },
    { nombre: "Jardinería", descripcion: "Mantenimiento de áreas verdes" },
  ];

  for (const c of categorias) {
    await pool
      .request()
      .input("nombre", sql.NVarChar(100), c.nombre)
      .input("descripcion", sql.NVarChar(500), c.descripcion)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM [Categoria] WHERE [nombre] = @nombre)
          INSERT INTO [Categoria] ([nombre],[descripcion]) VALUES (@nombre, @descripcion);
        ELSE
          UPDATE [Categoria] SET [descripcion] = @descripcion WHERE [nombre] = @nombre;
      `);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && adminPassword.length >= 8) {
    const hash = await bcrypt.hash(adminPassword, 12);
    const existing = await pool
      .request()
      .input("correo", sql.NVarChar(255), adminEmail)
      .query(`SELECT [id] FROM [Usuario] WHERE [correo] = @correo`);
    const row = existing.recordset[0] as { id: string } | undefined;
    if (row) {
      await pool
        .request()
        .input("id", sql.NVarChar(36), row.id)
        .input("contrasena", sql.NVarChar(255), hash)
        .input("rol", sql.NVarChar(20), Rol.ADMIN)
        .query(
          `UPDATE [Usuario] SET [contrasena] = @contrasena, [rol] = @rol, [updatedAt] = SYSUTCDATETIME() WHERE [id] = @id`
        );
    } else {
      await pool
        .request()
        .input("id", sql.NVarChar(36), nanoid())
        .input("nombre", sql.NVarChar(255), "Administrador")
        .input("correo", sql.NVarChar(255), adminEmail)
        .input("contrasena", sql.NVarChar(255), hash)
        .input("rol", sql.NVarChar(20), Rol.ADMIN)
        .query(`
          INSERT INTO [Usuario] ([id],[nombre],[correo],[contrasena],[rol])
          VALUES (@id, @nombre, @correo, @contrasena, @rol)
        `);
    }
  }

  await pool.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

