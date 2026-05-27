import { useState } from "react";
import {
  Trash2,
  Key,
  Loader2,
  MessageCircle,
  Mail,
  Hash,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { deleteCredential, getCredentialsPage } from "@/services/credential.service";
import { toastError } from "@/services/api-caller";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const platformGlyph: Record<string, React.ReactNode> = {
  telegram: <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
  email: <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />,
  slack: <Hash className="h-3.5 w-3.5" strokeWidth={1.5} />,
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
      toast.success("Credential deleted");
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
    onError: (err: unknown) => toastError(err, "Failed to delete credential"),
  });

  const handleDelete = (credentialId: number) => {
    if (!confirm("Delete this credential?")) return;
    deleteMutation.mutate(credentialId);
  };

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-8 text-sm text-muted-foreground">
        Couldn't load credentials.
      </div>
    );
  }

  const credentials = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-16">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="font-display text-5xl italic leading-none">Credentials.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Keys live here. They never leave encrypted.
          </p>
        </div>
        <Link
          to="/credentials/new"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          New credential
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {credentials.length === 0 ? (
        <div className="border-t border-border py-24 text-center">
          <p className="font-display text-2xl italic text-foreground/80">Nothing wired up yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a credential to connect your first service.
          </p>
          <Link
            to="/credentials/new"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            Add one
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <ul className="border-t border-border">
          {credentials.map((credential) => (
            <li
              key={credential.id}
              className="group flex items-center justify-between border-b border-border py-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="truncate text-base font-medium text-foreground">
                    {credential.title}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {platformGlyph[credential.platform] || (
                      <Key className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                    <span className="capitalize">{credential.platform}</span>
                  </span>
                </div>
                {credential.created_at && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    added {new Date(credential.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(credential.id)}
                className="ml-6 h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {data.total > PAGE_SIZE && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                aria-label="Previous page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-xs text-muted-foreground">
                {page + 1} / {totalPages}
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
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
