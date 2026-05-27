import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-8">
        <Link to="/" className="font-display text-2xl italic leading-none">
          workflow
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-8">
        <div className="max-w-md text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">404</p>
          <h1 className="mt-4 font-display text-6xl italic leading-none">Not found.</h1>
          <p className="mt-6 text-sm text-muted-foreground">That path doesn't lead anywhere yet.</p>
          <Link
            to="/"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            Back home
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
