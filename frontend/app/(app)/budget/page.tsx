"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Keep /budget working for old links by redirecting to "/".
// A client-side redirect is used because the production
// build is a static export (output: "export"), where next.config redirects()
// are not supported.
export default function BudgetRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
