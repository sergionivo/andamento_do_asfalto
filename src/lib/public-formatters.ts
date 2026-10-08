export function formatApproximateLength(lengthMeters: number): string {
  const rounded = Math.round(lengthMeters / 10) * 10;
  return `aproximadamente ${rounded.toLocaleString("pt-BR")} metros`;
}
