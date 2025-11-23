import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChange, getSession, signIn } from "@/services/localAuth";
import type { LocalUser } from "@/services/localDb";

export const useAuth = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<{ user: LocalUser } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const subscription = onAuthStateChange((event, sessionUser) => {
      setSession(sessionUser ? { user: sessionUser } : null);
      setUser(sessionUser ?? null);
      if (event === "SIGNED_IN") {
        setTimeout(() => navigate("/"), 50);
      } else if (event === "SIGNED_OUT") {
        setTimeout(() => navigate("/auth"), 50);
      }
    });

    getSession().then(async ({ data: { session } }) => {
      if (!session) {
        const { user: defaultUser } = await signIn("offline@local");
        setSession(defaultUser ? { user: defaultUser } : null);
        setUser(defaultUser ?? null);
      } else {
        setSession(session as any);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, session, loading };
};
