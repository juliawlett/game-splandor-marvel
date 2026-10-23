# 08 — Modelagem de dados e contratos de ações

## Entidades sugeridas (TypeScript — projeto, não API oficial)

```typescript
type RegularColor = 'yellow' | 'blue' | 'orange' | 'purple' | 'red';
type TokenColor = RegularColor | 'gray' | 'green';
type CardLevel = 1 | 2 | 3;
type Five<T> = Record<RegularColor, T>;
type Seven<T> = Record<TokenColor, T>;

type VerifiedStatus = 'oficial' | 'comunidade_a_validar' | 'pendente';

interface CharacterCard {
  id: string;
  name: string;
  level: CardLevel;
  // null significa AINDA NÃO CONHECIDO; 0 significa valor de custo zero.
  cost: Five<number | null>;
  bonusColor: RegularColor | null;
  infinityPoints: number | null;
  avengersSymbols: 0 | 1 | 2 | null;
  grantsTimeStone: boolean; // true para TODOS os níveis 3
  imageAsset: string | null;
  verification: VerifiedStatus;
}

interface LocationFace {
  id: string;
  name: string | null;
  requiredBonuses: Five<number> | null;
  infinityPoints: 3;
}
interface LocationTile { id: string; faces: [LocationFace, LocationFace] }

interface PlayerState {
  id: string;
  seatIndex: number;
  type: 'HUMAN' | 'BOT';
  tokens: Seven<number>;
  purchasedCardIds: string[];
  reservedCardIds: string[]; // privada; projetar somente ao dono
  claimedLocationIds: string[];
  ownsAvengersTile: boolean;
  // bonus e points devem ser DERIVADOS das cartas/locais/cartão
}

interface MatchState {
  id: string;
  phase: 'LOBBY' | 'IN_PROGRESS' | 'FINAL_ROUND' | 'FINISHED';
  revision: number;
  activeSeatIndex: number;
  startingSeatIndex: number;
  completedRoundNumber: number;
  playerIds: string[];
  bank: Seven<number>;
  visibleCardsByLevel: Record<CardLevel, string[]>;
  hiddenDecksByLevel: Record<CardLevel, string[]>; // SOMENTE SERVIDOR
  playerStates: PlayerState[];
  locations: Array<{tileId: string; activeFaceId: string; claimedBy: string | null}>;
  avengersOwnerPlayerId: string | null;
  lastEvents: unknown[];
}
```

## Comandos — sempre validados pelo servidor

| Nome | Parâmetros essenciais |
|---|---|
| `TAKE_DIFFERENT` | `colors: RegularColor[]` |
| `TAKE_SAME` | `color: RegularColor` |
| `RESERVE_VISIBLE` | `cardId: string` |
| `RESERVE_TOP` | `level: CardLevel` |
| `RECRUIT_VISIBLE` | `cardId`, `payment: Seven<number>` |
| `RECRUIT_RESERVED` | `cardId`, `payment: Seven<number>` |
| `RETURN_EXCESS_TOKENS` | `tokensToReturn: Seven<number>` |
| `CLAIM_LOCATION` | `locationTileId` |

Todos os comandos devem incluir `matchId`, `turnId`, `actionId` idempotente, `expectedRevision` e credenciais/identidade, sem confiar em IDs livres para executar jogada de outro jogador.

## Eventos (persistidos)

- `MATCH_STARTED`, `TURN_STARTED`, `TOKENS_TAKEN`, `CARD_RESERVED`, `CARD_RECRUITED`, `CARD_REVEALED`, `TOKENS_RETURNED`, `TIME_STONE_GRANTED`, `AVENGERS_TRANSFERRED`, `LOCATION_CLAIMED`, `FINAL_ROUND_TRIGGERED`, `FINAL_ROUND_REVOKED`, `MATCH_FINISHED`.
- Guardar `sequence`, `turnId`, `actorId`, `createdAt`, `payload` validado. Persistir snapshots periodicamente para recuperação.

## Projeção do estado

- `getPublicState(match)`: esconde ordem completa dos baralhos e identidades de reservas de outros jogadores (mesmo quando a carta foi reservada de cima da mesa; por simplicidade e privacidade do produto).
- `getPlayerPrivateState(match, playerId)`: inclui os dados das próprias reservas.
- `getBotObservation(match, botId)`: inclui só informações públicas + reservas do próprio bot; nunca vaza topo/baralho ou reservas rivais.

## Dados já prontos

Arquivo [data/cartas.catalogo.json](data/cartas.catalogo.json) possui 90 registros com identificadores estáveis e nomes. **Nenhuma carta deve ser usada numa partida real até preencher e validar custo, bônus, pontos e símbolos dos Vingadores.** `null` jamais deve ser convertido automaticamente em zero.

### Validações na importação

1. Exatamente 40 cartas L1, 30 L2, 20 L3; IDs únicos.
2. `cost` contém todas as 5 cores comuns; números inteiros >=0 sem `null` antes de uso real.
3. `bonusColor` em uma das 5 cores comuns e diferente de `null` antes de uso.
4. `infinityPoints` inteiro >=0; `avengersSymbols` pertence a `{0,1,2}`.
5. `grantsTimeStone` é `true` exatamente para o nível 3.
6. Imagens apenas com licença/autorização quando forem incorporadas ao produto.

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
