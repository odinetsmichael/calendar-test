export function parseFCDate(startStr: string): { date: string; time: string } {
  const tIdx = startStr.indexOf("T");
  if (tIdx === -1) {
    return { date: startStr.slice(0, 10), time: "00:00" };
  }
  const date = startStr.slice(0, 10);
  const time = startStr.slice(tIdx + 1, tIdx + 6); // "HH:MM" — ignores seconds + any offset
  return { date, time };
}

export function calcDuration(startStr: string, endStr: string): number {
  const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
  return Math.round(diffMs / 60_000);
}
