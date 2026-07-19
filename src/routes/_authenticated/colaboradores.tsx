import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, UserX, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  useColaboradores,
  useUnidades,
  useUpsertColaborador,
  useDeleteColaborador,
  type Colaborador,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/colaboradores")({
  component: ColaboradoresPage,
});

function ColaboradoresPage() {
  const [search, setSearch] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState("");
  const { data: colaboradores = [], isLoading } = useColaboradores(search, unidadeFilter);
  const { data: unidades = [] } = useUnidades();
  const upsert = useUpsertColaborador();
  const deactivate = useDeleteColaborador();

  const [modal, setModal] = useState<{ open: boolean; editing?: Colaborador }>({ open: false });
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [unidadeId, setUnidadeId] = useState("");

  const openCreate = () => {
    setNome("");
    setMatricula("");
    setUnidadeId("");
    setModal({ open: true });
  };
  const openEdit = (c: Colaborador) => {
    setNome(c.nome);
    setMatricula(c.matricula);
    setUnidadeId(c.unidade_id);
    setModal({ open: true, editing: c });
  };

  const handleSave = async () => {
    if (!nome.trim() || !matricula.trim() || !unidadeId) return;
    await upsert.mutateAsync({
      nome: nome.trim(),
      matricula: matricula.trim(),
      unidade_id: unidadeId,
      id: modal.editing?.id,
    });
    setModal({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e gestão de colaboradores por unidade.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo colaborador
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="🔍 Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60"
        />
        <Select onValueChange={(v) => setUnidadeFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas as unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas as unidades</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : colaboradores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <span className="text-4xl opacity-40">👤</span>
            <p className="text-sm">Nenhum colaborador encontrado.</p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              Cadastrar agora
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{c.matricula}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.unidades?.codigo ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.ativo ? "secondary" : "destructive"}
                        className={c.ativo ? "text-green-700 bg-green-100" : ""}
                      >
                        {c.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Desativar ${c.nome}?`)) deactivate.mutate(c.id);
                          }}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={modal.open} onOpenChange={(o) => !o && setModal({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal.editing ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 00123"
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade…" />
                </SelectTrigger>
                <SelectContent>
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
            <Button variant="outline" onClick={() => setModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
