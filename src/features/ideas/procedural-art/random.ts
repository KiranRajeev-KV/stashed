// Shared algorithm compatibility contract: FNV-1a over UTF-16 code units, then Mulberry32.
// Keep these constants and seed encoding unchanged for existing artwork.
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result = Math.imul(result ^ value.charCodeAt(index), 0x01000193);
  }
  return result >>> 0;
}

export function createRandom(ideaId: string, namespace: string) {
  let state = hash(JSON.stringify([namespace, ideaId]));
  return (min = 0, max = 1): number => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const fraction = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    return min + fraction * (max - min);
  };
}
