import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { registerConnectionEvents } from "../events/connection.event.js";

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
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
