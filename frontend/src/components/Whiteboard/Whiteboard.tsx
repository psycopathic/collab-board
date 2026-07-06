import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import Cursor from "../Cursor/Cursor";
import Notification from "../Notification/Notification";
import Presence from "../Presence/Presence";
import Toolbar from "../Toolbar/Toolbar";
import { useSocket } from "../../hooks/useSocket";
import { usePresence } from "../../hooks/usePresence";
import type {
  BoardJoinedPayload,
  CanvasShape,
  CursorUpdatePayload,
  DrawableTool,
  Point,
  RoomEndedPayload,
  Tool,
  Viewport,
} from "../../types/collaboration";
import {
  clamp,
  createShapeFromDrag,
  hitTestShape,
  renderScene,
  screenToWorld,
  worldToScreen,
} from "../../utils/whiteboard";

const DEFAULT_COLOR = "#000000";
const DEFAULT_BRUSH_WIDTH = 4;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

const createShapeId = () => crypto.randomUUID();

const isDrawableTool = (tool: Tool): tool is DrawableTool =>
  tool !== "select" && tool !== "hand";

const Whiteboard = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const boardId = roomId ?? "";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const viewportRef = useRef<Viewport>({ offsetX: 0, offsetY: 0, scale: 1 });
  const shapesRef = useRef<CanvasShape[]>([]);
  const draftShapeRef = useRef<CanvasShape | null>(null);
  const drawStartRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(
    null,
  );

  const { socket, status, isHost, hostSocketId } = useSocket(boardId);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushWidth, setBrushWidth] = useState(DEFAULT_BRUSH_WIDTH);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [showGrid, setShowGrid] = useState(true);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [viewportVersion, setViewportVersion] = useState(0);

  const {
    users,
    cursors,
    drawingUsers,
    notifications,
    emitCursorMove,
    emitDrawingStart,
    emitDrawingStop,
  } = usePresence({
    socket,
    boardId,
  });

  const isUserDrawing = (socketId: string) =>
    drawingUsers.some((user) => user.socketId === socketId);

  const getCanvasPoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!canvas || !context) return;

    renderScene({
      canvas,
      context,
      viewport: viewportRef.current,
      shapes: shapesRef.current,
      draftShape: draftShapeRef.current,
      selectedShapeId,
      showGrid,
    });
  };

  const syncZoomPercent = () => {
    setZoomPercent(Math.round(viewportRef.current.scale * 100));
  };

  const getDefaultViewport = (): Viewport => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { offsetX: 0, offsetY: 0, scale: 1 };
    }

    return {
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2,
      scale: 1,
    };
  };

  const applyViewport = (nextViewport: Viewport) => {
    viewportRef.current = nextViewport;
    syncZoomPercent();
    setViewportVersion((current) => current + 1);
    renderCanvas();
  };

  const upsertShape = (shape: CanvasShape) => {
    const nextShapes = [...shapesRef.current];
    const index = nextShapes.findIndex((item) => item.id === shape.id);

    if (index >= 0) {
      nextShapes[index] = shape;
    } else {
      nextShapes.push(shape);
    }

    shapesRef.current = nextShapes;
  };

  const removeShape = (shapeId: string) => {
    shapesRef.current = shapesRef.current.filter((shape) => shape.id !== shapeId);
  };

  const clearBoardLocally = () => {
    shapesRef.current = [];
    draftShapeRef.current = null;
    setSelectedShapeId(null);
    renderCanvas();
  };

  const zoomAtPoint = (screenPoint: Point, factor: number) => {
    const previousViewport = viewportRef.current;
    const nextScale = clamp(previousViewport.scale * factor, MIN_SCALE, MAX_SCALE);

    if (nextScale === previousViewport.scale) {
      return;
    }

    const worldPoint = screenToWorld(screenPoint, previousViewport);

    applyViewport({
      scale: nextScale,
      offsetX: screenPoint.x - worldPoint.x * nextScale,
      offsetY: screenPoint.y - worldPoint.y * nextScale,
    });
  };

  const commitDraftShape = () => {
    const draftShape = draftShapeRef.current;

    if (!draftShape) return;

    upsertShape(draftShape);
    draftShapeRef.current = null;
    renderCanvas();
  };

  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      const toolbarHeight =
        document.querySelector(".toolbar")?.getBoundingClientRect().height ?? 140;

      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - toolbarHeight;

      const context = canvas.getContext("2d");

      if (!context) return;

      contextRef.current = context;

      if (
        viewportRef.current.scale === 1 &&
        viewportRef.current.offsetX === 0 &&
        viewportRef.current.offsetY === 0
      ) {
        viewportRef.current = getDefaultViewport();
        syncZoomPercent();
        setViewportVersion((current) => current + 1);
      }

      renderCanvas();
    };

    initializeCanvas();
    window.addEventListener("resize", initializeCanvas);

    return () => {
      window.removeEventListener("resize", initializeCanvas);
    };
  }, [selectedShapeId, showGrid]);

  useEffect(() => {
    renderCanvas();
  }, [selectedShapeId, showGrid]);

  useEffect(() => {
    const handleBoardJoined = ({ shapes = [] }: BoardJoinedPayload) => {
      shapesRef.current = shapes;
      draftShapeRef.current = null;
      renderCanvas();
    };

    const handleShapeCreate = (shape: CanvasShape) => {
      upsertShape(shape);
      renderCanvas();
    };

    const handleShapeUpdate = (shape: CanvasShape) => {
      upsertShape(shape);
      renderCanvas();
    };

    const handleShapeDelete = ({ shapeId }: { shapeId: string }) => {
      removeShape(shapeId);
      if (selectedShapeId === shapeId) {
        setSelectedShapeId(null);
      }
      renderCanvas();
    };

    const handleClear = () => {
      clearBoardLocally();
    };

    socket.on("board:joined", handleBoardJoined);
    socket.on("shape:create", handleShapeCreate);
    socket.on("shape:update", handleShapeUpdate);
    socket.on("shape:delete", handleShapeDelete);
    socket.on("board:clear", handleClear);

    return () => {
      socket.off("board:joined", handleBoardJoined);
      socket.off("shape:create", handleShapeCreate);
      socket.off("shape:update", handleShapeUpdate);
      socket.off("shape:delete", handleShapeDelete);
      socket.off("board:clear", handleClear);
    };
  }, [selectedShapeId, socket]);

  useEffect(() => {
    if (!boardId) return;

    const handleRoomEnded = (payload: RoomEndedPayload) => {
      if (payload.boardId !== boardId) return;
      console.log("Room ended by host");
      navigate("/");
    };

    socket.on("room:ended", handleRoomEnded);

    return () => {
      socket.off("room:ended", handleRoomEnded);
    };
  }, [socket, boardId, navigate]);

  const handleEndRoom = () => {
    if (!boardId || !isHost) return;
    socket.emit("room:end", { boardId });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedShapeId || (event.key !== "Backspace" && event.key !== "Delete")) {
        return;
      }

      event.preventDefault();
      removeShape(selectedShapeId);
      socket.emit("shape:delete", {
        boardId: boardId,
        shapeId: selectedShapeId,
      });
      setSelectedShapeId(null);
      renderCanvas();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedShapeId, socket, boardId]);

  const startPanning = (point: Point) => {
    isPanningRef.current = true;
    panStartRef.current = {
      x: point.x,
      y: point.y,
      offsetX: viewportRef.current.offsetX,
      offsetY: viewportRef.current.offsetY,
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPoint = getCanvasPoint(event.clientX, event.clientY);

    if (!screenPoint) return;

    const worldPoint = screenToWorld(screenPoint, viewportRef.current);
    emitCursorMove(worldPoint.x, worldPoint.y);

    if (event.button === 1 || (activeTool === "hand" && event.button === 0)) {
      event.preventDefault();
      startPanning(screenPoint);
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (activeTool === "select") {
      const selectedShape = [...shapesRef.current]
        .reverse()
        .find((shape) => hitTestShape(shape, worldPoint, viewportRef.current.scale));
      setSelectedShapeId(selectedShape?.id ?? null);
      renderCanvas();
      return;
    }

    if (!isDrawableTool(activeTool)) {
      return;
    }

    isDrawingRef.current = true;
    drawStartRef.current = worldPoint;
    emitDrawingStart();

    if (activeTool === "pen") {
      const shape: CanvasShape = {
        id: createShapeId(),
        type: "pen",
        strokeColor: color,
        strokeWidth: brushWidth,
        points: [worldPoint],
      };

      draftShapeRef.current = shape;
      socket.emit("shape:create", {
        boardId: boardId,
        shape,
      });
      renderCanvas();
      return;
    }

    draftShapeRef.current = createShapeFromDrag(
      activeTool,
      worldPoint,
      worldPoint,
      color,
      brushWidth,
      createShapeId(),
    );
    renderCanvas();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPoint = getCanvasPoint(event.clientX, event.clientY);

    if (!screenPoint) return;

    const worldPoint = screenToWorld(screenPoint, viewportRef.current);
    emitCursorMove(worldPoint.x, worldPoint.y);

    if (isPanningRef.current && panStartRef.current) {
      applyViewport({
        ...viewportRef.current,
        offsetX: panStartRef.current.offsetX + (screenPoint.x - panStartRef.current.x),
        offsetY: panStartRef.current.offsetY + (screenPoint.y - panStartRef.current.y),
      });
      return;
    }

    if (!isDrawingRef.current || !drawStartRef.current || !draftShapeRef.current) {
      return;
    }

    if (draftShapeRef.current.type === "pen") {
      const nextShape: CanvasShape = {
        ...draftShapeRef.current,
        points: [...draftShapeRef.current.points, worldPoint],
      };

      draftShapeRef.current = nextShape;
      socket.emit("shape:update", {
        boardId: boardId,
        shape: nextShape,
      });
      renderCanvas();
      return;
    }

    draftShapeRef.current = createShapeFromDrag(
      draftShapeRef.current.type,
      drawStartRef.current,
      worldPoint,
      color,
      brushWidth,
      draftShapeRef.current.id,
    );
    renderCanvas();
  };

  const stopInteraction = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
    }

    if (!isDrawingRef.current) {
      return;
    }

    emitDrawingStop();
    isDrawingRef.current = false;
    drawStartRef.current = null;

    const draftShape = draftShapeRef.current;

    if (!draftShape) {
      return;
    }

    commitDraftShape();

    if (draftShape.type !== "pen") {
      socket.emit("shape:create", {
        boardId: boardId,
        shape: draftShape,
      });
      setSelectedShapeId(draftShape.id);
    } else {
      socket.emit("shape:update", {
        boardId: boardId,
        shape: draftShape,
      });
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const screenPoint = getCanvasPoint(event.clientX, event.clientY);

    if (!screenPoint) return;

    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    zoomAtPoint(screenPoint, zoomFactor);
  };

  const handleClearBoard = () => {
    clearBoardLocally();
    socket.emit("board:clear", {
      boardId: boardId,
    });
  };

  const handleZoomIn = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    zoomAtPoint({ x: canvas.width / 2, y: canvas.height / 2 }, 1.15);
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    zoomAtPoint({ x: canvas.width / 2, y: canvas.height / 2 }, 1 / 1.15);
  };

  const handleResetView = () => {
    applyViewport(getDefaultViewport());
  };

  const remoteCursors = useMemo(() => {
    const canvasTop = canvasRef.current?.getBoundingClientRect().top ?? 0;

    return cursors.map((cursor: CursorUpdatePayload) => {
      const screenPoint = worldToScreen({ x: cursor.x, y: cursor.y }, viewportRef.current);

      return {
        ...cursor,
        x: screenPoint.x,
        y: screenPoint.y + canvasTop,
      };
    });
  }, [cursors, viewportVersion]);

  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="whiteboard-page">
      <Toolbar
        color={color}
        brushWidth={brushWidth}
        boardId={boardId}
        connectionStatus={status}
        activeTool={activeTool}
        showGrid={showGrid}
        zoomPercent={zoomPercent}
        isHost={isHost}
        onColorChange={setColor}
        onBrushWidthChange={setBrushWidth}
        onClear={handleClearBoard}
        onToolChange={setActiveTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onToggleGrid={() => setShowGrid((current) => !current)}
        onEndRoom={handleEndRoom}
      />
      <Presence users={users} boardId={boardId} hostSocketId={hostSocketId} />
      <div className="whiteboard-cursors">
        {remoteCursors.map((cursor) => (
          <Cursor
            key={cursor.socketId}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            isDrawing={isUserDrawing(cursor.socketId)}
          />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopInteraction}
        onMouseLeave={stopInteraction}
        onWheel={handleWheel}
        onContextMenu={(event) => event.preventDefault()}
        className="whiteboard-canvas"
        style={{
          cursor:
            activeTool === "hand"
              ? isPanningRef.current
                ? "grabbing"
                : "grab"
              : activeTool === "select"
                ? "default"
                : "crosshair",
        }}
      />
      <Notification notifications={notifications} />
    </div>
  );
};

export default Whiteboard;
