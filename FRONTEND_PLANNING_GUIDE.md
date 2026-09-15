# Guia de Planejamento do Frontend - Sistema de Gestão de Estoque para Perfumaria

Este documento fornece orientações para o desenvolvimento do frontend mobile e web baseado no backend API que foi implementado.

## 📱 Visão Geral da Integração Frontend-Backend

O backend expõe uma API RESTful completa em `http://localhost:8080/api` com os seguintes módulos:
- **Autenticação**: `/api/auth/*`
- **Produtos**: `/api/produtos/*`
- **Estoque**: `/api/estoque/*`
- **Notificações**: `/api/notificacoes/*` (primariamente para visualização)

## 🎨 Aplicação do Design System Especificado

### Cores
- **Primária Roxo Púrpura**: `#5B2C6F` - Use para headers, botões primários, links importantes
- **Secundária Dourado Suave**: `#D4AF37` - Use para botões secundários, destaques, ícones ativos
- **Fundo Cinza Gelo**: `#F8F9FA` - Use como fundo geral da aplicação
- **Superfícies Branco**: `#FFFFFF` - Use para cards, modais, formulários
- **Texto Chumbo Escuro**: `#2C3E50` - Use para texto principal, corpo
- **Alertas de Erro/Vencimento/Ruptura**: `#E74C3C` - Use para notificações críticas, textos de alerta
- **Sucesso**: `#2ECC71` - Use para confirmações, textos de sucesso

### Tipografia
- **Fonte**: Inter ou Roboto
- **Headers**: Semibold (18-24px)
- **Corpo**: Regular (14-16px)
- **OBRIGATÓRIO**: Ativar Tabular Figures (números monoespaçados) para listas numéricas de SKUs, EANs e quantidades

## 📱 Aplicativo Mobile - Funcionalidades e Integração com API

### 1. **Entrada de Romaneio (Sem Câmera)**
**Fluxo**:
1. Usuário abre o app e navega para "Entrada de Estoque"
2. Usuário digita o "Número do Lote da Caixa"
3. App apresenta barra de busca rápida com autocomplete por Linha/Marca
4. Usuário seleciona produto
5. Teclado numérico exclusivo aparece para digitação da quantidade
6. App confirma e envia para backend

**Integração com API**:
- **Busca de Produtos**: `GET /api/produtos?search={termo}` (implementar filtro por nome/SKU/marca/linha)
- **Entrada de Estoque**: `POST /api/estoque/entrada`
  ```json
  {
    "produtoId": 123,
    "numeroLote": "LOTE-12345",
    "quantidade": 50,
    "dataValidade": "2025-12-31",
    "precoCusto": 25.50,
    "fornecedorId": 456,
    "localizacaoArquivo": "Prateleira A1",
    "usuarioId": 789
  }
  ```

### 2. **Dashboard Físico vs. Financeiro**
**Visão Operacional (Rupturas e Vencimentos)**:
- **Endpoint**: `GET /api/estoque/resumo` (dados resumidos)
- **Views do Banco**: 
  - `view_estoque_operacional` - Para produtos com estoque mínimo ou vencendo
  - Pode ser exposta via endpoint específico ou calculada no frontend

**Visão Financeira (Capital Empatado)**:
- **Endpoint**: `GET /api/estoque/resumo` 
- **View do Banco**: `view_estoque_financeiro` - Para valor total do estoque e lucro potencial

### 3. **Navegação**
- **Bottom Tabs**: Início, Inventário, Histórico
- **FAB (Floating Action Button)**: Centralizado para acionar entrada de caixas (chama a tela de entrada de romaneio)
- **Listas Horizontais**: Com botões de swipe para ações rápidas (editar, excluir, detalhes)
- **Bottom Sheets**: Para filtros dinâmicos com Chips visuais

### 4. **Tela de Inventário**
- Lista de produtos com:
  - SKU (com Tabular Figures)
  - Nome do produto
  - Marca/Linha
  - Quantidade total em estoque
  - Valor total em estoque
  - Indicadores de vencimento (cores)
- Ações por item: Ver lotes, Editar produto, Exibir movimentações

### 5. **Tela de Lotes do Produto**
- Lista de lotes para um produto específico:
  - Número do lote
  - Quantidade
  - Data de validade (com cor baseada na proximidade)
  - Localização
  - Status (ativo, vencido, reservado)
- **Endpoint**: `GET /api/estoque/lotes/{produtoId}`

## 💻 Painel Web - Funcionalidades e Integração com API

### 1. **Layout Principal**
- **CSS Grid Layout**: Para a tabela de inventário principal
- **Elementos Semânticos HTML5**: 
  - `<header>` para cabeçalho
  - `<nav>` para barra lateral
  - `<main>` para conteúdo principal
  - `<aside>` para painéis laterais
  - `<footer>` para rodapé

### 2. **Barra Lateral**
- Navegação entre módulos:
  - Dashboard (visão geral)
  - Produtos (CRUD completo)
  - Estoque (movimentações, lotes)
  - Fornecedores (CRUD)
  - Marcas (CRUD)
  - Linhas (CRUD)
  - Relatórios
  - Configurações

### 3. **Tela de Produtos (CRUD Completo)**
- **Listagem**: Tabela com paginação, busca, filtros
  - Colunas: SKU, Nome, Marca, Linha, Preço Custo, Preço Venda, Margem de Lucro, Estoque Mínimo/ Máximo, Quantidade Total
  - **Tabular Figures obrigatória** nas colunas numéricas
- **Formulário de Cadastro/Edição**:
  - Campos: SKU, Nome, Descrição, Marca (select), Linha (select dependente da marca), 
    Preço Custo, Preço Venda, Estoque Mínimo, Estoque Máximo
  - Validação em tempo real
  - Cálculo automático da margem de lucro (chamando `/api/produtos/{id}/margem-lucro` ou calculando frontend)
- **Ações**: Visualizar detalhes (mostra lotes, movimentações), Editar, Exibir movimentações, Excluir

### 4. **Tela de Estoque/Movimentações**
- **Entrada de Estoque**: Formulário similar ao mobile (mas com mais campos visíveis)
- **Saída de Estoque**: 
  - Seleção de produto
  - Quantidade
  - Método: FIFO, FEFO, LIFO (radio buttons)
  - Usuário responsável (select de usuários com papel OPERATOR ou MANAGER)
- **Histórico de Movimentações**: Tabela com data, tipo, quantidade, usuário, lote afetado

### 5. **Tela de Fornecedores, Marcas e Linhas**
- CRUD padrão para cada entidade
- Relacionamentos visíveis:
  - Em Marcas: mostrar linhas associadas
  - Em Linhas: mostrar marca e produtos associados
  - Em Fornecedores: mostrar lotes fornecidos

### 6. **Dashboard e Relatórios**
- **Dashboard Principal**:
  - Cards de resumo: Total produtos, Total lotes ativos, Valor total estoque, Lucro potencial
  - Gráfico: Estoque por marcal/linha (pizza ou barra)
  - Tabela: Produtos com estoque baixo (dados de `view_estoque_operacional`)
  - Tabela: Produtos vencendo em 30 dias (dados de `view_estoque_operacional`)
- **Relatórios**:
  - Relatório de vencimentos (filtro por data)
  - Relatório de giro de estoque
  - Relatório de lucro por produto/marca
  - Relatório de auditoria (acessos ao sistema)

### 7. **Tela de Notificações**
- Lista de notificações do sistema:
  - Tipo (ícone + cor: crítico=vermelho, vencendo=laranja, vencido=vermelho escuro)
  - Título
  - Descrição
  - Data/hora
  - Ação (marcar como lida, excluir)
- **Endpoint**: `GET /api/notificacoes` (com filtros por tipo, status, data)

## 🔐 Autenticação e Autorização

### Fluxo de Login
1. Usuário insere username e password
2. App envia `POST /api/auth/login` com `{username, password}`
3. Backend retorna token ou dados do usuário
4. App armazena dados do usuário (secure storage)
5. App inclui token no header `Authorization: Bearer {token}` nas requisições subsequentes
6. Logout: `POST /api/auth/logout` e limpar armazenamento local

### Controle de Acesso baseado em papéis
- **ADMIN**: Acesso total a todos os endpoints
- **MANAGER**: Acesso a produtos, estoque, relatórios, visualização de usuários
- **OPERATOR**: Acesso principalmente a entrada/saída de estoque e visualização básica
- **AUDITOR**: Acesso a relatórios, visualização de produtos/estoque, logs de auditoria

**Endpoints Protegidos** (conforme implementado no SecurityConfig):
- `GET/POST/PUT/DELETE /api/produtos/*` → ADMIN, MANAGER
- `POST /api/estoque/entrada` → ADMIN, OPERATOR, MANAGER  
- `POST /api/estoque/saida/*` → ADMIN, OPERATOR, MANAGER
- `GET /api/estoque/lotes/*` → ADMIN, OPERATOR, MANAGER
- `GET /api/estoque/resumo` → ADMIN, MANAGER
- `GET /api/notificacoes/*` → ADMIN, MANAGER, AUDITOR
- `GET/POST/PUT/DELETE /api/usuarios/*` → ADMIN apenas

## 📡 Padrões de Chamada API

### Headers Padrão
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

### Tratamento de Erros
- **400 Bad Request**: Dados inválidos (mostrar mensagem de erro do campo)
- **401 Unauthorized**: Redirecionar para login
- **403 Forbidden**: Mostrar mensagem "Acesso negado"
- **404 Not Found**: Mostrar mensagem "Recurso não encontrado"
- **500 Internal Server Error**: Mostrar mensagem genérica de erro e logar para suporte

### Loading States
- Mostrar indicadores de carregamento durante chamadas API
- Desabilitar botões durante operações em andamento
- Usar toast/snackbar para feedback de sucesso/erro

## 🔄 Fluxos de Trabalho Principais

### Fluxo de Entrada de Romaneio (Mobile)
1. Usuário toca no FAB → navega para tela de entrada
2. Usuário digita número do lote
3. App chama busca de produtos enquanto usuário digita (debounce 300ms)
4. Usuário seleciona produto da lista
5. Teclado numérico aparece para quantidade
6. Usuário confirma quantidade
7. App valida campos obrigatórios
8. App envia `POST /api/estoque/entrada`
9. Em sucesso: mostrar confirmação, limpar form, voltar ao inventário
10. Em erro: mostrar mensagem de erro específica

### Fluxo de Consulta de Estoque (Web/Mobile)
1. Usuário abre tela de inventário
2. App mostra loading state
3. App chama `GET /api/produtos` para listar produtos
4. Para cada produto, app chama `GET /api/estoque/lotes/{produtoId}` para obter total (ou usa endpoint resumido)
5. App renderiza lista com:
   - SKU (Tabular Figures)
   - Nome
   - Marca/Linha
   - Quantidade total
   - Indicador de cor para estoque baixo/vencendo
6. Usuário pode tocar em item para ver detalhes

### Fluxo de Saída de Estoque (Mobile/Web)
1. Usuário seleciona produto
2. App mostra opções de método: FIFO, FEFO, LIFO
3. Usuário digita quantidade
4. App calcula impacto estimado (mostra quais lotes serão afetados)
5. Usuário confirma
6. App envia `POST /api/estoque/saida/{metodo}` com params
7. Em sucesso: atualizar lista, mostrar confirmação
8. Em erro (estoque insuficiente): mostrar mensagem específica

## 📱 Considerações Específicas do Mobile

### Teclado
- **Exclusivamente numérico** para campos de quantidade
- **Navigable** entre campos (próximo campo ao pressionar "Enter" ou "Done")
- **Validação em tempo real** (mínimo 1, máximo razoável baseado no produto)

### Busca e Autocomplete
- **Debounce de 300ms** para evitar chamadas excessivas
- **Mínimo de 2 caracteres** para iniciar busca
- **Resultados limitados a 10-15** para performance
- **Exibir**: SKU, Nome do produto, Marca

### Sincronização e Offline
- Considerar implementação de fila local para operações quando offline
- Sincronizar quando conexão for restaurada
- Indicador visual de status de conexão

## 💻 Considerações Específicas do Web

### Layout Responsivo
- **Mobile First**: Layout que funciona bem em telas pequenas
- **Expandir para Desktop**: Painéis laterais que podem ser recolhidos
- **Tabelas**: Rolagem horizontal em telas menores, expansão em telas maiores

### Performance
- **Virtual Scrolling** para listas grandes de produtos/lotes
- **Lazy Loading** de imagens (se aplicável)
- **Cache** de dados raramente alterados (marcas, linhas, fornecedores)
- **Requests em paralelo** quando possível (ex: buscar produtos e suas contagens de lotes simultaneamente)

### Acessibilidade
- **ARIA labels** para todos os elementos interativos
- **Navegação por teclado** completa
- **Contraste de cores** adequado (verificar WCAG AA)
- **Tamanho de toque adequado** para botões e elementos interativos

## 🧪 Integração com Testes

### Testes de Ponta a Ponta (E2E)
- Simular fluxos completos usando ferramentas como Cypress ou Playwright
- Testar: login → entrada de romaneio → saída de estoque → verificação de notificação
- Testar diferentes papéis de usuário

### Testes de Unidade de Serviços Frontend
- Testar serviços de API (wrap das chamadas fetch/axios)
- Testar lógica de negócio do frontend (formatação, cálculos, validações)

## 📞 Próximos Passos Sugeridos

### Fase 1: Planejamento e Setup
1. Escolher tecnologias:
   - Mobile: React Native ou Flutter
   - Web: React ou Vue.js com CSS Grid
   - Estado: Redux/Zustand (React) ou Pinia (Vue)
   - HTTP: Axios ou Fetch API
2. Criar estrutura de projetos
3. Configurar autenticação e serviço de API básico
4. Implementar tela de login

### Fase 2: Funcionalidades Core
1. Implementar tela de entrada de romaneio (mobile) / formulário de entrada (web)
2. Implementar lista de produtos com busca
3. Implementar visualização de detalhes do produto (mostrando lotes)
4. Implementar navegação básica (tabs mobile, sidebar web)

### Fase 3: Funcionalidades Avançadas
1. Implementar dashboard com visões operacional/financeira
2. Implementar sistema de notificações
3. Implementar filtros e relatórios
4. Implementar CRUD completo para entidades secundárias

### Fase 4: Refinamento e Testes
1. Implementar validações e tratamento de erros robustos
2. Adicionar loading states e feedback visual
3. Realizar testes de usabilidade
4. Otimizar performance
5. Preparar para deploy

## 📚 Recursos Referenciais

### Bibliotecas Sugeridas
- **State Management**: Redux Toolkit (React) ou Pinia (Vue)
- **HTTP Client**: Axios com interceptors para auth
- **Form Handling**: React Hook Form ou Vuelidate
- **UI Components**: 
  - Mobile: React Native Paper ou Flutter Material
  - Web: Ant Design ou Material UI
- **Charts**: Recharts ou Chart.js para dashboards
- **Date Handling**: date-fns ou Luxon

### APIs do Backend Disponíveis
Consulte o `IMPLEMENTATION_SUMMARY.md` para a lista completa de endpoints e seus parâmetros específicos.

### Fluxo de Dados Recomendado
```
[UI Layer] 
  ↓ (User Actions)
[Application State] 
  ↓ (API Service Layer)
[API Calls] 
  ↓ (Backend Services)
[Database] 
  ↓ (Business Logic)
[Response Data]
  ↓ (State Updates)
[UI Re-render]
```

---
*Este guia foi criado baseado no backend implementado em Java/Spring Boot, seguindo as especificações de Design System e Regras de Negócio fornecidas no contexto do projeto.*