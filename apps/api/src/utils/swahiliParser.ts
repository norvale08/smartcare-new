// utils/swahiliParser.ts - Enhanced with more number support

export function swahiliToNumber(text: string): number | null {
  const cleanText = text.toLowerCase().trim();
  
  // Basic numbers 0-20
  const basicNumbers: { [key: string]: number } = {
    'sifuri': 0, 'sufuri': 0,
    'moja': 1, 'mbili': 2, 'tatu': 3, 'nne': 4, 'tano': 5,
    'sita': 6, 'saba': 7, 'nane': 8, 'tisa': 9, 'kumi': 10,
    'kumi na moja': 11, 'kumi na mbili': 12, 'kumi na tatu': 13,
    'kumi na nne': 14, 'kumi na tano': 15, 'kumi na sita': 16,
    'kumi na saba': 17, 'kumi na nane': 18, 'kumi na tisa': 19,
    'ishirini': 20
  };

  // Tens
  const tens: { [key: string]: number } = {
    'ishirini': 20, 'thelathini': 30, 'thelatini': 30,
    'arobaini': 40, 'hamsini': 50, 'sitini': 60,
    'sabini': 70, 'themanini': 80, 'tisini': 90
  };

  // Hundreds
  const hundreds: { [key: string]: number } = {
    'mia': 100, 'mia moja': 100, 'mia mbili': 200,
    'mia tatu': 300, 'mia nne': 400, 'mia tano': 500
  };

  // Check for direct match in basic numbers
  if (basicNumbers[cleanText] !== undefined) {
    return basicNumbers[cleanText];
  }

  // Check for tens
  if (tens[cleanText] !== undefined) {
    return tens[cleanText];
  }

  // Check for hundreds
  if (hundreds[cleanText] !== undefined) {
    return hundreds[cleanText];
  }

  // Handle compound numbers like "ishirini na tatu" (23)
  for (const [tenWord, tenValue] of Object.entries(tens)) {
    if (cleanText.includes(tenWord)) {
      for (const [unitWord, unitValue] of Object.entries(basicNumbers)) {
        if (unitValue < 10 && cleanText.includes(unitWord)) {
          return tenValue + unitValue;
        }
      }
      return tenValue;
    }
  }

  // Handle hundreds with compound numbers
  for (const [hundredWord, hundredValue] of Object.entries(hundreds)) {
    if (cleanText.includes(hundredWord)) {
      let total = hundredValue;
      
      // Check for tens
      for (const [tenWord, tenValue] of Object.entries(tens)) {
        if (cleanText.includes(tenWord)) {
          total += tenValue;
          
          // Check for units
          for (const [unitWord, unitValue] of Object.entries(basicNumbers)) {
            if (unitValue < 10 && cleanText.includes(unitWord)) {
              total += unitValue;
              break;
            }
          }
          return total;
        }
      }
      
      // Check for units only (like "mia moja na tatu" = 103)
      for (const [unitWord, unitValue] of Object.entries(basicNumbers)) {
        if (unitValue < 10 && cleanText.includes(unitWord)) {
          total += unitValue;
          break;
        }
      }
      
      return total;
    }
  }

  return null;
}

// Test examples
console.log(swahiliToNumber("mia moja ishirini")); // 120
console.log(swahiliToNumber("themanini")); // 80
console.log(swahiliToNumber("sabini na mbili")); // 72