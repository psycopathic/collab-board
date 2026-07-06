import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { registerConnectionEvents } from "../events/connection.event.js";

const allowedOrigins = [
  ...(process.env.CLIENT_URL?.split(",") ?? []),
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    registerConnectionEvents(socket);
  });

  return io;
};

export default initializeSocket;
