import "dotenv/config";
import { createApp } from "./app.js";
import { getPool } from "./lib/pool.js";

const port = Number(process.env.PORT) || 4000;
const app = createApp();

getPool()
  .then(() => {
    app.listen(port, () => {
      console.log(`DOTTS API escuchando en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo conectar a SQL Server (DATABASE_URL):", err);
    process.exit(1);
  });
