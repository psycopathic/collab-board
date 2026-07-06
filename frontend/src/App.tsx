import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./components/Home/Home";
import Whiteboard from "./components/Whiteboard/Whiteboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:roomId" element={<Whiteboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;