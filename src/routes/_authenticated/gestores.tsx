import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ShieldOff, Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useAllProfiles,
  useAllRoles,
  useGrantRole,
  useRevokeRole,
  useUpdateProfileUnidade,
  useUnidades,
  useIsAdmin,
  type Profile,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/gestores")({ component: GestoresPage });

const ROLE_LABELS: Record<string, string> = { admin: "Admin", rh: "RH", gestor: "Gestor" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-800",
  rh: "bg-blue-100 text-blue-800",
  gestor: "bg-emerald-100 text-emerald-800",
};

function GestoresPage() {
  const isAdmin = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles();
  const { data: roles = [] } = useAllRoles();
  const { data: unidades = [] } = useUnidades();
  const grantRole = useGrantRole();
  const revokeRole = useRevokeRole();
  const updateUnidade = useUpdateProfileUnidade();

  const [editModal, setEditModal] = useState<{ open: boolean; profile?: Profile }>({ open: false });
  const [selRole, setSelRole] = useState<"admin" | "rh" | "gestor">("gestor");
  const [selUnidade, setSelUnidade] = useState<string>("");

  const getUserRoles = (userId: string) =>
    roles.filter((r) => r.user_id === userId).map((r) => r.role);

  const openEdit = (p: Profile) => {
    setSelUnidade(p.unidade_id ?? "");
    setSelRole("gestor");
    setEditModal({ open: true, profile: p });
  };

  const handleGrant = async () => {
    if (!editModal.profile) return;
    await grantRole.mutateAsync({ userId: editModal.profile.id, role: selRole });
    if (selUnidade)
      await updateUnidade.mutateAsync({ userId: editModal.profile.id, unidadeId: selUnidade });
    setEditModal({ open: false });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <ShieldOff className="h-8 w-8 opacity-40" />
        <p className="text-sm">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Gestores & Permissões</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os acessos e papéis de cada usuário do sistema.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const userRoles = getUserRoles(p.id);
          return (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-white flex-shrink-0">
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                      {p.unidades && (
                        <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {p.unidades.codigo}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    Editar
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {userRoles.length === 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Sem papel
                    </Badge>
                  ) : (
                    userRoles.map((r) => (
                      <Badge key={r} className={`gap-1 ${ROLE_COLORS[r] ?? ""}`}>
                        <ShieldCheck className="h-3 w-3" />
                        {ROLE_LABELS[r]}
                        <button
                          className="ml-1 opacity-60 hover:opacity-100"
                          onClick={() => {
                            if (confirm(`Remover papel ${ROLE_LABELS[r]} de ${p.nome}?`))
                              revokeRole.mutate({ userId: p.id, role: r });
                          }}
                        >
                          ✕
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editModal.open} onOpenChange={(o) => !o && setEditModal({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar acesso — {editModal.profile?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Conceder papel</Label>
              <Select
                value={selRole}
                onValueChange={(v) => setSelRole(v as "admin" | "rh" | "gestor")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — acesso total</SelectItem>
                  <SelectItem value="rh">RH — acesso total sem administrar usuários</SelectItem>
                  <SelectItem value="gestor">Gestor — apenas sua unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade (para gestores)</Label>
              <Select value={selUnidade} onValueChange={setSelUnidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem unidade</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.codigo} — {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleGrant} disabled={grantRole.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
