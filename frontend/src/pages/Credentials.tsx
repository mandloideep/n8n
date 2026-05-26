import { useState } from "react";
import {
  Plus,
  Trash2,
  Key,
  Loader2,
  MessageCircle,
  Mail,
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCredential, getCredentialsPage } from "@/services/credential.service";
import { toastError } from "@/services/api-caller";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const platformIcons: Record<string, React.ReactNode> = {
  telegram: <MessageCircle className="w-5 h-5 text-blue-400" />,
  email: <Mail className="w-5 h-5 text-red-400" />,
  slack: <Hash className="w-5 h-5 text-purple-400" />,
};

const platformColors: Record<string, string> = {
  telegram: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  email: "from-red-500/20 to-red-500/5 border-red-500/30",
  slack: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
};

export default function Credentials() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ["credentials", page],
    queryFn: () => getCredentialsPage(PAGE_SIZE, page * PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      toast.success("Credential deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
    onError: (err: unknown) => toastError(err, "Failed to delete credential"),
  });

  const handleDelete = (credentialId: number) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    deleteMutation.mutate(credentialId);
  };

  if (isPending) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] text-muted-foreground">
        Failed to load credentials.
      </div>
    );
  }

  const credentials = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your service credentials securely
          </p>
        </div>
        <Link to="/credentials/new">
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 bg-card/30">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No credentials yet</h3>
              <p className="text-muted-foreground mb-4">
                Add credentials to connect your integrations
              </p>
              <Link to="/credentials/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credential
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          credentials.map((credential) => (
            <Card
              key={credential.id}
              className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  platformColors[credential.platform] || ""
                } opacity-30`}
              />
              <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                      platformColors[credential.platform] ||
                      "from-secondary to-secondary/50"
                    } flex items-center justify-center border`}
                  >
                    {platformIcons[credential.platform] || <Key className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{credential.title}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs capitalize">
                      {credential.platform}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(credential.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-xs text-muted-foreground">
                  {credential.created_at && (
                    <span>
                      Added: {new Date(credential.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {data.total > PAGE_SIZE && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                aria-label="Previous page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                aria-label="Next page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
