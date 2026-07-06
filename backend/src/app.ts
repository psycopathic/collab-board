import express from "express";
import cors from "cors";


const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Whiteboard API is running 🚀",
  });
});

export default app;