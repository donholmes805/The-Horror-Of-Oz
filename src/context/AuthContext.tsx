"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isOwner, repairOwnerProfile, hasPaidAccess, isInternalUser } from "@/lib/auth-utils";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isOwner: boolean;
  hasPaidAccess: boolean;
  isInternal: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOwner: false,
  hasPaidAccess: false,
  isInternal: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerActive, setOwnerActive] = useState(false);
  const [paidActive, setPaidActive] = useState(false);
  const [internalActive, setInternalActive] = useState(false);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    // Safety timeout to ensure loading state is cleared eventually
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        const isUserOwner = isOwner(user?.uid);
        setOwnerActive(isUserOwner);

        if (user) {
          // Auto-repair owner profile if UID matches
          if (isUserOwner) {
            await repairOwnerProfile(user.uid);
          }

          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            let data = docSnap.data();
            // Force owner status in-memory for the specified UID
            if (isUserOwner) {
              data = { ...data, role: "owner", membershipStatus: "owner" };
            }
            setProfile(data);
            setPaidActive(hasPaidAccess(data));
            setInternalActive(isInternalUser(data));
          } else if (isUserOwner) {
            // Handle case where owner exists in Auth but not Firestore yet
            const ownerData = { uid: user.uid, role: "owner", membershipStatus: "owner", username: "Owner" };
            setProfile(ownerData);
            setPaidActive(true);
            setInternalActive(true);
          }
        } else {
          setProfile(null);
          setPaidActive(false);
          setInternalActive(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isOwner: ownerActive, 
      hasPaidAccess: paidActive, 
      isInternal: internalActive,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
