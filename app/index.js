import { handler } from './build/handler.js';
import express from 'express';
import 'dotenv/config'

const app = express();

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
    res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(process.env.APP_PORT, () => {
    console.log(`🚀 listening on port ${process.env.APP_PORT}`);
});