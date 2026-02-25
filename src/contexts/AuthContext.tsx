import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { getStorage, setStorage } from "@/lib/storage";

const ADMIN_USER: User = { id: "123.com", name: "Admin", isAdmin: true };
const SYSTEM_CODE = "LIVER";

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (id: string, code: string) => string | null;
  logout: () => void;
  createUser: (id: string, name: string) => string | null;
  deleteUser: (id: string) => void;
  updateProfile: (name: string, avatar?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const stored = getStorage<User[]>("livep_users", []);
    if (!stored.find((u) => u.id === ADMIN_USER.id)) {
      const init = [ADMIN_USER, ...stored];
      setStorage("livep_users", init);
      return init;
    }
    return stored;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStorage<User | null>("livep_current", null)
  );

  useEffect(() => setStorage("livep_users", users), [users]);
  useEffect(() => setStorage("livep_current", currentUser), [currentUser]);

  const login = (id: string, code: string): string | null => {
    if (code !== SYSTEM_CODE) return "Invalid code";
    const user = users.find((u) => u.id === id);
    if (!user) return "Account not found";
    setCurrentUser(user);
    return null;
  };

  const logout = () => setCurrentUser(null);

  const createUser = (id: string, name: string): string | null => {
    if (!currentUser?.isAdmin) return "Admin only";
    if (users.find((u) => u.id === id)) return "ID already exists";
    if (!id.trim() || !name.trim()) return "ID and Name required";
    const newUser: User = { id: id.trim(), name: name.trim(), isAdmin: false };
    setUsers((prev) => [...prev, newUser]);
    return null;
  };

  const deleteUser = (id: string) => {
    if (!currentUser?.isAdmin) return;
    if (id === ADMIN_USER.id) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateProfile = (name: string, avatar?: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, name: name || currentUser.name, avatar };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, createUser, deleteUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
