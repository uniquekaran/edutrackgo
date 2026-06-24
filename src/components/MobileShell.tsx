import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-stretch justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-background shadow-elevated overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
