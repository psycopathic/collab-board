import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import initializeSocket from "./utils/socket.js";

dotenv.config();

const httpServer = http.createServer(app);
initializeSocket(httpServer);

httpServer.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

