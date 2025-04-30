import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

const App = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [showPopup, setShowPopup] = useState(true);
  const [gridData, setGridData] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:5000/grid")
      .then((res) => {
        const gridMap = {};
        res.data.forEach((cell) => {
          gridMap[`${cell.row}-${cell.col}`] = {
            color: cell.color,
            name: cell.username,
          };
        });
        setGridData(gridMap);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    socket.on("addUser", ({ row, col, username, color }) => {
      const cellId = `${row}-${col}`;
      setGridData((prev) => ({
        ...prev,
        [cellId]: { color, name: username },
      }));
    });

    socket.on("deleteUser", ({ username }) => {
      setGridData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key].name === username) {
            delete updated[key];
          }
        });
        return updated;
      });
    });

    return () => {
      socket.off("addUser");
      socket.off("deleteUser");
    };
  }, []);

  const handleClick = (row, col) => {
    const cellId = `${row}-${col}`;
    if (gridData[cellId]) return;

    axios
      .post("http://localhost:5000/add", {
        row,
        col,
        username: name,
        color,
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Error claiming cell");
      });
  };

  const handleButton = () => {
    axios
      .post("http://localhost:5000/delete", { username: name })
      .catch(console.error);
  };

  const handlePopupSubmit = (e) => {
    e.preventDefault();
    if (!name || !color) return;
    setShowPopup(false);
  };

  const renderGrid=() => {
    const rows = [];
    for (let row = 0; row < 8; row++) {
      const cols = [];
      for (let col = 0; col < 8; col++) {
        const cellId = `${row}-${col}`;
        const cellData = gridData[cellId];
        cols.push(
          <div
            key={col}
            onClick={() => handleClick(row, col)}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: cellData ? cellData.color : "#eee",
              border: "1px solid #aaa",
              display: "inline-block",
              cursor: cellData ? "not-allowed" : "pointer",
            }}
            title={cellData ? `Claimed by ${cellData.name}` : ""}
          />
        );
      }
      rows.push(<div key={row}>{cols}</div>);
    }
    return rows;
  };

  return (
    <div style={{ padding: "20px" }}>
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <form
            onSubmit={handlePopupSubmit}
            style={{ background: "#fff", padding: 20, borderRadius: 8 }}
          >
            <h2>Enter your name and color</h2>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ marginBottom: 10 }}
            />
            <br />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
              style={{ marginBottom: 10 }}
            />
            <br />
            <button type="submit">Start</button>
          </form>
        </div>
      )}

      <h1>8×8 Grid Selector</h1>
      {renderGrid()}
      <br />
      <button onClick={handleButton} style={{ marginTop: 20 }}>
        Clear Grid
      </button>
    </div>
  );
};

export default App;
