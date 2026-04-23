"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";

// Small helper – js-cookie is tiny; alternatively use document.cookie manually
// We rely on it to sync the auth cookie for middleware to read
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setFirebaseUid, setLoading, clearUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);

        // Set cookie so middleware can guard routes
        const idToken = await firebaseUser.getIdToken();
        document.cookie = `bc-auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        // Fetch Firestore profile
        const profile = await getUser(firebaseUser.uid);
        if (profile) {
          setUser(profile);
          // Propagate admin flag to cookie
          if (profile.isAdmin) {
            document.cookie = `bc-admin=true; path=/; max-age=3600; SameSite=Lax`;
          }
        } else {
          // Profile not yet created → still set uid so signup can proceed
          setLoading(false);
        }
      } else {
        // Clear cookies
        document.cookie =
          "bc-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "bc-admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        clearUser();
      }
    });

    return () => unsubscribe();
  }, [clearUser, setFirebaseUid, setLoading, setUser]);

  return <>{children}</>;
}
