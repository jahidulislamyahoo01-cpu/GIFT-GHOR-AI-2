import express from 'express';
import { createServer } from 'vite';
const app = express();
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});
app.use(vite.middlewares);
app.listen(3002);
