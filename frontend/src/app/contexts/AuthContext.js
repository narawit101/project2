// contexts/AuthContext.js
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchUser = useCallback(async () => {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    const token = isMobile ? localStorage.getItem("auth_mobile_token") : null;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // console.log("Role:", data.role);
      } else {
        // setUser(null);
        return;
      }
    } catch (error) {
      console.error("Error fetching user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("updated_status", (data) => {
      console.log("updated_status:", data);
      if (user && user.user_id === data.userId) {
        fetchUser();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => socket.disconnect();
  }, [API_URL, user, fetchUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
