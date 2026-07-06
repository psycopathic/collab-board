import { DrawSegment, DrawSegmentPayload } from "../types/drawing.js";

class BoardService {
    private boards = new Map<string, DrawSegment[]>();

    getBoard(boardId: string): DrawSegment[] {
        return this.boards.get(boardId) ?? [];
    }

    addSegment(boardId: string, segment: DrawSegment){
        const board = this.getBoard(boardId);
        board.push(segment);
        this.boards.set(boardId, board);
    }

    clearBoard(boardId: string) {
        this.boards.set(boardId, []);
    }
}

export const boardService = new BoardService();