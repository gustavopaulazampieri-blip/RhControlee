# PontoRH

Sistema web para registrar e acompanhar ocorrências de ponto, como faltas,
atestados, trocas, folgas e horas extras. O projeto possui autenticação, áreas
protegidas e integração com Supabase.

## Tecnologias

- React 19 e TypeScript
- TanStack Start, Router e Query
- Vite 8
- Tailwind CSS 4 e componentes Radix UI
- Supabase

## Pré-requisitos

- Node.js 20.19 ou superior (ou Node.js 22.12+)
- npm
- Um projeto Supabase configurado

## Instalação

1. Clone o repositório e entre na pasta do projeto:

   ```bash
   git clone https://github.com/SEU-USUARIO/pontorh.git
   cd pontorh
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o arquivo local de variáveis de ambiente:

   No Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   ```

   No macOS ou Linux:

   ```bash
   cp .env.example .env
   ```

4. Preencha o `.env` com os dados do seu projeto Supabase. Nunca envie esse
   arquivo ao GitHub. A `SUPABASE_SERVICE_ROLE_KEY` deve permanecer somente no
   servidor e nunca pode usar o prefixo `VITE_`.

## Banco de dados

As migrações estão em `supabase/migrations`. Para aplicá-las com a Supabase CLI:

```bash
npx supabase link --project-ref SEU_PROJECT_ID
npx supabase db push
```

Confirme as políticas de acesso e os dados antes de executar as migrações em um
projeto de produção.

## Desenvolvimento

```bash
npm run dev
```

Abra o endereço informado pelo terminal.

## Qualidade e build

```bash
npm run lint
npm run build
npm run preview
```

O comando `build` gera a versão de produção; `preview` permite testá-la
localmente após o build.

## Deploy

Este projeto usa TanStack Start com saída de servidor gerada pelo Nitro e alvo
padrão Cloudflare definido pela configuração do Lovable. No provedor escolhido:

1. conecte este repositório GitHub;
2. use `npm install` para instalar e `npm run build` para compilar;
3. cadastre as variáveis de `.env.example` no painel do provedor;
4. mantenha `SUPABASE_SERVICE_ROLE_KEY` exclusivamente como segredo do servidor;
5. publique a saída conforme a integração do provedor para aplicações
   TanStack Start/Nitro.

Se o projeto continuar conectado ao Lovable, commits enviados à branch conectada
serão sincronizados. Evite reescrever o histórico já publicado com force-push,
rebase ou squash.

## Publicação inicial no GitHub

Crie um repositório vazio no GitHub e execute nesta pasta:

```bash
git init
git add .
git commit -m "Publica versão inicial do PontoRH"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/pontorh.git
git push -u origin main
```

Antes do primeiro `git add`, confirme que `.env`, `node_modules`, `.output` e
outros arquivos locais não aparecem em `git status`.
