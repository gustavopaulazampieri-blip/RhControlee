
# Plano — PontoRH: HTML → App React em Produção

Migração do arquivo `pontorh-sodexo_10.html` (1387 linhas, 10 telas) para o stack Lovable atual, com backend real, mantendo o visual azul Sodexo e melhorando UX/mobile/acessibilidade.

## Escopo funcional (do HTML original)

Telas identificadas:
1. **Login** (hoje com credenciais no código — grave falha de segurança)
2. **Dashboard** (KPIs + gráficos Chart.js)
3. **Alertas** (faltas repetidas sem justificativa)
4. **Nova Ocorrência** (falta, atestado, troca, folga, hora extra)
5. **Registros** (com filtros)
6. **Colaboradores** (histórico + cruzamento falta×atestado)
7. **Painel Geral** (todas ocorrências)
8. **Fechamento Semanal** (com export PDF)
9. **Resumo por Unidade**
10. **Gestores** (cadastro de acesso por unidade)

## Fase 1 — Fundação (backend + auth)

1. Ativar **Lovable Cloud** (Supabase gerenciado).
2. Auth: **email/senha + Google**, com página `/auth` e proteção via `_authenticated/`.
3. Schema no Postgres com RLS:
   - `profiles` (nome, unidade, foto)
   - `user_roles` (separado! — `admin` / `gestor` / `rh`) com função `has_role()`
   - `unidades`
   - `colaboradores` (matrícula, nome, unidade, gestor_id)
   - `ocorrencias` (tipo, data, colaborador_id, justificativa, anexo_url, criado_por, criado_em)
   - `audit_log` (quem fez o quê, quando — obrigatório para LGPD)
4. Policies: gestor só vê sua unidade; RH vê tudo; colaborador vê o próprio histórico.
5. Storage bucket para atestados/anexos com RLS.

## Fase 2 — Design system + shell

- Extrair tokens do CSS original para `src/styles.css` (paleta azul Sodexo em `oklch`, tipografia Plus Jakarta + Inter).
- Componentes shadcn customizados: `Button`, `Card`, `Badge`, `Sidebar`, `TopBar`.
- Layout: topbar + sidebar responsiva (drawer no mobile — o original não é mobile-friendly).

## Fase 3 — Rotas (uma por tela, não hash)

```
/auth
/_authenticated/dashboard        (era /)
/_authenticated/alertas
/_authenticated/ocorrencias/nova
/_authenticated/ocorrencias      (registros)
/_authenticated/colaboradores
/_authenticated/colaboradores/$id
/_authenticated/painel
/_authenticated/semana
/_authenticated/unidades
/_authenticated/gestores         (só admin/RH)
```

Cada rota com `head()` próprio, loader via `ensureQueryData`, `errorComponent` + `notFoundComponent`.

## Fase 4 — Melhorias de UX/UI

- **Mobile-first**: sidebar vira drawer, tabelas viram cards, gráficos responsivos.
- **Acessibilidade**: contraste WCAG AA, labels em inputs, foco visível, navegação por teclado.
- **Loading states**: skeletons em vez de tela em branco.
- **Empty states** ilustrados quando não há dados.
- **Toasts** (sonner) para feedback de ações.
- **Filtros persistidos** na URL (search params) — link compartilhável.
- **Export**: PDF (jsPDF) e Excel/CSV.
- **Busca global** (⌘K) para colaboradores.
- **Dark mode opcional** (via toggle no perfil).

## Fase 5 — Segurança (prioridade máxima)

- ✅ Auth server-side (nunca no cliente)
- ✅ RLS em todas as tabelas
- ✅ Roles em tabela separada + `has_role()` SECURITY DEFINER
- ✅ Validação Zod em todo input (client + server via `createServerFn`)
- ✅ Rate limit no login (função no gateway)
- ✅ Audit log automático via trigger
- ✅ HTTPS + HSTS (automático no Lovable)
- ✅ Password HIBP check ativado
- ✅ 2FA opcional para admins (fase futura)
- ✅ Política de privacidade LGPD

## Fase 6 — Deploy

- Publicar em `pontorh.lovable.app` (grátis).
- Comprar `pontorh.com.br` no Registro.br (~R$40/ano).
- Conectar domínio no painel de Domains (SSL automático).

---

## Detalhes técnicos

**Stack final:**
- TanStack Start v1 + React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui
- TanStack Query (loaders com `ensureQueryData` + `useSuspenseQuery`)
- Supabase (via Lovable Cloud): Postgres + Auth + Storage
- `createServerFn` para toda lógica sensível
- Zod para validação
- Chart.js ou Recharts (avaliar) para gráficos
- jsPDF mantido para exports

**Migração de dados:**
- Se você tem dados reais no HTML atual (localStorage?), fazemos um script de importação CSV → Postgres.

## Como quer proceder?

Isso é grande demais para um único turno. Sugiro entregarmos em **iterações**:

- **Iteração 1** (agora): Fase 1 + 2 + rota `/dashboard` funcional com dados mock.
- **Iteração 2**: Ocorrências (CRUD completo com upload de atestado).
- **Iteração 3**: Colaboradores + Painel + Alertas.
- **Iteração 4**: Semana + Unidades + Gestores + Exports.
- **Iteração 5**: Polish mobile + a11y + deploy + domínio.

Aprove o plano (ou peça ajustes) e eu começo pela Iteração 1.
