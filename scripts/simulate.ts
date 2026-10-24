import { runSimulationBatch } from "../src/game/simulation/simulate";

function numericArgument(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  const parsed = value ? Number(value) : fallback;
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`--${name} deve ser um inteiro positivo.`);
  return parsed;
}

const games = numericArgument("games", 100);
const turnLimit = numericArgument("turns", 500);
const results = runSimulationBatch(games, turnLimit);
const totals = results.reduce((summary, result) => {
  summary[result.status] += 1;
  summary.turns += result.turns;
  return summary;
}, { FINISHED: 0, TURN_LIMIT: 0, INTERRUPTED: 0, turns: 0 });

console.log(`Simulações: ${games}`);
console.log(`Concluídas: ${totals.FINISHED}`);
console.log(`Inconclusivas por limite: ${totals.TURN_LIMIT}`);
console.log(`Interrompidas: ${totals.INTERRUPTED}`);
console.log(`Média de turnos: ${(totals.turns / games).toFixed(1)}`);

for (const result of results.filter((item) => item.status !== "FINISHED")) {
  console.log(`seed=${result.seed} jogadores=${result.players} status=${result.status} motivo=${result.reason}`);
}

if (totals.INTERRUPTED > 0) process.exitCode = 1;
