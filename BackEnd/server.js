import { initApp } from "./app.js";

const PORT = 4000;
const app = initApp();

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
});
