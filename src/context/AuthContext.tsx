"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      const isUserOwner = isOwner(authUser?.uid);
      setOwnerActive(isUserOwner);

      // Cleanup existing profile listener
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (authUser) {
        // Auto-repair owner profile if UID matches
        if (isUserOwner) {
          await repairOwnerProfile(authUser.uid).catch(console.error);
        }

        const docRef = doc(db, "users", authUser.uid);
        
        // Set up real-time listener for profile
        profileUnsub = onSnapshot(docRef, (docSnap) => {
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
            // Fallback for owner if document doesn't exist yet
            const ownerData = { uid: authUser.uid, role: "owner", membershipStatus: "owner", username: "Owner" };
            setProfile(ownerData);
            setPaidActive(true);
            setInternalActive(true);
          } else {
            setProfile(null);
            setPaidActive(false);
            setInternalActive(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setPaidActive(false);
        setInternalActive(false);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
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
