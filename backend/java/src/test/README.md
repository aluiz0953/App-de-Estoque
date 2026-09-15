# Testes Unitários - Sistema de Gestão de Estoque

Este diretório contém testes unitários para validar a lógica de negócio encapsulada nos serviços do backend.

## Estrutura de Testes

```
src/test/java/com/perfumaria/estoque/
├── service/
│   ├── ProfitMarginServiceTest.java
│   ├── InventoryServiceTest.java
│   └── notification/
│       └── service/
│           └── NotificacaoServiceTest.java
```

## Serviços Testados

### 1. ProfitMarginServiceTest.java
Testa o encapsulamento da lógica de cálculo de margem de lucro:
- Cálculo de margem lucro positivo
- Cálculo de margem zero (sem lucro)
- Cálculo de margem negativa (prejuízo)
- Tratamento de divisão por zero (preço de venda = 0)
- Atualização automática da margem de lucro
- Cálculo de lucro potencial para quantidade
- Verificação de margem saudável (>30%)
- Categorização de margem (Baixa/Média/Alta)

### 2. InventoryServiceTest.java
Testa o encapsulamento da lógica FIFO/FEFO de estoque:
- Adição de estoque (entrada de romaneio)
- Saída de estoque usando FIFO (First-In, First-Out)
  - Estoque suficiente
  - Estoque insuficiente
  - Estoque exatamente suficiente
- Saída de estoque usando FEFO (First-Expired, First-Out)
- Métodos auxiliares do Lote:
  - Verificação de vencimento
  - Verificação de vencimento iminente (30 dias)
  - Cálculo de valor total
  - Cálculo de valor de venda potencial

### 3. NotificacaoServiceTest.java
Testa a geração automática de notificações:
- Detecção de estoque crítico (abaixo do mínimo)
  - Criação de notificação quando necessário
  - Prevenção de notificações duplicadas
- Detecção de lotes vencendo em 30 dias
- Detecção de lotes já vencidos
- Processamento de notificações pendentes (marcação como PROCESSADO)

## Como Executar os Testes

```bash
# Acesse o diretório backend/java
cd backend/java

# Execute todos os testes
./mvnw test

# Execute apenas uma classe de teste específica
./mvnw test -Dtest=ProfitMarginServiceTest

# Execute testes com detalhes
./mvnw test -Dsuffix="Test"
```

## Cobertura de Testes

Os testes cobrem:
- ✅ Lógica de negócio encapsulada nos serviços
- ✅ Tratamento de casos de borda (division by zero, valores negativos, etc.)
- ✅ Integração com repositórios (usando Mockito para mocking)
- ✅ Cenários de sucesso e falha
- ✅ Verificação de interações com dependências

## Próximos Passos para Testes

1. **Testes de Integração**: Testar a camada de repositório com um banco de dados em memória (H2)
2. **Testes de Controller**: Testar os endpoints REST usando MockMvc
3. **Testes de Cenário Completo**: Testar fluxos completos como entrada → saída → geração de notificação → envio de e-mail
4. **Testes de Performance**: Testar o comportamento com grandes volumes de dados
5. **Testes de Segurança**: Testar os endpoints de autenticação e autorização

---
*Testes unitários criados para validar a implementação do backend conforme as especificações do contexto do projeto.*