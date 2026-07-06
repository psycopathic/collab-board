import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import { presenceService } from "../services/presence.service.js";
import { registerRoomEvents } from "./room.event.js";
import { registerDrawEvents } from "./draw.event.js";
import { registerClearEvents } from "./clear.event.js";
import { registerPresenceEvents } from "./presence.event.js";
import { registerShapeEvents } from "./shape.event.js";

export const registerConnectionEvents = (socket: Socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  registerRoomEvents(socket);
  registerDrawEvents(socket);
  registerClearEvents(socket);
  registerPresenceEvents(socket);
  registerShapeEvents(socket);

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const removal = presenceService.removeSocket(socket.id);

    if (removal.user) {
      socket.nsp.to(removal.user.boardId).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        boardId: removal.user.boardId,
        users: removal.users,
      });

      socket.nsp.to(removal.user.boardId).emit(SOCKET_EVENTS.USER_PRESENCE_LEFT, removal.user);
      socket.nsp.to(removal.user.boardId).emit(SOCKET_EVENTS.USER_LEFT, {
        socketId: removal.user.socketId,
      });
      socket.nsp.to(removal.user.boardId).emit(SOCKET_EVENTS.DRAWING_UPDATE, {
        socketId: removal.user.socketId,
        name: removal.user.name,
        boardId: removal.user.boardId,
        isDrawing: false,
      });
    }

    console.log(`Disconnected: ${socket.id}`);
  });
};
