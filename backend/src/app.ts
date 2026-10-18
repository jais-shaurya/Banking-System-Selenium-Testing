import express from 'express';
import apiRoutes from './routes/api.routes.js';

import {verifyApiKey} from './middleware/apiKey.js';
import {verifyJWT} from './middleware/auth.js';

import { db } from './prisma/db.js';

import dotenv from "dotenv";
dotenv.config()

const app = express();

app.use(express.json());

app.use(verifyApiKey);
app.use('/api/v1', apiRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/protected', verifyJWT, (req, res) => {
    res.status(200).json({ message: "protected route is healthy", userId: req.userId });
});


app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV === "dev"){
    app.listen(3000, () => console.log("Server is live at http://localhost:3000"))
}


export default app;