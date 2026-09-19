# 🧠 Brainstorm & Plano: App de To-Dos

## Contexto
O projeto é um aplicativo gerenciador de tarefas (To-Dos) focado em organização pessoal. O diferencial é ter um dashboard visualmente atraente que traga um resumo da produtividade do usuário, além de organização por categorias, tags, prioridades e datas de entrega. 
Stack definida: React (Frontend), Express (Backend), SQLite (Banco de Dados).

---

## 💡 Brainstorm: Decisões de Arquitetura e Funcionalidades

### Tópico 1: Gerenciamento de Banco de Dados (Express + SQLite)
Como vamos interagir com o banco SQLite?

#### Opção A: Usar Prisma ORM (Recomendado)
Uso do Prisma para criar esquemas tipados e gerenciar migrações.
✅ **Prós:** Desenvolvimento mais rápido, tipagem forte com TypeScript, facilidade em criar relacionamentos (Usuários, Tarefas, Tags, Categorias).
❌ **Contras:** Leve curva de aprendizado se não tiver familiaridade, adiciona dependências ao projeto.
📊 **Esforço:** Baixo

#### Opção B: Usar `sqlite3` puro ou `better-sqlite3`
Escrever consultas SQL manualmente.
✅ **Prós:** Controle total sobre as queries, sem "magia" de ORMs.
❌ **Contras:** Maior risco de SQL Injection se não feito com cuidado, difícil de manter conforme o projeto cresce, necessidade de gerenciar migrações na mão.
📊 **Esforço:** Médio

---

### Tópico 2: Estilização do Frontend (Interface Bonita)
Para atingir o objetivo de um "painel de controle bonito e premium", como estilizaremos o React?

#### Opção A: Tailwind CSS + Componentes Base (ex: shadcn/ui)
✅ **Prós:** Estilização extremamente rápida, componentes acessíveis e muito bonitos de fábrica, suporte nativo a Dark Mode.
❌ **Contras:** O código HTML pode ficar um pouco poluído com muitas classes.
📊 **Esforço:** Baixo

#### Opção B: CSS Modules ou Styled Components
✅ **Prós:** CSS isolado por componente, controle customizado pixel a pixel.
❌ **Contras:** Demora mais para criar uma interface visualmente impressionante do zero, precisamos criar todo o sistema de design (botões, inputs, cards).
📊 **Esforço:** Alto

---

### Tópico 3: Funcionalidades Extras Recomendadas
Para enriquecer seu app, sugiro pensarmos em:
1. **Filtros e Buscas:** Uma barra de pesquisa para achar tarefas por nome e filtros rápidos no dashboard para clicar na "Categoria Trabalho" e ver só elas.
2. **Paginação/Scroll Infinito:** Caso o usuário acumule milhares de tarefas.
3. **Modo Noturno (Dark Mode):** Fundamental para apps de produtividade modernos.
4. **Notificações:** Alertas visuais (toasts) no frontend quando uma tarefa expirar.

---

## 📋 Plano de Implementação (Fases)

### Fase 1: Setup e Infraestrutura
- [ ] Inicializar projeto frontend (React via Vite)
- [ ] Inicializar projeto backend (Node.js + Express)
- [ ] Configurar SQLite (e ORM se escolhido)
- [ ] Configurar rotas base e middlewares (CORS, body-parser)

### Fase 2: Banco de Dados e Autenticação
- [ ] Modelagem de Dados: Usuários, Tarefas, Categorias, Tags.
- [ ] Cadastro e Login de Usuários (Bcrypt para senhas, JWT para sessão).
- [ ] Middleware de autenticação nas rotas privadas.

### Fase 3: API RESTful (Backend)
- [ ] CRUD de Categorias e Tags.
- [ ] CRUD de Tarefas (com relacionamentos e paginação).
- [ ] Endpoint de "Estatísticas/Dashboard" (Tarefas totais, feitas hoje, atrasadas, etc).

### Fase 4: Interface e Componentes (Frontend)
- [ ] Setup do sistema de design (Cores, Tipografia, Dark Mode).
- [ ] Tela de Login / Cadastro.
- [ ] Layout Principal (Sidebar/Header) e Navegação Privada.

### Fase 5: Dashboard e Gerenciamento
- [ ] Tela de Dashboard: Gráficos ou Cards com resumos bonitos.
- [ ] Tela de Listagem de Tarefas (Kanban ou Lista).
- [ ] Modal de Criação/Edição de Tarefas (com prioridade, data, tags).

### Fase 6: Polimento
- [ ] Adicionar animações sutis (micro-interações).
- [ ] Validações de erro amigáveis para o usuário.
- [ ] Testes básicos de fluxo.

---

## 🚦 Gate Socrático (Perguntas em Aberto)
Antes de escrevermos o código, preciso entender suas preferências:
1. Podemos usar o **Prisma ORM** no backend para facilitar a comunicação com o SQLite?
2. Para criar o visual deslumbrante que você pediu, podemos utilizar **Tailwind CSS** com **shadcn/ui** ou prefere criar tudo no CSS puro?
3. Para o backend, vamos usar **TypeScript** ou **JavaScript** padrão? (Recomendo fortemente TypeScript).
