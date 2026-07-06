import express from "express";
import cors from "cors";

const allowedOrigins = [
  ...(process.env.CLIENT_URL?.split(",") ?? []),
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

const app = express();
app.use(cors({
    origin: allowedOrigins,
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
