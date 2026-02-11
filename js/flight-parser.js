/**
 * Flight CSV parser and data cleaner
 * Removes invalid passengers and STP-to-STP legs
 */

// Parse CSV text into rows, handling unquoted names with commas
function parseCSV(csvText) {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find the actual header row (contains 'TAIL#' or 'TAIL')
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].toLowerCase().includes('tail')) {
      headerIdx = i;
      break;
    }
  }
  
  const headerLine = lines[headerIdx];
  const header = headerLine.split(',').map(h => h.trim().toLowerCase());
  
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Split by comma, but handle quoted fields
    let values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Reconstruct passenger names that were split by commas (LAST, FIRST → LAST, FIRST)
    // This handles unquoted CSV names like: GAUG, RYAN being split into separate columns
    const rebuiltValues = [];
    for (let j = 0; j < values.length; j++) {
      const val = values[j];
      const key = header[j] || '';
      
      // Check if this is a passenger column and the next value looks like it's part of the name
      if (key.includes('passenger') && val && j + 1 < values.length) {
        const nextVal = values[j + 1];
        // If current value has no space and next value doesn't look like a column header
        // and current value doesn't start with a space, it might be a split name
        if (!val.includes(' ') && nextVal && !nextVal.match(/^[A-Z0-9\s]+$/i)) {
          // Check if this looks like LAST, FIRST format by seeing if next column
          // could be reconstructed as a name
          const potentialName = `${val}, ${nextVal}`;
          // Only merge if it looks like a real name (has at least one letter and a comma)
          if (potentialName.match(/[A-Z],\s*[A-Z]/i)) {
            rebuiltValues.push(potentialName);
            rebuiltValues.push(''); // Skip the next value since we merged it
            j++; // Skip the next iteration
            continue;
          }
        }
      }
      rebuiltValues.push(val);
    }
    
    const row = {};
    header.forEach((key, idx) => {
      row[key] = rebuiltValues[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// Invalid passenger types to filter
const INVALID_PASSENGERS = ['miles', 'deadhead', 'training', 'aeronautics', 'deadhead, miles', 'training, aeronau', ''];
const NAVAIDS_PASSENGERS = ['kremer, nicholas', 'canelon-lander, luis'];

// Check if passenger is valid
function isValidPassenger(name) {
  if (!name || typeof name !== 'string') return false;
  const nameLower = name.toLowerCase().trim();
  return !INVALID_PASSENGERS.includes(nameLower) && nameLower.length > 0;
}

// Extract passenger names from a row (uses PASSENGER 1 through PASSENGER 14, skips base PASSENGER to avoid duplication)
function extractPassengers(row) {
  const passengers = [];
  
  // Only extract numbered passenger columns (PASSENGER 1-14) to avoid duplication with PASSENGER column
  for (let i = 1; i <= 14; i++) {
    const key = `passenger ${i}`;
    const value = row[key] || '';
    if (isValidPassenger(value)) {
      passengers.push(value.trim());
    }
  }
  
  return passengers;
}

// Check if leg is STP-to-STP (same origin and destination)
function isSTPToSTP(origin, destination) {
  const origNorm = (origin || '').toUpperCase().trim();
  const destNorm = (destination || '').toUpperCase().trim();
  const isSTP = (code) => ['KSTP', 'STP', 'MSP'].includes(code);
  
  return isSTP(origNorm) && isSTP(destNorm);
}

// Parse and clean flight log
function cleanFlightLog(csvText) {
  const rows = parseCSV(csvText);
  const cleaned = [];
  
  for (const row of rows) {
    // Get origin and destination (look for common column names)
    const origin = row.origin || row.departure || row.dep || '';
    const destination = row.destination || row.arrival || row.arr || '';
    const dateStr = row.date || row['date'] || '';
    
    // Skip STP-to-STP legs
    if (isSTPToSTP(origin, destination)) {
      continue;
    }
    
    // Extract valid passengers
    const passengers = extractPassengers(row);
    if (passengers.length === 0) {
      continue;
    }

    console.log(passengers);
    if (passengers.length === 1 && passengers.some(element => NAVAIDS_PASSENGERS.includes(element.toLowerCase().trim()))) {
      console.log("Skipping NavAids flight with passengers: " + passengers.join(", ")); // Debug log for NavAids flights
      continue; // Skips NavAids flights that only have the NAVAIDS passenger, as these are not real passengers but rather a code for certain types of flights.
    };

    // Add cleaned row
    cleaned.push({
      date: new Date(dateStr),
      dateStr: dateStr,
      origin: origin.toUpperCase().trim(),
      destination: destination.toUpperCase().trim(),
      flightTime: parseFloat(row['flight time'] || row.flight_time || 0) || 0,
      blockTime: parseFloat(row['block time'] || row.block_time || 0) || 0,
      miles: parseFloat(row.miles || 0) || 0,
      passengers: passengers,
      passengerCount: passengers.length,
      tail: row['tail#'] || row.tail || '',
      leg: row['leg#'] || row.leg || '',
      purpose: row.purpose || '',
      raw: row
    });
  }
  
  return cleaned;
}

// Export functions
window.FlightParser = {
  parseCSV,
  cleanFlightLog,
  extractPassengers,
  isValidPassenger,
  isSTPToSTP
};
