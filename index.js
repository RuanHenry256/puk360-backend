import express from 'express';
import cors from "cors";

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));

const app = express();

app.listen(5000, () => {
    console.log("server started at http://localhost:5000");
})