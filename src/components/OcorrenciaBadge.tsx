import { Badge } from "@/components/ui/badge";
import type { OcorrenciaTipo } from "@/lib/queries";
import { TIPO_LABELS } from "@/lib/queries";

const EMOJI: Record<OcorrenciaTipo, string> = {
  falta: "🔴",
  atestado: "🟡",
  troca: "🔵",
  folga: "🟢",
  hora_extra: "🟠",
};

const VARIANT: Record<OcorrenciaTipo, "destructive" | "secondary" | "outline" | "default"> = {
  falta: "destructive",
  atestado: "secondary",
  troca: "outline",
  folga: "secondary",
  hora_extra: "default",
};

export function OcorrenciaBadge({ tipo }: { tipo: OcorrenciaTipo }) {
  return (
    <Badge variant={VARIANT[tipo]} className="gap-1 whitespace-nowrap">
      {EMOJI[tipo]} {TIPO_LABELS[tipo]}
    </Badge>
  );
}
