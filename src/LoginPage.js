import React, { useState } from "react";
import "./LoginPage.css";
import logo from "./logo.png";
import { connectSocket } from "./socket";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();   // ❗STOP page refresh
    try {
      const response = await fetch("https://sr-backend-api.takeleap.in/Master/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // ✔ required
          "Accept": "application/json",        // ✔ required
          "Origin": window.location.origin
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });
      const data = await response.json();
      console.log("API Response:", data);

      // SUCCESS LOGIC
      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(data.data));
        onLogin();   // 🔥 move to next page
        connectSocket();
      } else {
        alert(data.message || "Invalid credentials!");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="logo" className="login-logo" />
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
