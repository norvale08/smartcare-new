const NUMBER_WORDS: Record<string, number> = {
  // English
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,

  // Kiswahili
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
  arubaini: 40,
  hamsini: 50,
  sitini: 60,
  sabini: 70,
  themanini: 80,
  tisini: 90,
  mia: 100,
};

export function wordsToNumbers(input: string): number | null {
  if (!input) return null;

  const words = input
    .toLowerCase()
    .replace(/[^a-z\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  // If the user says single digits in sequence, concatenate them (e.g., "moja mbili sifuri" → 120)
  const DIGITS: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    sifuri: "0",
    moja: "1",
    mbili: "2",
    tatu: "3",
    nne: "4",
    tano: "5",
    sita: "6",
    saba: "7",
    nane: "8",
    tisa: "9",
  };

  if (words.length > 0 && words.every((w) => DIGITS[w] !== undefined)) {
    const joined = words.map((w) => DIGITS[w]).join("");
    const asNum = parseInt(joined, 10);
    if (!Number.isNaN(asNum)) return asNum;
  }
  let total = 0;
  let current = 0;

  for (const word of words) {
    if (!word) continue;

    if (NUMBER_WORDS[word] !== undefined) {
      const value = NUMBER_WORDS[word];
      if (value === 100 && current !== 0) {
        current *= 100;
      } else {
        current += value;
      }
    } else if (word === "and" || word === "na") {
      // skip connectors
      continue;
    } else {
      // unknown word → ignore
      continue;
    }
  }

  total += current;
  return total || null;
}
