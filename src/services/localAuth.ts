import { ensureUser, localDb, type LocalUser } from "@/services/localDb";

const STORAGE_KEY = "local-auth-user";

type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT", user: LocalUser | null) => void;
const listeners: Set<AuthListener> = new Set();

const notify = (event: "SIGNED_IN" | "SIGNED_OUT", user: LocalUser | null) => {
  listeners.forEach((cb) => cb(event, user));
};

export function getCurrentUser(): LocalUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password?: string) {
  const user = await ensureUser(email, "admin");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notify("SIGNED_IN", user);
  return { user };
}

export async function signUp(email: string, password?: string, fullName?: string) {
  const user = await ensureUser(email, "admin");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notify("SIGNED_IN", user);
  return { user };
}

export async function signOut() {
  localStorage.removeItem(STORAGE_KEY);
  notify("SIGNED_OUT", null);
}

export function onAuthStateChange(callback: AuthListener) {
  listeners.add(callback);
  return {
    unsubscribe: () => listeners.delete(callback),
  };
}

export async function getSession() {
  const user = getCurrentUser();
  return { data: { session: user ? { user } : null } };
}

export async function getUserRole(userId?: string): Promise<"admin" | "user"> {
  if (!userId) return "admin";
  const user = await localDb.users.get(userId);
  return user?.role || "user";
}

