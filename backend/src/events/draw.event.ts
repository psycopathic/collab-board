import { Socket } from "socket.io";
import { DrawSegmentPayload } from "../types/drawing.js";

export const registerDrawEvents = (socket: Socket) => {
    socket.on("board:draw", ({ boardId, segment }: DrawSegmentPayload) => {
    socket.to(boardId).emit("board:draw", segment);
  });
}