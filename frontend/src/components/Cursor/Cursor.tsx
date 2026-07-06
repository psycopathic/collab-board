import "./Cursor.css";

interface CursorProps {
  x: number;
  y: number;
  name: string;
  isDrawing: boolean;
}

const Cursor = ({ x, y, name, isDrawing }: CursorProps) => {
  return (
    <div className="remote-cursor" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="remote-cursor__label">{name}</div>
      <div className="remote-cursor__icon">▲</div>
      {isDrawing ? <div className="remote-cursor__drawing">is drawing...</div> : null}
    </div>
  );
};

export default Cursor;
