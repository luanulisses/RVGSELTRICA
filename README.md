<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RVGS Elétrica - Sistema de Gestão

Sistema profissional de gestão para a RVGS Elétrica, integrando controle de orçamentos (leads), agenda de serviços, gestão financeira, controle de clientes/fornecedores e geração automatizada de contratos.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS (v4)
- **Backend/Banco**: Supabase (PostgreSQL, Auth, Storage)
- **Roteamento**: React Router DOM

## 📁 Estrutura do Projeto

- `/src/components`: Componentes reutilizáveis (Layout, Landing, Admin).
- `/src/views`: Páginas principais do sistema (Públicas e Administrativas).
- `/src/lib`: Configurações de bibliotecas externas (Supabase hooks/client).
- `/supabase/migrations`: Scripts SQL de migração e estrutura do banco.

## 💻 Como Executar

**Pré-requisitos:** Node.js instalado.

1.  **Instalar dependências:**
    ```bash
    npm install
    ```
2.  **Configurar variáveis de ambiente:**
    Crie ou edite o arquivo `.env.local` com suas credenciais do Supabase:
    ```env
    VITE_SUPABASE_URL=seu_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    ```
3.  **Iniciar servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## 🛠️ Funcionalidades Admin

- **Dashboard**: Visão geral de novos leads e status financeiro.
- **Agenda**: Controle de visitas e serviços.
- **Financeiro**: Fluxo de caixa e relatórios.
- **Contratos**: Gerador dinâmico de contratos baseado em dados de clientes.
