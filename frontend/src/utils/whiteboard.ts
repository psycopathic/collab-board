import type {
  ArrowShape,
  CanvasShape,
  DrawableTool,
  Point,
  Viewport,
} from "../types/collaboration";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface RenderSceneOptions {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  viewport: Viewport;
  shapes: CanvasShape[];
  draftShape: CanvasShape | null;
  selectedShapeId: string | null;
  showGrid: boolean;
}

const GRID_BASE_SIZE = 80;
const MIN_GRID_SPACING = 24;
const MAX_GRID_SPACING = 120;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const screenToWorld = (point: Point, viewport: Viewport): Point => ({
  x: (point.x - viewport.offsetX) / viewport.scale,
  y: (point.y - viewport.offsetY) / viewport.scale,
});

export const worldToScreen = (point: Point, viewport: Viewport): Point => ({
  x: point.x * viewport.scale + viewport.offsetX,
  y: point.y * viewport.scale + viewport.offsetY,
});

export const createShapeFromDrag = (
  tool: Exclude<DrawableTool, "pen">,
  start: Point,
  current: Point,
  strokeColor: string,
  strokeWidth: number,
  id: string,
): CanvasShape => {
  if (tool === "rectangle") {
    return {
      id,
      type: "rectangle",
      strokeColor,
      strokeWidth,
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  }

  if (tool === "circle") {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    return {
      id,
      type: "circle",
      strokeColor,
      strokeWidth,
      cx: start.x,
      cy: start.y,
      radius,
    };
  }

  if (tool === "line") {
    return {
      id,
      type: "line",
      strokeColor,
      strokeWidth,
      x1: start.x,
      y1: start.y,
      x2: current.x,
      y2: current.y,
    };
  }

  return {
    id,
    type: "arrow",
    strokeColor,
    strokeWidth,
    x1: start.x,
    y1: start.y,
    x2: current.x,
    y2: current.y,
  };
};

export const getShapeBounds = (shape: CanvasShape): Bounds => {
  switch (shape.type) {
    case "pen": {
      const xs = shape.points.map((point) => point.x);
      const ys = shape.points.map((point) => point.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }
    case "rectangle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
    case "circle":
      return {
        minX: shape.cx - shape.radius,
        minY: shape.cy - shape.radius,
        maxX: shape.cx + shape.radius,
        maxY: shape.cy + shape.radius,
      };
    case "line":
    case "arrow":
      return {
        minX: Math.min(shape.x1, shape.x2),
        minY: Math.min(shape.y1, shape.y2),
        maxX: Math.max(shape.x1, shape.x2),
        maxY: Math.max(shape.y1, shape.y2),
      };
  }
};

const pointToSegmentDistance = (point: Point, start: Point, end: Point) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  const projection = {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
};

export const hitTestShape = (shape: CanvasShape, point: Point, scale: number) => {
  const tolerance = 10 / scale + shape.strokeWidth;

  switch (shape.type) {
    case "pen":
      for (let index = 1; index < shape.points.length; index += 1) {
        if (
          pointToSegmentDistance(point, shape.points[index - 1], shape.points[index]) <= tolerance
        ) {
          return true;
        }
      }
      return false;
    case "rectangle":
      return (
        point.x >= shape.x - tolerance &&
        point.x <= shape.x + shape.width + tolerance &&
        point.y >= shape.y - tolerance &&
        point.y <= shape.y + shape.height + tolerance
      );
    case "circle": {
      const distance = Math.hypot(point.x - shape.cx, point.y - shape.cy);
      return distance <= shape.radius + tolerance;
    }
    case "line":
    case "arrow":
      return (
        pointToSegmentDistance(point, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }) <=
        tolerance
      );
  }
};

const drawArrowHead = (
  context: CanvasRenderingContext2D,
  shape: ArrowShape,
) => {
  const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
  const size = Math.max(10, shape.strokeWidth * 2.5);

  context.beginPath();
  context.moveTo(shape.x2, shape.y2);
  context.lineTo(
    shape.x2 - size * Math.cos(angle - Math.PI / 6),
    shape.y2 - size * Math.sin(angle - Math.PI / 6),
  );
  context.moveTo(shape.x2, shape.y2);
  context.lineTo(
    shape.x2 - size * Math.cos(angle + Math.PI / 6),
    shape.y2 - size * Math.sin(angle + Math.PI / 6),
  );
  context.stroke();
};

const drawShape = (context: CanvasRenderingContext2D, shape: CanvasShape) => {
  context.save();
  context.strokeStyle = shape.strokeColor;
  context.lineWidth = shape.strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";

  switch (shape.type) {
    case "pen": {
      if (shape.points.length === 1) {
        context.fillStyle = shape.strokeColor;
        context.beginPath();
        context.arc(shape.points[0].x, shape.points[0].y, shape.strokeWidth / 2, 0, Math.PI * 2);
        context.fill();
        break;
      }

      context.beginPath();
      context.moveTo(shape.points[0].x, shape.points[0].y);
      shape.points.slice(1).forEach((point) => {
        context.lineTo(point.x, point.y);
      });
      context.stroke();
      break;
    }
    case "rectangle":
      context.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;
    case "circle":
      context.beginPath();
      context.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
      context.stroke();
      break;
    case "line":
      context.beginPath();
      context.moveTo(shape.x1, shape.y1);
      context.lineTo(shape.x2, shape.y2);
      context.stroke();
      break;
    case "arrow":
      context.beginPath();
      context.moveTo(shape.x1, shape.y1);
      context.lineTo(shape.x2, shape.y2);
      context.stroke();
      drawArrowHead(context, shape);
      break;
  }

  context.restore();
};

const drawGrid = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  viewport: Viewport,
) => {
  let spacing = GRID_BASE_SIZE * viewport.scale;

  while (spacing < MIN_GRID_SPACING) spacing *= 2;
  while (spacing > MAX_GRID_SPACING) spacing /= 2;

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(148, 163, 184, 0.22)";
  context.lineWidth = 1;
  context.beginPath();

  const startX = ((viewport.offsetX % spacing) + spacing) % spacing;
  const startY = ((viewport.offsetY % spacing) + spacing) % spacing;

  for (let x = startX; x <= canvas.width; x += spacing) {
    context.moveTo(Math.round(x) + 0.5, 0);
    context.lineTo(Math.round(x) + 0.5, canvas.height);
  }

  for (let y = startY; y <= canvas.height; y += spacing) {
    context.moveTo(0, Math.round(y) + 0.5);
    context.lineTo(canvas.width, Math.round(y) + 0.5);
  }

  context.stroke();
  context.restore();
};

const drawSelection = (
  context: CanvasRenderingContext2D,
  shape: CanvasShape,
  viewport: Viewport,
) => {
  const bounds = getShapeBounds(shape);
  const topLeft = worldToScreen({ x: bounds.minX, y: bounds.minY }, viewport);
  const bottomRight = worldToScreen({ x: bounds.maxX, y: bounds.maxY }, viewport);
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  const handles = [
    topLeft,
    { x: bottomRight.x, y: topLeft.y },
    { x: topLeft.x, y: bottomRight.y },
    bottomRight,
  ];

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.strokeStyle = "#2563eb";
  context.lineWidth = 1.5;
  context.setLineDash([6, 4]);
  context.strokeRect(topLeft.x - 6, topLeft.y - 6, width + 12, height + 12);
  context.setLineDash([]);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#2563eb";

  handles.forEach((handle) => {
    context.fillRect(handle.x - 4, handle.y - 4, 8, 8);
    context.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
  });
  context.restore();
};

export const renderScene = ({
  canvas,
  context,
  viewport,
  shapes,
  draftShape,
  selectedShapeId,
  showGrid,
}: RenderSceneOptions) => {
  if (showGrid) {
    drawGrid(context, canvas, viewport);
  } else {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  context.save();
  context.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY);
  shapes.forEach((shape) => drawShape(context, shape));
  if (draftShape) {
    drawShape(context, draftShape);
  }
  context.restore();

  if (selectedShapeId) {
    const selectedShape = shapes.find((shape) => shape.id === selectedShapeId);

    if (selectedShape) {
      drawSelection(context, selectedShape, viewport);
    }
  }
};
