---
name: rvgs-eletrica-dev
description: Padrões e diretrizes de desenvolvimento para o projeto RVGS Elétrica.
---

# RVGS Elétrica Development Skill

Este documento define os padrões técnicos e arquiteturais para o desenvolvimento do sistema RVGS Elétrica. Todo desenvolvimento futuro deve seguir estas diretrizes para garantir consistência e profissionalismo.

## 🏗️ Arquitetura e Estrutura

O projeto utiliza uma stack moderna baseada em React e Supabase.

### Estrutura de Diretórios
- **`/src/components`**: Componentes puramente visuais e reutilizáveis.
- **`/src/views`**: Páginas de alto nível (containers) que lidam com estado e lógica de negócio.
- **`/src/lib`**: Clients de terceiros e custom hooks globais.
- **`/supabase/migrations`**: Único local para scripts SQL de estrutura de banco e RLS policies.

## 💻 Padrões de Código

### React & TypeScript
- Use **Componentes Funcionais** com `React.FC`.
- **Tipagem Estrita**: Evite o uso de `any`. Defina interfaces claras em `types.ts` ou localmente se o tipo for exclusivo do componente.
- **Nomenclatura**: Use `PascalCase` para componentes e `camelCase` para funções e variáveis. Prefixe componentes administrativos com `Admin` (ex: `AdminDashboard`).

### Estilização (Tailwind CSS v4)
- Utilize as cores do tema definidas em `index.css` (ex: `text-primary`, `bg-secondary`).
- Priorize classes utilitárias do Tailwind.
- Use a classe `.glass` para efeitos de transparência e `.bg-texture` para o fundo rústico característico da marca.

### Supabase & Banco de Dados
- **Client**: Use sempre o client exportado de `@/lib/supabase`.
- **Segurança**: Garanta que as Row Level Security (RLS) policies estejam sempre configuradas para proteger dados administrativos.
- **Migrações**: Nunca altere o esquema do banco manualmente pelo dashboard do Supabase sem registrar a mudança em um arquivo `.sql` na pasta de migrações.

## 🚀 Fluxo de Trabalho Profissional

1.  **Mudanças de Schema**: Crie um novo arquivo `.sql` em `supabase/migrations` com a descrição da mudança.
2.  **Novas Views**: Adicione a rota correspondente em `App.tsx` seguindo a organização por grupos (Public/Admin).
3.  **Verificação**: Sempre rode `npm run build` antes de finalizar uma tarefa para garantir que não houve regressões de tipos ou imports.
