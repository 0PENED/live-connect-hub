import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SYSTEM_CODE = "LIVER";

export interface User {
  id: string;
  name: string;
  is_admin: boolean;
  avatar?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (id: string, code: string) => Promise<string | null>;
  logout: () => void;
  createUser: (id: string, name: string) => Promise<string | null>;
  deleteUser: (id: string) => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("livep_current");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Fetch all users from DB
  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at");
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  // Persist current user session locally
  useEffect(() => {
    localStorage.setItem("livep_current", JSON.stringify(currentUser));
  }, [currentUser]);

  // Refresh current user from DB when users change
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (fresh && (fresh.name !== currentUser.name || fresh.avatar !== currentUser.avatar || fresh.is_admin !== currentUser.is_admin)) {
        setCurrentUser(fresh);
      }
    }
  }, [users]);

  const login = async (id: string, code: string): Promise<string | null> => {
    if (code !== SYSTEM_CODE) return "Invalid code";
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    if (!data) return "Account not found";
    setCurrentUser(data);
    return null;
  };

  const logout = () => setCurrentUser(null);

  const createUser = async (id: string, name: string): Promise<string | null> => {
    if (!currentUser?.is_admin) return "Admin only";
    if (!id.trim() || !name.trim()) return "ID and Name required";
    const { error } = await supabase.from("users").insert({ id: id.trim(), name: name.trim(), is_admin: false });
    if (error) return error.message.includes("duplicate") ? "ID already exists" : error.message;
    await fetchUsers();
    return null;
  };

  const deleteUser = async (id: string) => {
    if (!currentUser?.is_admin) return;
    if (id === "123.com") return;
    await supabase.from("users").delete().eq("id", id);
    await fetchUsers();
  };

  const updateProfile = async (name: string, avatar?: string) => {
    if (!currentUser) return;
    const updates: Partial<User> = { name: name || currentUser.name };
    if (avatar !== undefined) updates.avatar = avatar || null;
    await supabase.from("users").update(updates).eq("id", currentUser.id);
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    await fetchUsers();
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, createUser, deleteUser, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
