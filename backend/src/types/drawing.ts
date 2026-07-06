export interface DrawSegment {
    fromX: number;
    fromY: number;

    toX: number;
    toY: number;

    color: string;
    width: number;
}

export interface DrawSegmentPayload {
    boardId: string;
    segment: DrawSegment; // for the coordinates of cursor
}