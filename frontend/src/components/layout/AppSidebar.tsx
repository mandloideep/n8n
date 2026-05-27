import { Key, Plus, ChevronDown, LogOut, User, Workflow } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const personalItems = [
  { title: "Workflows", url: "/workflows", icon: Workflow },
  { title: "Credentials", url: "/credentials", icon: Key },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <Sidebar className="w-60 border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-5 py-6 border-b border-sidebar-border">
        <NavLink
          to="/workflows"
          className="font-display text-2xl italic leading-none text-sidebar-foreground"
        >
          workflow
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="flex-1 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50 px-5 mb-3">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                          isActive
                            ? "text-sidebar-foreground font-medium"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-sidebar-primary"
                            />
                          )}
                          <item.icon className="h-4 w-4" strokeWidth={1.5} />
                          <span>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <span className="inline-flex items-center gap-2 text-sm">
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                New
              </span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem asChild>
              <NavLink to="/workflows/new" className="flex items-center cursor-pointer text-sm">
                <Workflow className="mr-2 h-4 w-4" strokeWidth={1.5} />
                New workflow
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/credentials/new" className="flex items-center cursor-pointer text-sm">
                <Key className="mr-2 h-4 w-4" strokeWidth={1.5} />
                New credential
              </NavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-auto justify-start px-2 py-2 hover:bg-sidebar-accent"
            >
              <div className="mr-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-border bg-card">
                <User className="h-3.5 w-3.5 text-sidebar-foreground/70" strokeWidth={1.5} />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer text-sm"
            >
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
