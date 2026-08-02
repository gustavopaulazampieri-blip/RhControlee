import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  AlertTriangle,
  FilePlus2,
  ClipboardList,
  Users,
  BarChart3,
  CalendarRange,
  Building2,
  UserCog,
  Menu,
  LogOut,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alertas", label: "Alertas", icon: AlertTriangle },
  { to: "/ocorrencias/nova", label: "Nova Ocorrência", icon: FilePlus2 },
  { to: "/ocorrencias", label: "Registros", icon: ClipboardList },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/painel", label: "Painel Geral", icon: BarChart3 },
  { to: "/semana", label: "Fechamento", icon: CalendarRange },
  { to: "/unidades", label: "Unidades", icon: Building2 },
  { to: "/gestores", label: "Gestores", icon: UserCog },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[image:var(--gradient-brand)] px-4 shadow-md md:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-1.5 shadow-sm">
            <Logo className="h-7 w-7 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-white">Sodexo RH</p>
            <p className="text-[10px] uppercase tracking-widest text-white/70">
              Gestão de ocorrências
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Ao vivo
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 top-16 z-20 hidden w-60 border-r border-border bg-sidebar md:block">
        <SidebarNav />
      </aside>

      {/* Main */}
      <main className="pt-16 md:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Menu principal
      </p>
      {navItems.map((item) => {
        const active =
          pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
        <p className="px-3 font-semibold text-foreground">Sodexo RH</p>
        <p className="px-3">Operação Electrolux · dados em tempo real</p>
      </div>
    </nav>
  );
}
