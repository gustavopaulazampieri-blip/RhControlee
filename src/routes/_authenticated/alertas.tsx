import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOcorrencias, fmtDate, type Ocorrencia } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/alertas")({ component: AlertasPage });

interface Alerta {
  nome: string;
  unidade: string;
  tipo: "falta_repetida" | "he_pendente" | "troca_pendente";
  qtd: number;
  datas: string[];
}

function buildAlertas(ocorrencias: Ocorrencia[]): Alerta[] {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const alertas: Alerta[] = [];
  const byColab: Record<string, Ocorrencia[]> = {};

  ocorrencias.forEach((o) => {
    const nome = o.colaboradores?.nome ?? o.colaborador_id;
    if (!byColab[nome]) byColab[nome] = [];
    byColab[nome].push(o);
  });

  Object.entries(byColab).forEach(([nome, list]) => {
    const un = list[0]?.colaboradores?.unidades?.codigo ?? "—";
    const faltasMes = list.filter((o) => o.tipo === "falta" && o.data.startsWith(mesAtual));
    const atestadosMes = list.filter((o) => o.tipo === "atestado" && o.data.startsWith(mesAtual));
    const semJust = faltasMes.filter((f) => !atestadosMes.some((a) => a.data === f.data));
    if (semJust.length >= 2)
      alertas.push({
        nome,
        unidade: un,
        tipo: "falta_repetida",
        qtd: semJust.length,
        datas: semJust.map((o) => fmtDate(o.data)),
      });

    const hePend = list.filter((o) => o.tipo === "hora_extra" && !o.justificativa);
    if (hePend.length > 0)
      alertas.push({
        nome,
        unidade: un,
        tipo: "he_pendente",
        qtd: hePend.length,
        datas: hePend.map((o) => fmtDate(o.data)),
      });

    const trocaPend = list.filter((o) => o.tipo === "troca" && !o.justificativa);
    if (trocaPend.length > 0)
      alertas.push({
        nome,
        unidade: un,
        tipo: "troca_pendente",
        qtd: trocaPend.length,
        datas: trocaPend.map((o) => fmtDate(o.data)),
      });
  });

  return alertas;
}

const ALERTA_CONFIG = {
  falta_repetida: {
    label: "Faltas repetidas sem atestado",
    icon: AlertTriangle,
    cls: "bg-red-50 border-red-200",
    badgeCls: "bg-red-100 text-red-800",
  },
  he_pendente: {
    label: "Hora Extra sem justificativa",
    icon: Clock,
    cls: "bg-orange-50 border-orange-200",
    badgeCls: "bg-orange-100 text-orange-800",
  },
  troca_pendente: {
    label: "Troca sem data de compensação",
    icon: ArrowLeftRight,
    cls: "bg-purple-50 border-purple-200",
    badgeCls: "bg-purple-100 text-purple-800",
  },
};

function AlertasPage() {
  const { data: ocorrencias = [], isLoading } = useOcorrencias();
  const alertas = buildAlertas(ocorrencias);
  const [unidade, setUnidade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const unidades = [...new Set(alertas.map((a) => a.unidade))].sort();
  const filtrados = alertas.filter(
    (a) => (!unidade || a.unidade === unidade) && (!categoria || a.tipo === categoria),
  );

  const grouped = filtrados.reduce<Record<string, Alerta[]>>((acc, a) => {
    if (!acc[a.tipo]) acc[a.tipo] = [];
    acc[a.tipo].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Alertas</h1>
        <p className="text-sm text-muted-foreground">
          Pendências organizadas por tipo para facilitar a tomada de decisão.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(ALERTA_CONFIG).map(([tipo, cfg]) => {
          const Icon = cfg.icon;
          const total = alertas.filter((a) => a.tipo === tipo).length;
          return (
            <Card key={tipo} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{cfg.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">{total}</p>
                </div>
                <div className={`rounded-xl border p-2.5 ${cfg.cls}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="filter-bar">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <Select onValueChange={(v) => setUnidade(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas as unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas as unidades</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setCategoria(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os tipos</SelectItem>
            {Object.entries(ALERTA_CONFIG).map(([tipo, cfg]) => (
              <SelectItem key={tipo} value={tipo}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {filtrados.length} pendência(s)
        </span>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Carregando…</div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm">Nenhum alerta para os filtros selecionados.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([tipo, list]) => {
          const cfg = ALERTA_CONFIG[tipo as keyof typeof ALERTA_CONFIG];
          const Icon = cfg.icon;
          return (
            <Card key={tipo} className={`border ${cfg.cls}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5" />
                  {cfg.label}
                  <Badge className={cfg.badgeCls}>{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.slice(0, expanded[tipo] ? undefined : 5).map((a, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/70 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold">{a.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({a.unidade})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.qtd}x — {a.datas.join(" · ")}
                    </div>
                  </div>
                ))}
                {list.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setExpanded((s) => ({ ...s, [tipo]: !s[tipo] }))}
                  >
                    {expanded[tipo] ? "Mostrar menos" : `Ver mais ${list.length - 5} caso(s)`}
                  </Button>
                )}
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/painel">
                      Analisar no Painel Geral <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
