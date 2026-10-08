import { useState, useEffect } from "react";
import { isAuthenticated } from "@/api/client";

export const currentUserKey = ["auth", "me"];

export function useCurrentUser() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setIsLoading(false);
  }, []);

  return {
    isLoggedIn: loggedIn,
    isLoading,
  };
}
