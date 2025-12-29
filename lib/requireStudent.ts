"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRequireStudent() {
  const { user, role, loading, userData } = useAuth(); // We also get userData now!
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "student") {
        router.push("/");
      }
    }
  }, [user, role, loading, router]);

  return { user, userData, loading, isAuthorized: role === "student" };
}