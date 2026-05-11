# Operations Control Center (CCO) - Frontend

## 1. Visão Geral do Projeto
O **Board CCO** é o sistema de front-end do Operations Control Center (Centro de Controle Operacional) de uma escola de aviação. Seu propósito principal é o gerenciamento avançado e visual de escalas de voo, permitindo a alocação de alunos, instrutores (INVAs), aeronaves e missões em "slots" (barras de voo e simuladores). O sistema garante a segurança e conformidade das operações aéreas aplicando rigorosas restrições e regras de negócio em tempo real.

## 2. Stack Tecnológico & Padrões
Este projeto foi desenvolvido focando em performance, reatividade e manutenibilidade, utilizando as seguintes tecnologias e padrões:

- **Framework Core:** Vue.js 3
- **Paradigma de Componentes:** Composition API (`<script setup>`) para encapsulamento lógico mais limpo.
- **Build Tool:** Vite, proporcionando HMR ultrarrápido e builds otimizados.
- **Roteamento:** Vue Router 4 para navegação SPA (Single Page Application).
- **Integração de API:** Axios para comunicação HTTP com o backend.
- **Estilização:** CSS Customizado e Scoped CSS dentro dos arquivos `.vue`, suportado por um arquivo global (`style.css`). Cores semânticas baseadas em atenção (Verde, Amarelo, Vermelho).
- **Gerenciamento de Estado:** State management customizado centralizado através de composables (`src/composables/useCcoStore.js`), substituindo a necessidade de Vuex/Pinia para este escopo específico.

## 3. Regras de Negócio Core
O coração do CCO reside em sua capacidade de validar e prever o estado da operação. As regras estão consolidadas majoritariamente no `useCcoStore.js`.

### Motor de Restrições
O sistema de restrições impede alocações indevidas na escala.
- **Lógica de Bloqueios:** O motor valida combinações restritas, como INVA vs. Aluno (impedindo que um aluno voe com o instrutor errado) e Aeronave vs. Missão.
- **Presets Dinâmicos (Automáticos):** Para facilitar o trabalho do operador, existem macros que geram múltiplas restrições com um clique:
  - **Instrutor Eventual:** Autoriza apenas missões específicas de voo real/simulador, bloqueando as demais.
  - **Instrutor de Solo:** Autorizado APENAS para missões de simulador (Mockups), monitorias e navegações solo. Qualquer voo real é automaticamente bloqueado.
  - **Aeronaves "Somente Diurna":** Bloqueia a alocação de aeronaves específicas em slots a partir das 17:00.
  - **Aeronaves VFR:** Permite que aeronaves analógicas voem apenas missões visuais (VFR), bloqueando o catálogo de missões IFR.

### Validação de Escalas (Conflitos e Alertas)
A função `getSlotAlerts` varre constantemente a escala em busca de infrações operacionais e regulamentares:
- **Jornada de Trabalho e Descanso:**
  - Limite máximo de jornada diária de **11 horas**.
  - Exigência de descanso interjornada mínimo de **12 horas** (entre dias comuns).
  - Regra CLT: Repouso de 12h efetivas somadas a um período de folga de 24h.
- **Conflitos de Alocação:**
  - Impede o mesmo instrutor ou aeronave de estar em duas barras diferentes simultaneamente.
  - Valida se o instrutor escalado está efetivamente "Disponível" na sua escala oficial do dia.
- **Sequenciamento Didático:**
  - Alerta sobre slots consecutivos do mesmo aluno com instrutores diferentes (quebra de linha didática).
  - Alertas específicos para missões (ex: "Buscar mentor para gate cheque", "Instrutor diferente da PS11 para a PS12").

### Previsão Preditiva de Horas (Aeronaves)
Sistema vital para controle de manutenção preventiva:
- **Cálculo Cumulativo:** O sistema não analisa apenas o dia atual. Ele mapeia todos os slots visíveis (ex: uma semana inteira), ordena cronologicamente por `data` e `hora`, e calcula o desgaste projetado.
- **Desgaste Constante:** A cada voo real alocado, subtrai-se **1.5 horas** do saldo inicial da aeronave. Simuladores (SM PCATD, SM AATD) são ignorados nesta contagem.
- **Alertas Proativos:** O marcador no card da aeronave muda dinamicamente de cor (Verde > 15h, Amarelo <= 15h, Vermelho <= 5h). Se a previsão apontar menos de **10 horas** em um slot futuro, um alerta crítico "Coordenar parada para manutenção" é disparado no slot.

## 4. Estrutura de Diretórios

```text
src/
├── assets/         # Arquivos estáticos e folhas de estilo globais (style.css)
├── components/     # Componentes de interface do Vue.js
│   ├── AeronavesScreen.vue    # Gestão de frota
│   ├── EditorScreen.vue       # (CORE) Interface principal da matriz de escalas
│   ├── RestricoesScreen.vue   # Motor visual de regras operacionais
│   └── ...                    # Outras telas e modais
├── composables/    # Lógica de negócio reutilizável e Store
│   └── useCcoStore.js         # Central de estado, regras de negócio e validações
├── constants/      # Dados estáticos e configurações
│   └── presets.js             # Dicionários de Allowlist para presets operacionais
├── icons/          # Ícones da aplicação (favicon, PWA icons)
├── router/         # Configuração de rotas da aplicação (Vue Router)
├── services/       # Módulos de integração externa
│   └── api.js                 # Configuração do Axios e interceptors
├── App.vue         # Componente raiz da aplicação
└── main.js         # Ponto de entrada (Bootstrap do Vue e injeção de dependências)
```

## 5. Setup e Execução

### Pré-requisitos
- Node.js (versão recomendada: >= 18.x)
- NPM ou Yarn

### Instalação de Dependências
Na raiz do projeto, execute:
```bash
npm install
```

### Executando em Ambiente de Desenvolvimento (Local)
Para iniciar o servidor Vite com Hot-Module Replacement (HMR):
```bash
npm run dev
```
O projeto estará disponível por padrão em `http://localhost:5173`.

### Build para Produção
Para compilar a aplicação e gerar os artefatos otimizados para deploy:
```bash
npm run build
```
Os arquivos prontos para distribuição estarão na pasta `dist/`. Para visualizar o build de produção localmente:
```bash
npm run preview
```
