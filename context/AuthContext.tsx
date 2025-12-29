"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; 
import { useRouter } from "next/navigation";

// Define the roles based on your folders
type UserRole = "admin" | "student" | "job_seeker" | "mentor" | null;

type AuthContextType = {
  user: User | null;
  role: UserRole;
  userData: any | null; // Stores the actual profile data (name, course, etc.)
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        setUser(currentUser);
        
        // 🔍 CHECK 1: Is it an Admin?
        const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
        if (adminSnap.exists()) {
          setRole("admin");
          setUserData(adminSnap.data());
          setLoading(false);
          return;
        }

        // 🔍 CHECK 2: Is it a Growth Student?
        const studentSnap = await getDoc(doc(db, "growth_students", currentUser.uid));
        if (studentSnap.exists()) {
          setRole("student");
          setUserData(studentSnap.data());
          setLoading(false);
          return;
        }

        // 🔍 CHECK 3: Is it a Job Seeker?
        const jobSeekerSnap = await getDoc(doc(db, "job_seekers", currentUser.uid));
        if (jobSeekerSnap.exists()) {
          setRole("job_seeker");
          setUserData(jobSeekerSnap.data());
          setLoading(false);
          return;
        }

         // 🔍 CHECK 4: Is it a Mentor?
         const mentorSnap = await getDoc(doc(db, "mentors", currentUser.uid));
         if (mentorSnap.exists()) {
           setRole("mentor");
           setUserData(mentorSnap.data());
           setLoading(false);
           return;
         }

        // If no document found in any collection
        console.warn("User authenticated but record not found in DB collections.");
        setRole(null);
        setUserData(null);
      } else {
        setUser(null);
        setRole(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setRole(null);
    setUserData(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}