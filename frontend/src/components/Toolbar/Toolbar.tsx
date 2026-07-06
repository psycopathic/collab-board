import "./Toolbar.css";

import type { ConnectionStatus, Tool } from "../../types/collaboration";

interface ToolbarProps {
  color: string;
  brushWidth: number;
  boardId: string;
  connectionStatus: ConnectionStatus;
  activeTool: Tool;
  showGrid: boolean;
  zoomPercent: number;
  isHost: boolean;
  onColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  onClear: () => void;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onEndRoom: () => void;
}

const TOOLS: Array<{ value: Tool; label: string }> = [
  { value: "pen", label: "Pen" },
  { value: "rectangle", label: "Rect" },
  { value: "circle", label: "Circle" },
  { value: "line", label: "Line" },
  { value: "arrow", label: "Arrow" },
  { value: "select", label: "Select" },
  { value: "hand", label: "Hand" },
];

const Toolbar = ({
  color,
  brushWidth,
  boardId,
  connectionStatus,
  activeTool,
  showGrid,
  zoomPercent,
  isHost,
  onColorChange,
  onBrushWidthChange,
  onClear,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleGrid,
  onEndRoom,
}: ToolbarProps) => {
  const statusClassName =
    connectionStatus === "connected"
      ? "toolbar__status toolbar__status--connected"
      : connectionStatus === "reconnecting"
        ? "toolbar__status toolbar__status--reconnecting"
        : "toolbar__status toolbar__status--disconnected";

  const statusLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "reconnecting"
        ? "Reconnecting..."
        : "Disconnected";

  return (
    <header className="toolbar">
      <div className="toolbar__section toolbar__section--tools">
        <div className="toolbar__toolset">
          {TOOLS.map((tool) => (
            <button
              key={tool.value}
              type="button"
              className={
                tool.value === activeTool
                  ? "toolbar__tool toolbar__tool--active"
                  : "toolbar__tool"
              }
              onClick={() => onToolChange(tool.value)}
            >
              {tool.label}
            </button>
          ))}
        </div>

        <label className="toolbar__field">
          <span className="toolbar__label">Color</span>
          <input
            className="toolbar__color"
            type="color"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
          />
        </label>

        <label className="toolbar__field toolbar__field--slider">
          <span className="toolbar__label">Brush</span>
          <input
            className="toolbar__slider"
            type="range"
            min="1"
            max="20"
            value={brushWidth}
            onChange={(event) => onBrushWidthChange(Number(event.target.value))}
          />
          <span className="toolbar__value">{brushWidth}px</span>
        </label>
      </div>

      <div className="toolbar__section toolbar__section--viewport">
        <div className="toolbar__zoom">
          <button className="toolbar__control" type="button" onClick={onZoomOut}>
            -
          </button>
          <span className="toolbar__zoom-value">{zoomPercent}%</span>
          <button className="toolbar__control" type="button" onClick={onZoomIn}>
            +
          </button>
        </div>

        <button className="toolbar__control" type="button" onClick={onResetView}>
          Reset View
        </button>
        <button
          className={showGrid ? "toolbar__control toolbar__control--active" : "toolbar__control"}
          type="button"
          onClick={onToggleGrid}
        >
          Grid
        </button>
        <button className="toolbar__clear" type="button" onClick={onClear}>
          Clear Board
        </button>
      </div>

      <div className="toolbar__section toolbar__section--meta">
        <div className="toolbar__field">
          <span className="toolbar__label">Room Code</span>
          <button
            type="button"
            className="toolbar__room-code"
            onClick={() => {
              navigator.clipboard?.writeText(boardId);
            }}
            title="Click to copy"
          >
            {boardId}
          </button>
        </div>

        <div className="toolbar__field">
          <span className="toolbar__label">Status</span>
          <strong className={statusClassName}>{statusLabel}</strong>
        </div>

        {isHost && (
          <button
            type="button"
            className="toolbar__end-room"
            onClick={() => {
              if (window.confirm("End the room for everyone?")) {
                onEndRoom();
              }
            }}
          >
            End Room
          </button>
        )}
      </div>
    </header>
  );
};

export default Toolbar;
