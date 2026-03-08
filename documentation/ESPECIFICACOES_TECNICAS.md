# Especificações Técnicas: Sistema RVGS Elétrica

Este documento descreve a arquitetura técnica, as linguagens de programação e a infraestrutura que compõem o sistema da RVGS Elétrica.

---

## 1. Stack Tecnológica (Frontend)

O frontend foi desenvolvido utilizando padrões de mercado para alta performance e escalabilidade:

*   **Linguagem Principal**: **TypeScript 5.8**.
    *   *Vantagem*: Garante maior segurança no código, evitando erros comuns e facilitando manutenções futuras.
*   **Framework**: **React 19**.
    *   *Vantagem*: Uma das bibliotecas mais modernas e utilizadas no mundo para criação de interfaces dinâmicas e rápidas (SPA - Single Page Application).
*   **Build Tool**: **Vite 6**.
    *   *Vantagem*: Proporciona um tempo de carregamento extremamente rápido tanto em desenvolvimento quanto para o usuário final.
*   **Estilização**: **Tailwind CSS 4**.
    *   *Vantagem*: Permite um design responsivo, moderno e de alto desempenho, com carregamento otimizado de fontes e cores.

---

## 2. Backend e Infraestrutura (BaaS)

O sistema utiliza o conceito de *Backend-as-a-Service* (BaaS), eliminando a necessidade de servidores físicos locais:

*   **Plataforma**: **Supabase**.
*   **Banco de Dados**: **PostgreSQL** (Relacional).
    *   *Capacidade*: Armazenamento seguro de contratos, leads, recibos e logs financeiros.
*   **Autenticação**: **Supabase Auth**.
    *   *Segurança*: Sistema de login criptografado com sessões seguras.
*   **Hospedagem (Deploy)**: **Vercel**.
    *   *Vantagem*: Distribuição global via CDN, garantindo que o site abra instantaneamente em qualquer lugar do mundo.

---

## 3. Requisitos de Sistema e Memória

Como o sistema é uma **SPA (Single Page Application)**, a maior parte do processamento ocorre no navegador do usuário, tornando-o extremamente leve:

*   **Processamento**: Executado no lado do cliente (Client-Side Rendering).
*   **Memória RAM**: Consumo mínimo (padrão de abas de navegador modernas). Recomenda-se um dispositivo com pelo menos 4GB de RAM para uma experiência fluida com múltiplas abas abertas.
*   **Conexão**: Requer conexão com a internet para sincronização com o banco de dados em nuvem.
*   **Compatibilidade**: Funciona em todos os navegadores modernos (Chrome, Edge, Safari, Firefox).

---

## 4. Arquitetura de Dados

O banco de dados está estruturado em tabelas relacionais:
1.  `leads`: Captura de contatos do site.
2.  `contracts`: Armazenamento de contratos e orçamentos gerados.
3.  `receipt_logs`: Histórico de emissão de recibos e comprovantes.
4.  `financial_movements`: Fluxo de caixa e indicadores do dashboard.

---

**RVGS Elétrica** - *Documentação Técnica v1.0*
