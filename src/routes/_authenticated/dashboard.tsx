import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  FileCheck2,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  FilePlus2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOcorrencias, useUnidades, type OcorrenciaTipo, type Ocorrencia } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

const TIPO_LABEL: Record<OcorrenciaTipo, string> = {
  falta: "Faltas",
  atestado: "Atestados",
  troca: "Trocas",
  folga: "Folgas",
  hora_extra: "HE",
  outros: "Outros",
};

function mesLabel(s: string) {
  const [y, m] = s.split("-");
  return new Date(+y, +m - 1, 1).toLocaleString("pt-BR", { month: "short", year: "2-digit" });
}

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function DashboardPage() {
  const [mesFilter, setMesFilter] = useState("");
  const { data: all = [] } = useOcorrencias();
  const { data: unidades = [] } = useUnidades();

  const filtered = mesFilter ? all.filter((o) => o.data.startsWith(mesFilter)) : all;

  const kpis = [
    {
      label: "Total de ocorrências",
      value: filtered.length,
      sub: mesFilter ? "no mês" : "geral",
      icon: Calendar,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Atestados",
      value: filtered.filter((o) => o.tipo === "atestado").length,
      sub: "com justificativa",
      icon: FileCheck2,
      color: "text-green-700 bg-green-100",
    },
    {
      label: "Faltas sem atestado",
      value: (() => {
        const byColab: Record<string, Ocorrencia[]> = {};
        filtered.forEach((o) => {
          const n = o.colaboradores?.nome ?? o.colaborador_id;
          if (!byColab[n]) byColab[n] = [];
          byColab[n].push(o);
        });
        return Object.values(byColab).reduce((acc, list) => {
          const f = list.filter((o) => o.tipo === "falta");
          const a = list.filter((o) => o.tipo === "atestado");
          return acc + f.filter((flt) => !a.some((at) => at.data === flt.data)).length;
        }, 0);
      })(),
      sub: "ação necessária",
      icon: AlertOctagon,
      color: "text-destructive bg-destructive/10",
    },
    {
      label: "Horas extras",
      value: filtered.filter((o) => o.tipo === "hora_extra").length,
      sub: "registros",
      icon: TrendingUp,
      color: "text-orange-700 bg-orange-100",
    },
  ];

  const TIPOS: OcorrenciaTipo[] = ["falta", "atestado", "troca", "folga", "hora_extra", "outros"];
  const tipoData = TIPOS.map((t) => ({
    name: TIPO_LABEL[t],
    value: filtered.filter((o) => o.tipo === t).length,
  }));
  const unidadeData = unidades
    .map((u) => ({
      name: u.codigo,
      ocorrencias: filtered.filter((o) => o.colaboradores?.unidades?.codigo === u.codigo).length,
    }))
    .filter((u) => u.ocorrencias > 0)
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 8);

  const meses = getLast6Months();
  const evoData = meses.map((m) => ({
    mes: mesLabel(m),
    ocorrencias: all.filter((o) => o.data.startsWith(m)).length,
  }));

  const mesesOpts = [...new Set(all.map((o) => o.data.slice(0, 7)))].sort().reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-[#0f2a82] shadow-md">
        <img
          src="/brand/sodexo-rh-inicial.png"
          alt="Sodexo RH — Gestão clara, equipes bem cuidadas"
          className="block h-auto w-full"
          fetchPriority="high"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Resumo da operação</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores consolidados, sem alertas nominais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/ocorrencias/nova"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            <FilePlus2 className="h-4 w-4" /> Nova ocorrência <ArrowRight className="h-4 w-4" />
          </Link>
          <Select onValueChange={(v) => setMesFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-44 bg-surface">
              <SelectValue placeholder="Todo o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todo o período</SelectItem>
              {mesesOpts.map((m) => (
                <SelectItem key={m} value={m}>
                  {mesLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {k.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-extrabold">{k.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ocorrências por tipo</CardTitle>
            <CardDescription>Distribuição no período</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tipoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Ocorrências"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por unidade</CardTitle>
            <CardDescription>Até 8 unidades mais ativas no período</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unidadeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="ocorrencias" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="ocorrencias"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ fill: "var(--primary)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
