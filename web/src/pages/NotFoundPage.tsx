import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="text-ink-muted">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
