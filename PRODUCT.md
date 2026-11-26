# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Dona(o) e equipe pequena** de uma perfumaria que revende Natura, O Boticário e Jequiti (confirmado pelo usuário: "eu e uma equipe pequena"). Trabalham no computador (web) e no celular Android (app), muitas vezes de pé, com o produto na mão: recebem romaneios, conferem validade, atendem clientes, registram pedidos, consultam as revistas das marcas.
- Papéis no sistema (do código): ADMIN, MANAGER, OPERATOR, AUDITOR. ADMIN/MANAGER cadastram produtos, marcas e revistas; OPERATOR movimenta estoque e pedidos; AUDITOR só consulta notificações.

## Product Purpose

Sistema único de registro do estoque da loja: o que existe, em qual lote, até quando vale, o que saiu e por quê, e o que os clientes pediram. Substitui controle de cabeça e planilha. Sucesso: a equipe lança o estoque real (começa esta semana) e confia no número da tela sem conferir à mão.

## Positioning

*(Inferido do código, não confirmado pelo usuário.)* O sistema trata estoque por **lote com validade** (saída FIFO/FEFO com motivo registrado, vencimento automático), guarda as **revistas de cada marca** dentro do mesmo app (PDF convertido em páginas, leitura página a página) e o app do celular **funciona sem conexão** com fila de sincronização e tratamento de conflito. Um controle de estoque genérico não junta lote/validade de perfumaria com o catálogo de revista da marca.

## Operating Context

- Web e app Android (React Native) falam com o mesmo backend Spring Boot; sessão por cookie, com "manter conectado".
- Backend no Railway (MySQL hoje, esquema Postgres/Supabase preparado); site no Render.
- Todo o texto da interface é pt-BR.
- Catálogo atual: cerca de 290 produtos de 3 marcas, organizados em marca → linha → produto (SKU, tipo, fragrância, preço de custo e de venda).
- Entrada de estoque por romaneio; saída por pedido confirmado ou por retirada com motivo; lote vence sozinho.

## Capabilities and Constraints

- Telas web: Dashboard, Estoque, Pedidos, Revistas, Produtos, Notificações, Relatórios, Usuários. App: Hoje, Estoque, Pedidos, Revistas (em Mais), Histórico, Entrada de romaneio, Ajustes.
- Pedido só mexe no estoque quando é **confirmado**; cancelar só antes disso.
- Upload de revista (PDF) é só pela web; o app só lê.
- Preços de custo cadastrados são estimativas; vários preços de venda são provisórios e serão corrigidos pela equipe.
- Os testes de ponta a ponta e os textos do app não estão congelados, mas o comportamento (permissões, fluxos, sincronização offline) não pode mudar com o redesenho.
- Mobile: alvos de toque de 48 dp, tema claro e escuro, "reduzir movimento" respeitado.

## Brand Commitments

- Nome: **Tico e Tica · Perfumaria**; logo dos dois ovais (verde e rosa) sobrepostos.
- **Paleta vinculante** (confirmada pelo usuário): verde `#239e4b` (primário) e rosa `#dd6383` (secundário), fundo cinza-esverdeado claro, com tema escuro derivado. Não trocar as cores.
- **Telas de login vinculantes** (web e app): ficam como estão.

## Evidence on Hand

- Catálogo real de ~290 produtos já cadastrado; logo em `frontend/web/public/logo-tico-e-tica.png`.
- **Não existem**: estoque real lançado (os dados de teste foram apagados), pedidos reais, fotos de produto, depoimentos, métricas de venda. Telas devem mostrar estado vazio honesto, nunca números inventados.

## Product Principles

1. O número na tela é a verdade do estoque; nada decorativo pode parecer dado.
2. Receber, conferir e dar saída têm que ser rápidos, com uma mão, no celular.
3. Web e app contam a mesma história: mesmas palavras, mesma ordem de informação.
4. Mostrar o que exige atenção (estoque baixo, vencendo, vencido) antes do que está tudo bem.
5. Vazio, carregando e erro são telas de verdade, não buracos.

## Accessibility & Inclusion

Contraste AA nos dois temas, alvo de toque de 48 dp no app, foco visível no web, e movimento reduzido respeitado (já praticado no código; manter).
