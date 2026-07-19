import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OcorrenciaBadge } from "@/components/OcorrenciaBadge";
import { useOcorrencias, fmtDate, type Ocorrencia } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/semana")({ component: SemanaPage });

function getDefaultWeek() {
  const now = new Date();
  const y = now.getFullYear();
  const start = new Date(y, 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
}

function SemanaPage() {
  const [semana, setSemana] = useState(getDefaultWeek());
  const { data: ocorrencias = [], isLoading } = useOcorrencias({ semana });

  // Group by colaborador
  const byColab = ocorrencias.reduce<Record<string, Ocorrencia[]>>((acc, o) => {
    const nome = o.colaboradores?.nome ?? o.colaborador_id;
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(o);
    return acc;
  }, {});

  const getCruzStatus = (list: Ocorrencia[]) => {
    const faltas = list.filter((o) => o.tipo === "falta");
    const atestados = list.filter((o) => o.tipo === "atestado");
    if (faltas.length === 0) return { label: "Sem faltas", cls: "bg-green-100 text-green-800" };
    const allJustified = faltas.every((f) => atestados.some((a) => a.data === f.data));
    return allJustified
      ? { label: "Faltas justificadas", cls: "bg-amber-100 text-amber-800" }
      : { label: "⚠ Faltas sem atestado", cls: "bg-red-100 text-red-800" };
  };

  const exportCSV = () => {
    const header = "Colaborador,Matrícula,Unidade,Tipo,Data,Observação";
    const rows = ocorrencias.map((o) =>
      [
        o.colaboradores?.nome,
        o.colaboradores?.matricula,
        o.colaboradores?.unidades?.codigo,
        o.tipo,
        o.data,
        `"${(o.justificativa ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `semana_${semana}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Fechamento Semanal</h1>
          <p className="text-sm text-muted-foreground">
            Cruzamento de falta × atestado por colaborador.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="week"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <Button variant="outline" onClick={exportCSV} disabled={ocorrencias.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Carregando…</div>
      ) : Object.keys(byColab).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <span className="text-4xl opacity-40">📅</span>
          <p className="text-sm">Nenhuma ocorrência nessa semana.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byColab).map(([nome, list]) => {
            const status = getCruzStatus(list);
            const unidade = list[0]?.colaboradores?.unidades?.codigo ?? "—";
            return (
              <Card key={nome}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-white">
                        {nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{nome}</CardTitle>
                        <p className="text-xs text-muted-foreground">{unidade}</p>
                      </div>
                    </div>
                    <Badge className={status.cls}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {list.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
                      >
                        <OcorrenciaBadge tipo={o.tipo} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {fmtDate(o.data)}
                        </span>
                        {o.justificativa && (
                          <span className="text-muted-foreground">— {o.justificativa}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
