import "dotenv/config";

import { initApp } from "./app.js";

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = await initApp();

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
  });
}

startServer();
