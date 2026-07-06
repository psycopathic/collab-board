import { BoardShape, DrawSegment, StrokeShape } from "../types/drawing.js";

class BoardService {
  private boards = new Map<string, BoardShape[]>();

  getBoard(boardId: string): BoardShape[] {
    return this.boards.get(boardId) ?? [];
  }

  upsertShape(boardId: string, shape: BoardShape) {
    const shapes = this.getBoard(boardId);
    const index = shapes.findIndex((item) => item.id === shape.id);

    if (index >= 0) {
      shapes[index] = shape;
    } else {
      shapes.push(shape);
    }

    this.boards.set(boardId, shapes);
  }

  deleteShape(boardId: string, shapeId: string) {
    const shapes = this.getBoard(boardId).filter((shape) => shape.id !== shapeId);
    this.boards.set(boardId, shapes);
  }

  appendSegment(boardId: string, shapeId: string | undefined, segment: DrawSegment) {
    if (!shapeId) {
      return;
    }

    const shapes = this.getBoard(boardId);
    const shape = shapes.find((item) => item.id === shapeId);

    if (!shape || shape.type !== "pen") {
      const strokeShape: StrokeShape = {
        id: shapeId,
        type: "pen",
        strokeColor: segment.color,
        strokeWidth: segment.width,
        points: [
          { x: segment.fromX, y: segment.fromY },
          { x: segment.toX, y: segment.toY },
        ],
      };
      this.upsertShape(boardId, strokeShape);
      return;
    }

    const lastPoint = shape.points[shape.points.length - 1];

    if (!lastPoint || lastPoint.x !== segment.toX || lastPoint.y !== segment.toY) {
      shape.points.push({ x: segment.toX, y: segment.toY });
    }
  }

  clearBoard(boardId: string) {
    this.boards.set(boardId, []);
  }
}

export const boardService = new BoardService();
