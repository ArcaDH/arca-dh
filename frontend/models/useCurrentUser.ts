import { useSyncExternalStore } from "react";
import { isAuthenticated } from "@/api/client";

export const currentUserKey = ["auth", "me"];

const emptySubscribe = () => () => {};

export function useCurrentUser() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );

  return {
    isLoggedIn: isMounted ? isAuthenticated() : false,
    isLoading: !isMounted,
  };
}
