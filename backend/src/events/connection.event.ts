import { Socket } from "socket.io";
import { registerRoomEvents } from "./room.event.js";
import { registerDrawEvents } from "./draw.event.js";
import { registerClearEvents } from "./clear.event.js";
export const registerConnectionEvents = (socket: Socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    registerRoomEvents(socket);
    registerDrawEvents(socket);
    registerClearEvents(socket);

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
};