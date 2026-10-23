# 07 — Modos contra robô e multiplayer (proposta do produto)

> Os modos digitais e o comportamento dos bots **não fazem parte do manual físico**; são decisões de arquitetura e UX. Ambos devem usar o **mesmo motor de regras**.

## Modos suportados

| Modo | Configuração sugerida | Participantes totais |
|---|---|---:|
| Contra robô | 1 humano + 1, 2 ou 3 bots | 2–4 |
| Multiplayer | 2, 3 ou 4 humanos em sala privada | 2–4 |
| Misto | 2 humanos + 1–2 bots; 3 humanos + 1 bot | 3–4 |

Não criar regra oficial de jogo para 1 participante sozinho: no modo solo digital, um bot ocupa pelo menos o segundo assento.

## Criar partida contra robôs

1. Escolher número total de assentos (2, 3, 4).
2. Preencher slots restantes com robôs e escolher dificuldade (`EASY`, `NORMAL`, `HARD`).
3. Preparar baralhos/fichas/locais no motor; sorteio da ordem de turno é uma decisão do produto.
4. Jogadora age; robô recebe estado visível + sua própria mão privada, escolhe ação **legal**, executa via mesmo validador.
5. Não dar informações secretas do topo dos baralhos aos robôs, mesmo que o servidor conheça a ordem real.

### IA — evolução em três níveis

- **Easy:** escolhe dentre ações legais com pesos simples (valoriza coletar fichas, adquirir cartas baratas).
- **Normal:** estima descontos futuros, necessidades das cinco cores, primeiros níveis 3 e pontuação.
- **Hard:** busca curta (`beam search` ou Monte Carlo com informação imperfeita) considerando pontos, bônus, tempo, competição por Locais e controle de Vingadores.
- Todos os níveis devem usar somente **informação autorizada** (sem espiar reserva cega de adversários e ordem do baralho).
- Os robôs compartilham o limite de 10 fichas e recebem apenas uma ação principal por turno.

## Multiplayer por salas

1. Jogador cria uma sala com `roomCode` aleatório e autorização para entrar.
2. Convidados entram; dono adiciona/remove robôs dos slots vagos.
3. O anfitrião inicia com 2–4 ocupantes e configurações fixadas.
4. O servidor mantém a verdade: baralhos, rng/seed, jogadas, reservas ocultas, efeitos e vitórias.
5. Cada cliente envia **comandos**, nunca estados finais calculados.
6. O servidor valida o turno, publica evento e snapshot projetado para cada cliente.

## Reconexão, latência e desistência (decisões pendentes)

- Revalidar identidade no retorno e disponibilizar snapshot **com visão privada correta**.
- `turnId` e `actionId` impedem ações atrasadas/duplicadas.
- Cronômetro **opcional**; se houver timeout, política explicitada (bot assume? passa turno? desistência?). Não alterar regras oficialmente sem marcar como variante digital.
- Preservar status da sala no banco de dados para que desconexão não destrua uma partida em andamento.
- Logs devem registrar somente identificadores/ações, nunca publicar mãos privadas a todos.

## Critérios de UX

- Jogador da vez destacado; ações ilegais desabilitadas com explicação.
- Contadores visíveis de fichas, bônus de cada cor, símbolos Vingadores, pontos, níveis dos baralhos e requisitos da Manopla.
- **Reserva cega é privada**, com quantidade pública para os demais.
- Tela dedicada para devolver fichas além do limite e para selecionar Local dentre vários elegíveis.
- Replay/observador, chat, ranking e matchmaking são pós-MVP (não fazem parte das regras).

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
