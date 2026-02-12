/**
 * Passenger classification based on role
 * Uses exact lowercase matching against directors.json
 * Unclassified → Managers; 5% rounded up → Generalists
 */

// Simple string similarity for fuzzy matching (Levenshtein distance)
function levenshteinDistance(a, b) {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  const matrix = Array(bLower.length + 1).fill(null).map(() => Array(aLower.length + 1).fill(0));
  
  for (let i = 0; i <= aLower.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= bLower.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= bLower.length; j++) {
    for (let i = 1; i <= aLower.length; i++) {
      const indicator = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[bLower.length][aLower.length];
}

// Normalize name by converting "LAST, FIRST" to "FIRST LAST" and removing extra spaces
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let normalized = name.toLowerCase().trim();
  
  // Convert "LAST, FIRST" format to "FIRST LAST" format
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim());
    if (parts.length === 2) {
      normalized = `${parts[1]} ${parts[0]}`;
    }
  }
  
  // Clean up extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

// Fuzzy match passenger name against directors list
// Returns "director" if match found, null otherwise
function classifyPassenger(name, directorsList) {
  const nameLower = normalizeName(name);
  if (!nameLower) return null;
  
  // Exact match
  if (directorsList.includes(nameLower)) {
    return "director";
  }
  
  // Fuzzy match with threshold (distance <= 2)
  for (const director of directorsList) {
    const distance = levenshteinDistance(nameLower, director);
    if (distance <= 2) {
      return "director";
    }
  }
  
  return null; // Unclassified → will become manager
}

// Process passenger manifest and assign roles (generalist allocation happens at month level)
function classifyPassengers(passengerNames, directorsList) {
  const classified = {
    directors: [],
    managers: [],
    generalists: []
  };
  
  // Classify each passenger as director or manager
  for (const name of passengerNames) {
    if (!name || typeof name !== 'string' || !name.trim()) continue;
    
    const role = classifyPassenger(name, directorsList);
    if (role === "director") {
      classified.directors.push(name);
    } else {
      classified.managers.push(name);
    }
  }
  
  // Note: Generalist allocation is done at the month aggregation level, not per flight
  return classified;
}

// Export functions
window.PassengerClassifier = {
  classifyPassenger,
  classifyPassengers,
  levenshteinDistance
};
