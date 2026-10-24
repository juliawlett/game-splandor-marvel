# Arquitetura das Etapas 1 e 2

## Princípio central

O motor não importa React, Next.js, DOM ou transporte de rede. Sua fronteira é uma função pura:

```text
GameState + GameAction -> TransitionResult<GameState, GameEvent[]>
```

Erros retornam códigos estáveis e mensagens em português. Uma transição válida clona o estado recebido, registra `actionId`, incrementa `revision` e devolve os eventos produzidos. Isso permite futuramente persistir comandos, reproduzir partidas e executar o mesmo fluxo para humanos e robôs.

A fronteira pública de `applyGameAction` recebe `unknown`. Antes de consultar turno, baralhos ou recursos, `validateGameAction` confirma discriminador, identificadores, campos obrigatórios, cores, níveis e mapas completos de recursos. Entradas malformadas retornam `INVALID_ACTION`; jogadores inexistentes retornam `INVALID_PLAYER_ID`.

## Módulos

- `core/types`: contratos do catálogo, jogadores, partida, ações, eventos e erros.
- `core/initialize`: valida participantes, separa e embaralha baralhos com RNG injetável/seed e prepara a mesa.
- `core/actions`: validação estrutural e redutor autoritativo das ações.
- `core/rules`: recursos, pagamentos e valores derivados.
- `core/selectors`: projeções públicas e privadas sem ordem de baralho ou reservas adversárias.
- `core/selectors/legal-actions`: ações candidatas calculadas exclusivamente pela visão autorizada.
- `game/data`: valida o JSON no carregamento, sem corrigir dados automaticamente.
- `features/game`: camada visual; consome tipos e dados, mas não contém regras.
- `features/game/local`: controlador da partida local, tradução de eventos e componentes do tabuleiro.
- `game/bots`: estratégia básica sem acesso ao `GameState` completo.
- `game/simulation`: execução sem navegador e auditoria contínua de invariantes.

## Estado e dados derivados

O estado guarda IDs de cartas recrutadas e locais conquistados. Pontos, bônus permanentes e símbolos Vingadores são calculados a partir do catálogo e do estado. Isso impede divergência entre contadores persistidos e as cartas reais.

Os baralhos completos ficam apenas no estado autoritativo. `getPlayerView` fornece somente o tamanho de cada baralho. Reservas feitas a partir da mesa mantêm identidade pública; reservas do topo mostram identidade apenas ao dono, mas preservam nível e quantidade como informação pública.

A projeção clona cartas visíveis, custos, Locais, requisitos e coleções antes de devolvê-los. Eventos retornados também são separados de `state.lastEvents`, evitando que uma camada de apresentação altere o snapshot autoritativo por referência.

O catálogo completo aparece em `GameView` porque os atributos das 90 cartas são informação pública; a ordem dos baralhos continua ausente. Uma reserva oculta mantém `cardId: null` fora da visão do dono. O bot recebe apenas essa projeção e, portanto, não consegue consultar reservas secretas nem o topo futuro.

## Pipeline do turno

1. Validar estruturalmente a ação e confirmar partida ativa, `actionId` novo e jogador ativo.
2. Validar e aplicar uma ação principal.
3. Resolver reposição, Joia do Tempo e cartão Vingadores.
4. Se houver mais de dez fichas, entrar em `AWAITING_TOKEN_RETURN`.
5. Avaliar Locais; conquistar automaticamente se houver um ou pedir escolha se houver vários.
6. Verificar Manopla, rodada final e vencedor.
7. Avançar a ordem somente após todas as pendências.

## Aleatoriedade e testes

`initializeGame` aceita uma função aleatória ou uma seed. A implementação padrão usa um PRNG pequeno e determinístico para testes; em uma futura execução autoritativa online, a fonte poderá ser substituída sem mudar as regras.

## Persistência autoritativa

O `GameState` completo existe somente no servidor e em `GameSession.stateJson`. O navegador recebe `GameView`, eventos públicos e a revisão atual. `GameActionLog` registra ação e eventos com unicidade de `actionId` por partida.

Cada comando carrega a partida pela sessão proprietária, compara `expectedRevision`, executa `applyGameAction` e grava snapshot + log na mesma transação serializável. A atualização condicionada à revisão impede sobrescrita concorrente. O cookie contém segredo aleatório HttpOnly; somente seu SHA-256 é persistido.

`useLocalGame` mantém apenas projeção autorizada, eventos e estados visuais. Na montagem consulta `/api/games/current` antes de mostrar a configuração. Criação, reinício e abandono são comandos explícitos.

## Robô básico

O robô enumera ações legais compartilhadas e aplica uma avaliação determinística: recrutamentos têm prioridade, com peso adicional para pontos, símbolos, primeira Joia do Tempo e bônus ainda ausentes; coletas são avaliadas pela necessidade das cartas conhecidas; reservas são uma alternativa de menor prioridade. Desempates podem usar o RNG injetado.

Cada decisão volta ao motor autoritativo. O endpoint `advance` calcula a visão privada do robô no servidor, decide, aplica e persiste uma ação por revisão até retornar ao humano ou encerrar. O navegador não escolhe ações do robô. Devoluções e escolhas de Local continuam sendo ações do mesmo motor.

## Simulador

`npm run simulate` executa partidas apenas entre robôs. A cada transição confirma conservação de todas as fichas, presença única das 90 cartas e integridade da ordem de turnos. O limite de turnos produz `TURN_LIMIT`, nunca um vencedor sintético.

## Extensões futuras

O motor já diferencia estado completo de visão do jogador e emite eventos. A etapa de multiplayer ainda exigirá persistência, versão esperada no comando, autenticação e transporte; nenhum deles foi simulado nesta entrega.

Os testes locais demonstram a integridade da fronteira atual, mas não tornam o motor pronto para produção ou multiplayer: persistência autoritativa, concorrência, autenticação, rate limiting e validação de versão continuam fora da Etapa 1.
