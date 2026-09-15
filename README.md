# Sistema de Gestão de Estoque para Perfumaria

## Visão Geral
Sistema de gestão de estoque composto por:
- **Aplicativo Mobile**: Foco na operação física de entrada/saída em lote
- **Painel Web**: Foco em relatórios, gestão financeira e cadastro de produtos

## Tecnologias Utilizadas

### Backend
- **Java 17+** com Spring Boot 3.x
- **MySQL 8.0** como banco de dados relacional
- **Spring Data JPA** para camada de acesso aos dados
- **Spring Security** para autenticação e autorização
- **Spring Scheduling** para jobs assíncronos
- **JavaMailSender** para envio de e-mails

### Frontend (Planejado)
- **Mobile**: React Native ou Flutter (foco em operação física)
- **Web**: React ou Vue.js com CSS Grid (foco em relatórios e gestão)

## Estrutura do Banco de Dados

O modelo relacional consiste em seis tabelas principais:

1. **usuarios** - usuários do sistema com papéis e permissões
2. **fornecedores** - informações dos fornecedores
3. **marcas** - marcas de perfumes
4. **linhas** - linhas de produtos (relacionada às marcas)
5. **produtos** - dados base dos produtos
6. **lotes** - instâncias físicas do estoque com quantidade, EAN e validade

### Relacionamentos
- Uma marca pode ter múltiplas linhas
- Uma linha pode ter múltiplos produtos
- Um produto pode ter múltiplos lotes (controle de estoque por lote)
- Um fornecedor pode suministrar múltiplos lotes
- Um usuário cria/atualiza múltiplos lotes (auditoria)

## Funcionalidades Implementadas

### ✅ Modelagem Relacional (MySQL)
- Schema completo com todas as tabelas necessárias
- Relacionamentos com chaves estrangeiras adequadas
- Índices para otimização de consultas
- Views para dashboards operacional e financeiro
- Dados de exemplo para testes iniciais

### ✅ Lógica de Servidor (Java OOP)
- **Encapsulamento de regras de negócio** em serviços dedicados:
  - `ProfitMarginService`: cálculo e atualização automática de margem de lucro
  - `InventoryService`: lógica FIFO/FEFO para entrada e saída de estoque
  - `NotificacaoService`: geração automática de alertas para estoque crítico e vencimentos
  - `EmailService`: envio de e-mail diário HTML com validação de permissões
- **Camada de repositório** usando Spring Data JPA
- **Controllers REST** expoem as funcionalidades via API
- **Entidades com validações** e regras de negócio encapsuladas

### ✅ Sistema de Notificações Assíncronas
- Fila de notificações para alertas de:
  - Estoque crítico (abaixo do nível mínimo)
  - Lotes vencendo em 30 dias
  - Lotes já vencidos
- Job agendado que verifica condições diariamente às 7:00 AM
- Job agendado que envia e-mail diário às 7:30 AM
- E-mail HTML formatado com agrupamento por tipo de notificação
- Validação de permissão (apenas admins, gerentes e auditores recebem)

### ✅ Segurança
- Proteção de rotas da API com Spring Security
- Controle de acesso baseado em papéis (ROLE_ADMIN, ROLE_OPERATOR, ROLE_MANAGER, ROLE_AUDITOR)
- Logs de acesso para auditoria (tela de login e ajustes de estoque manual)
- Autenticação via username/password com criptografia BCrypt
- Endpoints de login/logout

## Endpoints da API

### Autenticação
- `POST /api/auth/login` - Autenticação de usuário
- `POST /api/auth/logout` - Logout de usuário
- `POST /api/auth/register` - Registro de novo usuário (admin)

### Produtos
- `GET /api/produtos` - Lista todos os produtos
- `GET /api/produtos/{id}` - Busca produto por ID
- `GET /api/produtos/sku/{sku}` - Busca produto por SKU
- `POST /api/produtos` - Cria novo produto
- `PUT /api/produtos/{id}` - Atualiza produto existente
- `DELETE /api/produtos/{id}` - Exclui produto
- `GET /api/produtos/{id}/margem-lucro` - Retorna margem de lucro do produto
- `GET /api/produtos/{id}/margem-saudavel` - Verifica se margem é saudável (>30%)
- `GET /api/produtos/{id}/categoria-margem` - Retorna categoria da margem (Baixa/Média/Alta)

### Estoque
- `POST /api/estoque/entrada` - Adiciona estoque (entrada de romaneio)
- `POST /api/estoque/saida/fifo` - Remove estoque usando FIFO
- `POST /api/estoque/saida/fefo` - Remove estoque usando FEFO
- `GET /api/estoque/disponibilidade/{produtoId}` - Verifica disponibilidade
- `GET /api/estoque/lotes/{produtoId}` - Lista lotes de um produto (ordenado por validade)
- `POST /api/estoque/processar-vencimentos` - Processa lotes vencidos
- `GET /api/estoque/resumo` - Retorna resumo estatístico do estoque

## Configuração

### Variáveis de Ambiente
Configure o arquivo `src/main/resources/application.properties` com:
- Credenciais do banco de dados MySQL
- Configurações de e-mail (SMTP)
- Porta do servidor (padrão: 8080)

### Executando a Aplicação
```bash
# Clone o repositório
git clone [url-do-repositorio]

# Acesse o diretório backend
cd backend

# Execute a aplicação
./mvnw spring-boot:run
# ou
java -jar target/perfumaria-estoque.jar
```

### Banco de Dados
1. Certifique-se de que o MySQL está rodando
2. O banco de dados `perfumaria_estoque` será criado automaticamente
3. As tabelas serão criadas pelo Hibernate com base nas entidades
4. Dados de exemplo serão inseridos na inicialização

## Próximos Passos

### Frontend Mobile
- Implementar tela de entrada de romaneio (digitação do número do lote)
- Busca rápida com autocomplete por linha/marca
- Teclado numérico exclusivo para quantidades
- Dashboard alternando entre visão operacional e financeira
- FAB centralizado para entrada de caixas
- Navegação com Bottom Tabs (Início, Inventário, Histórico)

### Frontend Web
- Painel com CSS Grid para tabela de inventário principal
- Barra lateral com navegação semântica
- Componentes de relatório e gráfico
- Área de cadastro de produtos, fornecedores, marcas e linhas

### Melhorias de Segurança
- Implementar refresh tokens e JWT para autenticação API
- Adicionar rate limiting para prevenção de abuso
- Implementar criptografia de dados sensíveis em repouso
- Adicionar autenticação de dois fatores (2FA) para acessos críticos

### Monitoramento e Operações
- Adicionar health checks e métricas (Actuator, Prometheus, Grafana)
- Implementar log estruturado com ELK stack
- Configurar backup automático do banco de dados
- Adicionar testes de carga e stress

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE.md para detalhes.

---
*Sistema desenvolvido com foco em entregas iterativas rápidas, conforme especificado no escopo do projeto.*