import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  Loader2,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OcorrenciaBadge } from "@/components/OcorrenciaBadge";
import {
  useOcorrencias,
  useUnidades,
  useUpdateOcorrencia,
  useDeleteOcorrencia,
  fmtDate,
  TIPO_LABELS,
  type OcorrenciaTipo,
  type Ocorrencia,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/painel")({ component: PainelPage });

const TIPOS: OcorrenciaTipo[] = ["falta", "atestado", "troca", "folga", "hora_extra", "outros"];
const TIPO_EMOJI: Record<OcorrenciaTipo, string> = {
  falta: "🔴",
  atestado: "🟡",
  troca: "🔵",
  folga: "🟢",
  hora_extra: "🟠",
  outros: "⚪",
};

function PainelPage() {
  const [tipoFilter, setTipoFilter] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: ocorrencias = [], isLoading } = useOcorrencias({
    tipo: tipoFilter || undefined,
    unidadeId: unidadeFilter || undefined,
    periodo: periodoFilter ? Number(periodoFilter) : undefined,
  });
  const { data: unidades = [] } = useUnidades();
  const deleteMut = useDeleteOcorrencia();
  const updateMut = useUpdateOcorrencia();

  const [editing, setEditing] = useState<Ocorrencia | null>(null);
  const [editTipo, setEditTipo] = useState<OcorrenciaTipo>("falta");
  const [editData, setEditData] = useState("");
  const [editJust, setEditJust] = useState("");
  const [editEntrada, setEditEntrada] = useState("");
  const [editSaida, setEditSaida] = useState("");
  const pageSize = 20;
  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const termo = search.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return true;
    return `${o.colaboradores?.nome ?? ""} ${o.colaboradores?.matricula ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(termo);
  });
  const totalPages = Math.max(1, Math.ceil(ocorrenciasFiltradas.length / pageSize));
  const ocorrenciasVisiveis = ocorrenciasFiltradas.slice((page - 1) * pageSize, page * pageSize);

  const openEdit = (o: Ocorrencia) => {
    setEditing(o);
    setEditTipo(o.tipo);
    setEditData(o.data);
    setEditJust(o.justificativa ?? "");
    setEditEntrada(o.horario_entrada?.slice(0, 5) ?? "");
    setEditSaida(o.horario_saida?.slice(0, 5) ?? "");
  };
  const saveEdit = async () => {
    if (!editing) return;
    await updateMut.mutateAsync({
      id: editing.id,
      tipo: editTipo,
      data: editData,
      justificativa: editJust || undefined,
      horario_entrada: editTipo === "hora_extra" ? editEntrada : undefined,
      horario_saida: editTipo === "hora_extra" ? editSaida : undefined,
    });
    setEditing(null);
  };

  const stats = [
    { label: "Total", value: ocorrencias.length, color: "text-primary" },
    {
      label: "Faltas",
      value: ocorrencias.filter((o) => o.tipo === "falta").length,
      color: "text-destructive",
    },
    {
      label: "Atestados",
      value: ocorrencias.filter((o) => o.tipo === "atestado").length,
      color: "text-amber-600",
    },
    {
      label: "Folgas",
      value: ocorrencias.filter((o) => o.tipo === "folga").length,
      color: "text-green-600",
    },
    {
      label: "HE",
      value: ocorrencias.filter((o) => o.tipo === "hora_extra").length,
      color: "text-orange-600",
    },
  ];

  const exportCSV = () => {
    const header = "Colaborador,Matrícula,Unidade,Tipo,Data,Entrada,Saída,Observação";
    const rows = ocorrenciasFiltradas.map((o) =>
      [
        o.colaboradores?.nome,
        o.colaboradores?.matricula,
        o.colaboradores?.unidades?.codigo,
        o.tipo,
        o.data,
        o.horario_entrada?.slice(0, 5) ?? "",
        o.horario_saida?.slice(0, 5) ?? "",
        `"${(o.justificativa ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `ocorrencias_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Painel Geral</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de todas as unidades.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={ocorrencias.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={`mt-1 font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="filter-bar">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar colaborador…"
            className="pl-9"
          />
        </div>
        <Select
          value={unidadeFilter || "_all"}
          onValueChange={(v) => {
            setUnidadeFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
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
        <Select
          value={tipoFilter || "_all"}
          onValueChange={(v) => {
            setTipoFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
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
        <Select
          value={periodoFilter || "_all"}
          onValueChange={(v) => {
            setPeriodoFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todo o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todo o período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setUnidadeFilter("");
            setTipoFilter("");
            setPeriodoFilter("");
            setPage(1);
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Limpar
        </Button>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {ocorrenciasFiltradas.length} registro(s)
        </span>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <span className="text-4xl opacity-40">📋</span>
            <p className="text-sm">Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Obs.</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ocorrenciasVisiveis.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-semibold">
                      {o.colaboradores?.unidades?.codigo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{o.colaboradores?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.colaboradores?.matricula}</p>
                    </TableCell>
                    <TableCell>
                      <OcorrenciaBadge tipo={o.tipo} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {fmtDate(o.data)}
                      {o.tipo === "hora_extra" && o.horario_entrada && o.horario_saida && (
                        <p className="mt-1 text-[11px] font-sans text-muted-foreground">
                          {o.horario_entrada.slice(0, 5)}–{o.horario_saida.slice(0, 5)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.profiles?.nome ?? "—"}
                    </TableCell>
                    <TableCell
                      title={o.justificativa ?? undefined}
                      className="max-w-[180px] truncate text-sm text-muted-foreground"
                    >
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

      {ocorrenciasFiltradas.length > pageSize && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
            {editTipo === "hora_extra" && (
              <div className="grid gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Entrada</Label>
                  <Input
                    type="time"
                    value={editEntrada}
                    onChange={(e) => setEditEntrada(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saída</Label>
                  <Input
                    type="time"
                    value={editSaida}
                    onChange={(e) => setEditSaida(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={editJust} onChange={(e) => setEditJust(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
              alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
