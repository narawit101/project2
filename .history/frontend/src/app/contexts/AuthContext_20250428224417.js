// contexts/AuthContext.js
"use client";
import { createContext, useContext, useState, useEffect, use } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;


  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          console.log(data.user)
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user", error);
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
