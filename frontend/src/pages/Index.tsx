import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Drag.",
    body: "Sketch a flow the way you'd draw it on a napkin.",
  },
  {
    title: "Connect.",
    body: "Telegram, email, Slack — plug into the tools you already use.",
  },
  {
    title: "Run.",
    body: "Credentials stay encrypted. Webhooks fire on demand.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-8">
        <span className="font-display text-2xl italic leading-none">workflow</span>
        <Link to="/auth">
          <Button
            variant="ghost"
            className="text-sm text-foreground/70 hover:bg-transparent hover:text-foreground"
          >
            Sign in
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-8 pb-32 pt-16 md:pt-28">
        <div className="max-w-2xl">
          <h1
            className="reveal font-display text-5xl leading-[1.05] tracking-tight md:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            <span className="italic">Compose. Connect.</span>
            <br />
            <span className="italic">Let it run.</span>
          </h1>

          <p
            className="reveal mt-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            Visual logic for the things you'd rather not do twice.
          </p>

          <div className="reveal mt-10 flex items-center gap-6" style={{ animationDelay: "320ms" }}>
            <Link to="/auth">
              <Button
                size="lg"
                className="rounded-md bg-foreground px-6 text-background hover:bg-primary"
              >
                Get started
              </Button>
            </Link>
            <Link
              to="/auth"
              className="group inline-flex items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              View a demo
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div
          className="reveal mt-32 border-t border-border pt-12"
          style={{ animationDelay: "440ms" }}
        >
          <div className="grid gap-12 md:grid-cols-3 md:gap-16">
            {features.map((f) => (
              <div key={f.title}>
                <p className="font-display text-2xl italic leading-none">{f.title}</p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl border-t border-border px-8 py-8 text-center text-xs text-muted-foreground">
        <p>
          <span className="font-display italic">workflow</span>
          <span className="mx-2">·</span>
          made quietly
        </p>
      </footer>
    </div>
  );
}
