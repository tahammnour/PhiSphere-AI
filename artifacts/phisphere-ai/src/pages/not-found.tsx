import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex mb-4 gap-3">
          <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
          <h1 className="text-2xl font-bold text-foreground">404 — Page Not Found</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  );
}
