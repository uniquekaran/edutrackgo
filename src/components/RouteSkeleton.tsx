import { MobileShell } from "@/components/MobileShell";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-muted/70 animate-pulse ${className}`} />;
}

export function RouteSkeleton() {
  return (
    <MobileShell>
      <div className="flex-1 overflow-hidden">
        <div className="px-6 pt-10 pb-8 gradient-primary rounded-b-[2rem] space-y-3">
          <Bar className="h-3 w-24 bg-white/30" />
          <Bar className="h-7 w-48 bg-white/30" />
          <Bar className="h-4 w-32 bg-white/20" />
        </div>
        <div className="px-5 -mt-10 space-y-4">
          <div className="rounded-3xl glass p-5 space-y-3 shadow-elevated">
            <Bar className="h-24 w-full" />
            <Bar className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Bar className="h-20" />
            <Bar className="h-20" />
          </div>
          <Bar className="h-16" />
          <Bar className="h-40" />
        </div>
      </div>
    </MobileShell>
  );
}

export default RouteSkeleton;
