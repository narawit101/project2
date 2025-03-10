"use client";
import React, { useEffect, useState } from "react";

export default function UserList() {

  const [users, setUsers] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map((user, user_id) => (
          <li key={user_id}>
            {user.user_id}-{user.user_name}-{user.first_name} {user.last_name} -{" "}
            {user.email}-{user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
