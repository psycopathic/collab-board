import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import { boardService } from "../services/board.services.js";
import { DrawSegmentPayload } from "../types/drawing.js";

export const registerDrawEvents = (socket: Socket) => {
  socket.on(SOCKET_EVENTS.BOARD_DRAW, ({ boardId, shapeId, segment }: DrawSegmentPayload) => {
    boardService.appendSegment(boardId, shapeId, segment);
    socket.to(boardId).emit(SOCKET_EVENTS.BOARD_DRAW, segment);
  });
};
