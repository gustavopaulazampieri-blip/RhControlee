import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────
export type OcorrenciaTipo = "falta" | "atestado" | "troca" | "folga" | "hora_extra";

export interface Unidade {
  id: string;
  nome: string;
  codigo: string;
}

export interface Colaborador {
  id: string;
  matricula: string;
  nome: string;
  ativo: boolean;
  unidade_id: string;
  unidades?: { nome: string; codigo: string };
}

export interface Ocorrencia {
  id: string;
  colaborador_id: string;
  tipo: OcorrenciaTipo;
  data: string;
  justificativa: string | null;
  criado_por: string;
  created_at: string;
  updated_at: string;
  colaboradores?: { nome: string; matricula: string; unidades?: { codigo: string; nome: string } };
  profiles?: { nome: string };
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  unidade_id: string | null;
  unidades?: { nome: string; codigo: string };
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "rh" | "gestor";
  profiles?: { nome: string; email: string };
}

// ── Current user helpers ───────────────────────────────────────────────
export function useCurrentProfile() {
  return useQuery({
    queryKey: ["currentProfile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("profiles")
        .select("*, unidades(nome, codigo)")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentRoles() {
  return useQuery({
    queryKey: ["currentRoles"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) return [];
      return (data ?? []).map((r) => r.role as "admin" | "rh" | "gestor");
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsAdmin() {
  const { data: roles = [] } = useCurrentRoles();
  return roles.includes("admin") || roles.includes("rh");
}

// ── Unidades ───────────────────────────────────────────────────────────
export function useUnidades() {
  return useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Unidade[];
    },
  });
}

export function useUpsertUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; codigo: string; id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("unidades")
          .update({ nome: values.nome, codigo: values.codigo })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("unidades")
          .insert({ nome: values.nome, codigo: values.codigo });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade salva!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Colaboradores ──────────────────────────────────────────────────────
export function useColaboradores(search = "", unidadeId = "") {
  return useQuery({
    queryKey: ["colaboradores", search, unidadeId],
    queryFn: async () => {
      let q = supabase
        .from("colaboradores")
        .select("*, unidades(nome, codigo)")
        .eq("ativo", true)
        .order("nome");
      if (search) q = q.ilike("nome", `%${search}%`);
      if (unidadeId) q = q.eq("unidade_id", unidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Colaborador[];
    },
  });
}

export function useUpsertColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      nome: string;
      matricula: string;
      unidade_id: string;
      id?: string;
    }) => {
      if (values.id) {
        const { error } = await supabase
          .from("colaboradores")
          .update({ nome: values.nome, matricula: values.matricula, unidade_id: values.unidade_id })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colaboradores").insert({
          nome: values.nome,
          matricula: values.matricula,
          unidade_id: values.unidade_id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador salvo!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colaboradores").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador desativado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Ocorrências ────────────────────────────────────────────────────────
export function useOcorrencias(
  filters: { tipo?: string; unidadeId?: string; periodo?: number; semana?: string } = {},
) {
  return useQuery({
    queryKey: ["ocorrencias", filters],
    queryFn: async () => {
      let q = supabase
        .from("ocorrencias")
        .select("*, colaboradores(nome, matricula, unidades(codigo, nome))")
        .order("data", { ascending: false });

      if (filters.tipo) q = q.eq("tipo", filters.tipo as OcorrenciaTipo);
      if (filters.unidadeId) {
        const { data: colabs } = await supabase
          .from("colaboradores")
          .select("id")
          .eq("unidade_id", filters.unidadeId);
        const ids = (colabs ?? []).map((c) => c.id);
        if (ids.length > 0) q = q.in("colaborador_id", ids);
        else return [];
      }
      if (filters.periodo) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filters.periodo);
        q = q.gte("data", cutoff.toISOString().slice(0, 10));
      }
      if (filters.semana) {
        const [year, week] = filters.semana.split("-W").map(Number);
        const jan4 = new Date(year, 0, 4);
        const s1 = new Date(jan4);
        s1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
        const start = new Date(s1);
        start.setDate(s1.getDate() + (week - 1) * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        q = q
          .gte("data", start.toISOString().slice(0, 10))
          .lte("data", end.toISOString().slice(0, 10));
      }

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Ocorrencia[];

      // criado_por references auth.users, not public.profiles, so PostgREST can't embed it.
      // Fetch the profile names separately and attach them client-side.
      const userIds = [...new Set(rows.map((r) => r.criado_por).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", userIds);
        const byId = new Map((profs ?? []).map((p) => [p.id, p.nome]));
        rows.forEach((r) => {
          r.profiles = byId.has(r.criado_por) ? { nome: byId.get(r.criado_por)! } : undefined;
        });
      }

      return rows;
    },
  });
}

export function useCreateOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      colaborador_id: string;
      tipo: OcorrenciaTipo;
      data: string;
      justificativa?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("ocorrencias").insert({
        colaborador_id: values.colaborador_id,
        tipo: values.tipo,
        data: values.data,
        justificativa: values.justificativa,
        criado_por: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ocorrencias"] });
      toast.success("Ocorrência registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      tipo: OcorrenciaTipo;
      data: string;
      justificativa?: string;
    }) => {
      const { error } = await supabase.from("ocorrencias").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ocorrencias"] });
      toast.success("Ocorrência atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ocorrencias"] });
      toast.success("Ocorrência removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Users / Gestores ───────────────────────────────────────────────────
export function useAllProfiles() {
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, unidades(nome, codigo)")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ["allRoles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      const rows = (data ?? []) as unknown as UserRole[];

      // user_id references auth.users, not public.profiles — fetch names separately.
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", userIds);
        const byId = new Map((profs ?? []).map((p) => [p.id, { nome: p.nome, email: p.email }]));
        rows.forEach((r) => {
          r.profiles = byId.get(r.user_id);
        });
      }
      return rows;
    },
  });
}

export function useGrantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "rh" | "gestor" }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: role }, { onConflict: "user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allRoles"] });
      toast.success("Papel atribuído!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "rh" | "gestor" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allRoles"] });
      toast.success("Papel removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProfileUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, unidadeId }: { userId: string; unidadeId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ unidade_id: unidadeId })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allProfiles"] });
      toast.success("Unidade atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────
export const TIPO_LABELS: Record<OcorrenciaTipo, string> = {
  falta: "Falta",
  atestado: "Atestado",
  troca: "Troca de Dia",
  folga: "Folga",
  hora_extra: "Hora Extra",
};

export const TIPO_COLORS: Record<OcorrenciaTipo, string> = {
  falta: "destructive",
  atestado: "warning",
  troca: "secondary",
  folga: "success",
  hora_extra: "default",
};

export function fmtDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
