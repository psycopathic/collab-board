import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import { boardService } from "../services/board.services.js";
import { ShapeDeletePayload, ShapePayload } from "../types/drawing.js";

export const registerShapeEvents = (socket: Socket) => {
  socket.on(SOCKET_EVENTS.SHAPE_CREATE, ({ boardId, shape }: ShapePayload) => {
    boardService.upsertShape(boardId, shape);
    socket.to(boardId).emit(SOCKET_EVENTS.SHAPE_CREATE, shape);
  });

  socket.on(SOCKET_EVENTS.SHAPE_UPDATE, ({ boardId, shape }: ShapePayload) => {
    boardService.upsertShape(boardId, shape);
    socket.to(boardId).emit(SOCKET_EVENTS.SHAPE_UPDATE, shape);
  });

  socket.on(SOCKET_EVENTS.SHAPE_DELETE, ({ boardId, shapeId }: ShapeDeletePayload) => {
    boardService.deleteShape(boardId, shapeId);
    socket.to(boardId).emit(SOCKET_EVENTS.SHAPE_DELETE, { shapeId });
  });
};
