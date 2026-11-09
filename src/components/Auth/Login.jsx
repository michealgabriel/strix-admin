import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import styles from "./Login.module.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the backend returns a 400 or 401, display the error message
        throw new Error(data.message || "Invalid credentials. Please try again.");
      }

      // If successful, data should contain the token. 
      // We explicitly extract the new data fields from your backend.
      dispatch(
        loginSuccess({
          token: data.admin_access_token,
          adminData: {
            email: data.admin.email,
            roleId: data.admin.role_id, 
            name: data.admin.name, 
            isBase: data.admin.is_base, // Capture the god-mode flag
          },
        })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          STRIX <span className={styles.logoSpan}>Admin</span>
        </div>
        <div className={styles.subtitle}>Enter your credentials to access the panel</div>
        
        {error && <div style={{ color: "#ef4444", fontSize: "14px", marginBottom: "1rem", textAlign: "center", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px" }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@strix.com"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className={styles.loginBtn} disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
