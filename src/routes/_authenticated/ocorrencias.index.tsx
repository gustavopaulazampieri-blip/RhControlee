import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FilePlus2, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { OcorrenciaBadge } from "@/components/OcorrenciaBadge";
import {
  useOcorrencias,
  useUnidades,
  useColaboradores,
  useUpdateOcorrencia,
  useDeleteOcorrencia,
  fmtDate,
  TIPO_LABELS,
  type OcorrenciaTipo,
  type Ocorrencia,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ocorrencias/")({
  component: OcorrenciasPage,
});

const TIPOS: OcorrenciaTipo[] = ["falta", "atestado", "troca", "folga", "hora_extra"];
const TIPO_EMOJI: Record<OcorrenciaTipo, string> = {
  falta: "🔴",
  atestado: "🟡",
  troca: "🔵",
  folga: "🟢",
  hora_extra: "🟠",
};

function OcorrenciasPage() {
  const [tipoFilter, setTipoFilter] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");

  const { data: ocorrencias = [], isLoading } = useOcorrencias({
    tipo: tipoFilter || undefined,
    unidadeId: unidadeFilter || undefined,
    periodo: periodoFilter ? Number(periodoFilter) : undefined,
  });
  const { data: unidades = [] } = useUnidades();
  const deleteMut = useDeleteOcorrencia();

  // Edit modal state
  const [editing, setEditing] = useState<Ocorrencia | null>(null);
  const [editTipo, setEditTipo] = useState<OcorrenciaTipo>("falta");
  const [editData, setEditData] = useState("");
  const [editJust, setEditJust] = useState("");
  const updateMut = useUpdateOcorrencia();

  const openEdit = (o: Ocorrencia) => {
    setEditing(o);
    setEditTipo(o.tipo);
    setEditData(o.data);
    setEditJust(o.justificativa ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateMut.mutateAsync({
      id: editing.id,
      tipo: editTipo,
      data: editData,
      justificativa: editJust || undefined,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Registros</h1>
          <p className="text-sm text-muted-foreground">
            Ocorrências salvas, com filtros rápidos e leitura por colaborador.
          </p>
        </div>
        <Button asChild>
          <Link to="/ocorrencias/nova">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nova ocorrência
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
        <Select onValueChange={(v) => setTipoFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPO_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setPeriodoFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todo o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todo o período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ocorrencias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <span className="text-4xl opacity-40">📋</span>
            <p className="text-sm">Nenhuma ocorrência encontrada.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/ocorrencias/nova">Registrar agora</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Obs.</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ocorrencias.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {fmtDate(o.data)}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{o.colaboradores?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.colaboradores?.matricula}</p>
                    </TableCell>
                    <TableCell>
                      <OcorrenciaBadge tipo={o.tipo} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.colaboradores?.unidades?.codigo ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.profiles?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                      {o.justificativa ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(o)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir esta ocorrência?")) deleteMut.mutate(o.id);
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

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Colaborador</Label>
              <p className="text-sm font-semibold">{editing?.colaboradores?.nome}</p>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTipo(t)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${editTipo === t ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {TIPO_EMOJI[t]} {TIPO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={editJust} onChange={(e) => setEditJust(e.target.value)} rows={3} />
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground">
                Registrado por {editing.profiles?.nome ?? "—"} em{" "}
                {new Date(editing.created_at).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
