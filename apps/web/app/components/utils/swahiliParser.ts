// ----------------- Swahili Parser -----------------
const swahiliNumbers: Record<string, number> = {
  sifuri: 0,
  moja: 1,
  mbili: 2,
  tatu: 3,
  nne: 4,
  tano: 5,
  sita: 6,
  saba: 7,
  nane: 8,
  tisa: 9,
  kumi: 10,
  ishirini: 20,
  thelathini: 30,
  arobaini: 40,
  hamsini: 50,
  sitini: 60,
  sabini: 70,
  themanini: 80,
  tisini: 90,
  mia: 100,
  elfu: 1000,
};

export function swahiliToNumber(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w !== "na");
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;

    if (word === "mia") {
      const nextWord = words[i + 1];
      if (nextWord && swahiliNumbers[nextWord] !== undefined) {
        current += swahiliNumbers[nextWord] * 100;
        i++;
      } else {
        current += 100;
      }
    } else if (word === "elfu") {
      const nextWord = words[i + 1];
      if (nextWord && swahiliNumbers[nextWord] !== undefined) {
        total += swahiliNumbers[nextWord] * 1000;
        i++;
      } else {
        total += 1000;
      }
    } else if (swahiliNumbers[word] !== undefined) {
      current += swahiliNumbers[word];
    }
  }

  total += current;
  return total > 0 ? total : null;
}
