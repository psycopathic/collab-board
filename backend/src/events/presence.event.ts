import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import {
  CursorMovePayload,
  DrawingStatusPayload,
  DrawingUpdatePayload,
  CursorUpdatePayload,
} from "../types/socket.js";
import { presenceService } from "../services/presence.service.js";

export const registerPresenceEvents = (socket: Socket) => {
  socket.on(SOCKET_EVENTS.CURSOR_MOVE, ({ boardId, x, y }: CursorMovePayload) => {
    const user = presenceService.getUser(socket.id);

    if (!user || user.boardId !== boardId) return;

    const payload: CursorUpdatePayload = {
      socketId: user.socketId,
      name: user.name,
      boardId,
      x,
      y,
    };

    socket.to(boardId).emit(SOCKET_EVENTS.CURSOR_UPDATE, payload);
  });

  const broadcastDrawingStatus = (
    boardId: string,
    isDrawing: boolean,
  ) => {
    const user = presenceService.getUser(socket.id);

    if (!user || user.boardId !== boardId) return;

    const payload: DrawingUpdatePayload = {
      socketId: user.socketId,
      name: user.name,
      boardId,
      isDrawing,
    };

    socket.to(boardId).emit(SOCKET_EVENTS.DRAWING_UPDATE, payload);
  };

  socket.on(SOCKET_EVENTS.DRAWING_START, ({ boardId }: DrawingStatusPayload) => {
    broadcastDrawingStatus(boardId, true);
  });

  socket.on(SOCKET_EVENTS.DRAWING_STOP, ({ boardId }: DrawingStatusPayload) => {
    broadcastDrawingStatus(boardId, false);
  });
};
