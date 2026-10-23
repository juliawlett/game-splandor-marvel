# 02 — Regras oficiais para o motor

> Este documento descreve as regras da versão Marvel, não do Splendor clássico. Em caso de dúvida, consultar os manuais vinculados ao final.

## 1. Ações principais (escolher uma no turno)

### A — Pegar três fichas diferentes

- Escolher **até três cores comuns diferentes**, exatamente três se pelo menos três cores têm estoque positivo.
- Pegar uma ficha de cada cor escolhida.
- Quando só duas cores diferentes estão disponíveis, pegar uma de cada; quando só uma cor está disponível, pegar uma.
- **Não** pegar verde (Tempo) ou cinza (S.H.I.E.L.D.) por essa ação.

### B — Pegar duas fichas iguais

- Escolher uma **cor comum**.
- Requisito: o banco precisa ter **4 ou mais** unidades dessa cor **antes** da ação.
- Retirar exatamente 2 unidades da cor; não pode substituir com fichas cinzas ou verdes.

### C — Reservar uma carta

- Reservar **uma carta pública**, ou **a carta do topo**, sem revelar, de um dos três baralhos.
- Limite pessoal: **3 reservas**. Reservas não podem ser descartadas e só saem da mão ao serem recrutadas.
- Receber **1 ficha cinza S.H.I.E.L.D.**, caso exista em estoque; é permitido reservar mesmo se não houver cinza.
- Se retirar carta pública, revelar imediatamente outra do mesmo nível quando o baralho ainda tiver cartas.
- A reserva pode continuar na mão ao terminar a partida, sem penalidade por si só.
- Cartas reservadas do topo devem permanecer ocultas aos oponentes; apenas o dono vê seus atributos.

### D — Recrutar uma carta

- Escolher **uma carta pública** da mesa ou **uma carta reservada em turno anterior** (não pode reservar e comprar como uma única ação).
- Aplicar descontos permanentes por cor (bônus de cartas já recrutadas).
- Pagar a diferença com fichas daquela cor; fichas cinzas podem substituir fichas de qualquer cor comum.
- Devolver as fichas gastas para o banco; colocar carta recrutada na área permanente do jogador.
- Acrescentar pontos, bônus e símbolos Vingadores exibidos na carta.
- Se carta veio da mesa, repor imediatamente uma carta de mesmo nível enquanto houver cartas do baralho correspondente.
- Cores verdes não podem pagar cartas e **não existem bônus verdes**.

## 2. Descontos e pagamento

Para cada `cor ∈ {amarelo, azul, laranja, roxo, vermelho}`:

```
restante[cor] = max(0, custo[cor] - bonusPermanente[cor])
```

Depois, fichas comuns e fichas cinzas cobrem o restante. O servidor pode sugerir uma forma ótima de pagamento, mas **não** deve cobrar mais do que o necessário. As fichas cinzas são consumíveis, não bônus permanente. Exemplo oficial (manual): **Rocket** custa 1 amarelo + 2 vermelhos; com bônus amarelo 1 e vermelho 1, paga-se só 1 vermelho. O custo de Rocket está confirmado; seus demais atributos ainda requerem conferência.

## 3. Limite de fichas

- Durante a ação, o jogador pode ultrapassar 10 fichas temporariamente.
- **Ao encerrar o turno** deve manter no máximo **10 fichas no total**, contando amarelo, azul, laranja, roxo, vermelho, cinza e verde.
- Excedente deve ser devolvido pelo jogador; **a ficha verde não pode ser devolvida**.
- Quantidades e cores de fichas de todos os jogadores são públicas.

## 4. Efeitos automáticos

### Local

- No final do turno, conferir se os **bônus permanentes** do jogador atendem aos requisitos dos Locais disponíveis.
- Se atender a pelo menos um, conquistar **exatamente um Local**, automaticamente ou após escolher entre múltiplos elegíveis; não consome ação.
- Cada Local dá **3 Pontos do Infinito**.
- Recursos/fichas guardados **não** contam como bônus para conquistar Local.

### Joia do Tempo (verde)

- **Todas as cartas de nível 3 possuem o ícone da Joia do Tempo**.
- O jogador recebe **1 ficha verde** ao recrutar sua **primeira carta desse nível**.
- Máximo de **1 ficha verde por jogador**; não funciona como pagamento, não possui bônus verde e não pode ser devolvida.

### Avante, Vingadores!

- Algumas cartas têm **1 ou 2 símbolos Vingadores** (quantidade individual depende do catálogo da carta).
- O primeiro jogador a somar **pelo menos 3 símbolos** recebe o cartão, que vale **3 pontos**.
- O cartão passa ao jogador que **ultrapassar** o total de símbolos do portador; empate não transfere.
- Só um jogador pode portar o cartão. Os pontos passam ao novo portador; não se exige esse cartão para vencer.

## 5. Fim e vencedor

- Um jogador dispara potencial fim de partida quando possui **16+ pontos** e **1 bônus de cada cor comum** e **1 ficha verde**.
- Terminar a rodada para que todos joguem o mesmo número de turnos.
- Se um dos candidatos perder o cartão Vingadores e, por isso, deixar de cumprir 16 pontos, **reavaliar**: a partida pode continuar.
- Elegíveis ao desempate são **somente os jogadores que satisfazem todos os requisitos** no final.
- Critérios, por ordem: (1) mais pontos; (2) entre empatados, quem possui Vingadores; (3) se nenhum empatado o possui, quem tem **menos cartas recrutadas**; (4) empate persistente = vitória compartilhada.

## 6. Pontos que exigem decisão na implementação digital

- Não há cronômetro, desconexão, desistência nem IA definidos pelo manual; são extensões do projeto.
- Se uma partida entrar em condição sem ação válida (caso extremo), formalizar regra de encerramento técnico; não confundir com regra oficial.
- A regra de escolher forma de pagamento entre fichas de cor e cinzas é decisão de interface; preservar a validade do pagamento.

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
