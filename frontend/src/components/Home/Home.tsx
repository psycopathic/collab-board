import "./Home.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import socket from "../../services/socket";

interface RoomCreateAck {
  roomId: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    setError(null);
    socket.connect();
    socket.emit("room:create", (response: RoomCreateAck) => {
      navigate(`/r/${response.roomId}`);
    });
  };

  const handleJoinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = joinCode.trim();

    if (!trimmed) {
      setError("Enter a room code first.");
      return;
    }

    navigate(`/r/${trimmed}`);
  };

  return (
    <main className="home">
      <div className="home__card">
        <h1 className="home__title">Collab Board</h1>
        <p className="home__subtitle">Draw together in real time.</p>

        <button type="button" className="home__cta" onClick={handleCreateRoom}>
          Create a New Room
        </button>

        <form className="home__join" onSubmit={handleJoinRoom}>
          <input
            type="text"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Enter room code"
            className="home__input"
          />
          <button type="submit" className="home__join-button" disabled={!joinCode.trim()}>
            Join
          </button>
        </form>

        {error && <p className="home__error">{error}</p>}
      </div>
    </main>
  );
};

export default Home;