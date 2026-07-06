export type Tool =
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "select"
  | "hand";

export type DrawableTool = Exclude<Tool, "select" | "hand">;

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface ShapeBase {
  id: string;
  type: DrawableTool;
  strokeColor: string;
  strokeWidth: number;
}

export interface StrokeShape extends ShapeBase {
  type: "pen";
  points: Point[];
}

export interface RectangleShape extends ShapeBase {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends ShapeBase {
  type: "circle";
  cx: number;
  cy: number;
  radius: number;
}

export interface LineShape extends ShapeBase {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArrowShape extends ShapeBase {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type CanvasShape =
  | StrokeShape
  | RectangleShape
  | CircleShape
  | LineShape
  | ArrowShape;

export interface ShapePayload {
  boardId: string;
  shape: CanvasShape;
}

export interface ShapeDeletePayload {
  boardId: string;
  shapeId: string;
}

export interface BoardJoinedPayload {
  boardId: string;
  shapes?: CanvasShape[];
}

export interface PresenceUser {
  socketId: string;
  name: string;
  boardId: string;
}

export interface PresenceUpdatePayload {
  boardId: string;
  users: PresenceUser[];
}

export interface CursorUpdatePayload extends PresenceUser {
  x: number;
  y: number;
}

export interface DrawingUpdatePayload extends PresenceUser {
  isDrawing: boolean;
}

export interface UserNotification {
  id: string;
  message: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
