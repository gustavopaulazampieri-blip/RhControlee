import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("text-center text-xs text-muted-foreground", className)}>
      <p>© {new Date().getFullYear()} Sodexo RH · Desenvolvido por Gustavo de Paula Zampieri.</p>
    </footer>
  );
}
