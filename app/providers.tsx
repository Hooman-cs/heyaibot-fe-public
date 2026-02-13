// app/providers.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";  // ✅ Import ReactNode

export default function Providers({ 
  children 
}: { 
  children: ReactNode  
}) {
  return <SessionProvider>{children}</SessionProvider>;
}