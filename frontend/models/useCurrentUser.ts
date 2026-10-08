import { useState, useEffect } from "react";
import { isAuthenticated } from "@/api/client";

export const currentUserKey = ["auth", "me"];

export function useCurrentUser() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    isLoggedIn: isMounted ? isAuthenticated() : false,
    isLoading: !isMounted,
  };
}
