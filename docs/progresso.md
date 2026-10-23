# Progresso do projeto

Atualizado em 23/10/2026.

## Etapa 1 — concluído

- [x] Inventário e leitura dos Markdown/JSON existentes.
- [x] Projeto Next.js App Router com React, TypeScript strict, Tailwind CSS, ESLint e Vitest.
- [x] Validação detalhada das 90 cartas e distribuição 40/30/20.
- [x] Inicialização de partidas para 2, 3 e 4 participantes com seed.
- [x] Estoques conforme número de participantes e quatro cartas abertas por nível.
- [x] Retirada de três cores diferentes ou duas iguais.
- [x] Reserva pública e do topo, limite de três e curinga S.H.I.E.L.D.
- [x] Recrutamento público/reservado, descontos, pagamento exato e reposição.
- [x] Limite de dez fichas e etapa obrigatória de devolução.
- [x] Controle do jogador ativo, ação principal única e idempotência.
- [x] Joia do Tempo, Vingadores, pontuação, Manopla, rodada final e desempate.
- [x] Contratos e fluxo de escolha para Locais por fixture.
- [x] Projeção pública/privada pronta para transporte futuro.
- [x] Home de desenvolvimento e catálogo local responsivo.
- [x] Testes unitários dos comportamentos centrais.
- [x] Documentação de arquitetura e decisões pendentes.
- [x] Build de produção e verificação HTTP local das rotas `/` e `/catalogo`.

## Revisão final da Etapa 1 — concluído

- [x] Validação estrutural de ações recebidas como `unknown`.
- [x] Visibilidade correta para reservas da mesa e do topo.
- [x] Eventos de reserva oculta sem `cardId` secreto.
- [x] Projeções defensivas sem referências mutáveis ao estado autoritativo.
- [x] Bloqueio de coleta vazia quando o banco comum está esgotado.
- [x] Auditoria de turnos, pagamentos, Locais, Vingadores, Tempo e rodada final.
- [x] Testes de conservação de recursos e unicidade das 90 cartas entre zonas.
- [x] Cobertura ampliada de 19 para 60 testes comportamentais.

## Limitações conhecidas

- O conteúdo de Locais está ausente, portanto a partida padrão não instancia Locais.
- A interface ainda não executa uma partida; expõe somente apresentação e catálogo.
- Nenhuma IA estratégica, rede, conta, persistência ou arte oficial foi criada.
- O balanceamento das cartas exige playtests e não representa o produto físico.

## Próximos objetivos

1. Obter e auditar o catálogo de Locais.
2. Criar tela local de configuração para 1 humano + 1–3 robôs.
3. Implementar o tabuleiro funcional consumindo somente ações do motor.
4. Criar enumeração de ações legais e um bot inicial sem acesso a dados privados.
5. Adicionar testes de integração da jornada completa de uma partida local.
