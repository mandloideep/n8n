import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SigninSchema, SignupSchema } from "@/lib/schemas";
import { toastError } from "@/services/api-caller";

function firstZodError(error: unknown): string {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as any).issues as { message: string }[];
    if (issues && issues.length) return issues[0].message;
  }
  return "Invalid form input";
}

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = SigninSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(firstZodError(parsed.error));
      setIsLoading(false);
      return;
    }

    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Welcome back");
      navigate("/workflows");
    } catch (error: unknown) {
      toastError(error, "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? ""),
    };

    const parsed = SignupSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(firstZodError(parsed.error));
      setIsLoading(false);
      return;
    }

    try {
      await signup(parsed.data.email, parsed.data.password, parsed.data.name || undefined);
      toast.success("Account created");
      navigate("/workflows");
    } catch (error: unknown) {
      toastError(error, "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-8">
        <Link to="/" className="font-display text-2xl italic leading-none">
          workflow
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-8 pb-24">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="font-display text-4xl italic leading-tight">Sign in.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Or create an account to start composing.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b border-border rounded-none h-auto mb-8">
              <TabsTrigger
                value="login"
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-email"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-password"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="h-11 bg-card border-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-foreground text-background hover:bg-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-name"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Name{" "}
                    <span className="text-muted-foreground/60 normal-case tracking-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-email"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11 bg-card border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-password"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="h-11 bg-card border-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-foreground text-background hover:bg-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
