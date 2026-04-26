"use client";

import { useUserStore } from "@/store/userStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import LoadingState from "@/components/ui/LoadingState";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUid, isLoading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !firebaseUid) {
      router.push(`/signup?from=${pathname}`);
    }
  }, [firebaseUid, isLoading, router, pathname]);

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!firebaseUid) {
    return null;
  }

  return <>{children}</>;
}
