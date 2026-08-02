import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/SiteFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});

const signUpSchema = authSchema.extend({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
});

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — PontoRH" },
      { name: "description", content: "Acesse o PontoRH para registrar e consultar ocorrências." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const target = safeRedirect(search.redirect) ?? "/dashboard";
      throw new Response(null, { status: 302, headers: { Location: target } });
    }
  },
  component: AuthPage,
});

function safeRedirect(value: string | undefined): string | null {
  if (!value) return null;
  try {
    // Only allow same-origin relative paths
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin) return url.pathname + url.search;
    return null;
  } catch {
    return null;
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const afterAuth = async () => {
    await router.invalidate();
    const target = safeRedirect(search.redirect) ?? "/dashboard";
    navigate({ to: target });
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = authSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos");
      return;
    }
    toast.success("Bem-vindo!");
    await afterAuth();
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      nome: form.get("nome"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: parsed.data.nome },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
    await afterAuth();
  };

  const handleGoogle = async () => {
    setLoading(true);
    const destination = safeRedirect(search.redirect) ?? "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(destination, window.location.origin).toString(),
      },
    });
    if (error) {
      setLoading(false);
      toast.error(
        "Não foi possível iniciar o acesso com Google. Verifique a configuração do provedor.",
      );
      return;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef1fb] px-4 py-8">
      <div className="grid w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.35fr_0.65fr]">
        <section className="hidden min-h-[650px] items-center overflow-hidden bg-[#0f2a82] lg:flex">
          <img
            src="/brand/sodexo-rh-inicial.png"
            alt="Sodexo RH — Gestão clara, equipes bem cuidadas"
            className="block h-auto w-full object-contain"
            fetchPriority="high"
          />
        </section>
        <div className="w-full max-w-md justify-self-center p-6 py-10 sm:p-10 lg:self-center">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <img
              src="/brand/sodexo-logo.webp"
              alt="Sodexo"
              className="h-12 w-auto object-contain lg:hidden"
            />
            <div>
              <h2 className="font-display text-2xl font-extrabold text-foreground">
                Bem-vindo ao Sodexo RH
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse a gestão de ocorrências da operação.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-none">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-surface-muted p-0 h-auto">
                <TabsTrigger value="signin" className="rounded-none py-3">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-none py-3">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Continuar com Google
                </Button>

                <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  ou
                  <div className="h-px flex-1 bg-border" />
                </div>

                <TabsContent value="signin" className="mt-0 space-y-4">
                  <form className="space-y-4" onSubmit={handleSignIn}>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">E-mail</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0 space-y-4">
                  <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-nome">Nome</Label>
                      <Input
                        id="signup-nome"
                        name="nome"
                        type="text"
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
            <p>Acesso restrito a colaboradores autorizados.</p>
            <SiteFooter />
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
