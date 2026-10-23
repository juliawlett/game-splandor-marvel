# Arquitetura da Etapa 1

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
- `game/data`: valida o JSON no carregamento, sem corrigir dados automaticamente.
- `features/game`: camada visual; consome tipos e dados, mas não contém regras.

## Estado e dados derivados

O estado guarda IDs de cartas recrutadas e locais conquistados. Pontos, bônus permanentes e símbolos Vingadores são calculados a partir do catálogo e do estado. Isso impede divergência entre contadores persistidos e as cartas reais.

Os baralhos completos ficam apenas no estado autoritativo. `getPlayerView` fornece somente o tamanho de cada baralho. Reservas feitas a partir da mesa mantêm identidade pública; reservas do topo mostram identidade apenas ao dono, mas preservam nível e quantidade como informação pública.

A projeção clona cartas visíveis, custos, Locais, requisitos e coleções antes de devolvê-los. Eventos retornados também são separados de `state.lastEvents`, evitando que uma camada de apresentação altere o snapshot autoritativo por referência.

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

## Extensões futuras

O motor já diferencia estado completo de visão do jogador e emite eventos. A etapa de multiplayer ainda exigirá persistência, versão esperada no comando, autenticação e transporte — nenhum deles foi simulado nesta entrega.

Os testes locais demonstram a integridade da fronteira atual, mas não tornam o motor pronto para produção ou multiplayer: persistência autoritativa, concorrência, autenticação, rate limiting e validação de versão continuam fora da Etapa 1.
