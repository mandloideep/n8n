import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

const Workflows = lazy(() => import("./pages/Workflows"));
const WorkflowEditor = lazy(() => import("./pages/WorkflowEditor"));
const Credentials = lazy(() => import("./pages/Credentials"));
const CredentialForm = lazy(() => import("./components/credentials/CredentialForm"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="h-screen flex items-center justify-center text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/workflows"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Workflows />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflows/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WorkflowEditor />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflows/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WorkflowEditor />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/credentials"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Credentials />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/credentials/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CredentialForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
