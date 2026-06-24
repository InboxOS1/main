"use client";

import * as React from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth, googleSignInProvider } from "@/lib/firebase/client";

interface AuthContextValue {
  firebaseUser: User | null;
  loading: boolean;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [signingIn, setSigningIn] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = React.useCallback(async () => {
    setSigningIn(true);
    try {
      const credential = await signInWithPopup(firebaseAuth, googleSignInProvider);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Could not start your session. Please try again.");

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSigningIn(false);
    }
  }, [router]);

  const signOut = React.useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    await firebaseSignOut(firebaseAuth);
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ firebaseUser, loading, signingIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
