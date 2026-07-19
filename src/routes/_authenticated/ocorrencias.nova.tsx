import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useColaboradores,
  useUnidades,
  useCreateOcorrencia,
  TIPO_LABELS,
  type OcorrenciaTipo,
} from "@/lib/queries";

const schema = z.object({
  unidade_id: z.string().min(1, "Selecione a unidade"),
  colaborador_id: z.string().min(1, "Selecione o colaborador"),
  tipo: z.enum(["falta", "atestado", "troca", "folga", "hora_extra"] as const),
  data: z.string().min(1, "Informe a data"),
  justificativa: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/ocorrencias/nova")({
  component: NovaOcorrenciaPage,
});

const TIPOS: OcorrenciaTipo[] = ["falta", "atestado", "troca", "folga", "hora_extra"];
const TIPO_EMOJI: Record<OcorrenciaTipo, string> = {
  falta: "🔴",
  atestado: "🟡",
  troca: "🔵",
  folga: "🟢",
  hora_extra: "🟠",
};

function NovaOcorrenciaPage() {
  const navigate = useNavigate();
  const [selectedUnidade, setSelectedUnidade] = useState("");
  const { data: unidades = [] } = useUnidades();
  const { data: colaboradores = [] } = useColaboradores("", selectedUnidade);
  const create = useCreateOcorrencia();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { data: new Date().toISOString().slice(0, 10), tipo: "falta" },
  });

  const onSubmit = async (values: FormValues) => {
    await create.mutateAsync({
      colaborador_id: values.colaborador_id,
      tipo: values.tipo,
      data: values.data,
      justificativa: values.justificativa || undefined,
    });
    navigate({ to: "/ocorrencias" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Nova Ocorrência</h1>
        <p className="text-sm text-muted-foreground">
          Registre faltas, atestados, trocas, folgas e horas extras.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da ocorrência</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Unidade */}
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                onValueChange={(v) => {
                  setSelectedUnidade(v);
                  form.setValue("unidade_id", v);
                  form.setValue("colaborador_id", "");
                }}
              >
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
              {form.formState.errors.unidade_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.unidade_id.message}
                </p>
              )}
            </div>

            {/* Colaborador */}
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select
                onValueChange={(v) => form.setValue("colaborador_id", v)}
                disabled={!selectedUnidade}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedUnidade ? "Selecione o colaborador…" : "Selecione a unidade primeiro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} <span className="text-muted-foreground">· {c.matricula}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.colaborador_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.colaborador_id.message}
                </p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de ocorrência</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIPOS.map((t) => {
                  const selected = form.watch("tipo") === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => form.setValue("tipo", t)}
                      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{TIPO_EMOJI[t]}</span>
                      {TIPO_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data da ocorrência</Label>
              <Input id="data" type="date" {...form.register("data")} />
              {form.formState.errors.data && (
                <p className="text-xs text-destructive">{form.formState.errors.data.message}</p>
              )}
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label htmlFor="just">
                Observação / Justificativa{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="just"
                {...form.register("justificativa")}
                placeholder="Ex: autorizado via WhatsApp, CID do atestado…"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={create.isPending} className="flex-1">
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar ocorrência
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/ocorrencias" })}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
