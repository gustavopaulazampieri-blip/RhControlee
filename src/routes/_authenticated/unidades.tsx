import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { useUnidades, useUpsertUnidade, useDeleteUnidade, type Unidade } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/unidades")({ component: UnidadesPage });

function UnidadesPage() {
  const { data: unidades = [], isLoading } = useUnidades();
  const upsert = useUpsertUnidade();
  const del = useDeleteUnidade();

  const [modal, setModal] = useState<{ open: boolean; editing?: Unidade }>({ open: false });
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  const openCreate = () => {
    setNome("");
    setCodigo("");
    setModal({ open: true });
  };
  const openEdit = (u: Unidade) => {
    setNome(u.nome);
    setCodigo(u.codigo);
    setModal({ open: true, editing: u });
  };

  const handleSave = async () => {
    if (!nome.trim() || !codigo.trim()) return;
    await upsert.mutateAsync({
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      id: modal.editing?.id,
    });
    setModal({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            Gestão das unidades da operação Sodexo/Electrolux.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova unidade
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : unidades.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <span className="text-3xl opacity-40">🏢</span>
            <p className="text-sm">Nenhuma unidade cadastrada.</p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              Cadastrar agora
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono font-semibold">{u.codigo}</TableCell>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir unidade ${u.codigo}?`)) del.mutate(u.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{modal.editing ? "Editar unidade" : "Nova unidade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: FM"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Facilities Management"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
