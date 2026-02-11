/**
 * Cost calculation for drive vs. fly scenarios
 * Extracted from app.js logic
 */

// Calculate total drive cost for a single leg
function calculateDriveCost(options) {
  const {
    drivingMiles,
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0,
    hoursAtDestination = 0
  } = options;
  
  if (!window.ROLES || !window.COST_PER_MILE || !window.ACCOMMODATIONS_PER_PERSON || !window.HOURS_ALLOWED_PER_DAY) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }
  
  const totalEmployees = numDirectors + numManagers + numGeneralists;
  const DRIVING_SPEED_MPH = window.DRIVING_SPEED_MPH || 70;
  
  // Employee cost per hour
  const costDirectors = numDirectors * window.ROLES.directors.hourlyRate * window.ROLES.directors.prcFactor;
  const costManagers = numManagers * window.ROLES.managers.hourlyRate * window.ROLES.managers.prcFactor;
  const costGeneralists = numGeneralists * window.ROLES.generalists.hourlyRate * window.ROLES.generalists.prcFactor;
  const totalEmployeeCostPerHour = costDirectors + costManagers + costGeneralists;
  
  // Driving calculation
  const driveHours = drivingMiles / DRIVING_SPEED_MPH; // Round trip
  const carsNeeded = Math.ceil(totalEmployees / window.VEHICLE_CAPACITY);
  const driveDistanceCost = drivingMiles * window.COST_PER_MILE.driving * carsNeeded;
  const numDays = Math.floor((driveHours + hoursAtDestination) / window.HOURS_ALLOWED_PER_DAY); 
  const driveLodging = totalEmployees * window.ACCOMMODATIONS_PER_PERSON * numDays;
  const driveEmployeeTotal = totalEmployeeCostPerHour * driveHours;
  const driveTotal = driveEmployeeTotal + driveDistanceCost + driveLodging;
  
  return {
    total: driveTotal,
    employeeCost: driveEmployeeTotal,
    distanceCost: driveDistanceCost,
    lodging: driveLodging,
    hours: driveHours
  };
}

// Calculate total fly cost for a single leg (King Air)
function calculateFlyCostKingAir(options) {
  const {
    flyingMiles,
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0,
    hoursAtDestination = 0
  } = options;
  
  if (!window.COST_PER_MILE || !window.ACCOMMODATIONS_PER_PERSON || !window.HOURS_ALLOWED_PER_DAY_FLYING) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }
  
  const totalEmployees = numDirectors + numManagers + numGeneralists;
  const FLYING_SPEED_MPH = window.FLYING_SPEED_MPH?.kingAir || 180;
  
  // Flying calculation (King Air)
  const flyHours = flyingMiles / FLYING_SPEED_MPH // Round trip
  const flyDistanceCost = flyingMiles * window.COST_PER_MILE.flyingKingAir;
  const flyNumDays = Math.floor((flyHours + hoursAtDestination) / window.HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodging = (totalEmployees + 2) * window.ACCOMMODATIONS_PER_PERSON * flyNumDays;
  const flyTotal = flyDistanceCost + flyLodging;
  
  return {
    total: flyTotal,
    distanceCost: flyDistanceCost,
    lodging: flyLodging,
    hours: flyHours
  };
}

// Calculate total fly cost for a single leg (Kodiak)
function calculateFlyCostKodiak(options) {
  const {
    flyingMiles,
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0,
    hoursAtDestination = 0
  } = options;
  
  if (!window.COST_PER_MILE || !window.ACCOMMODATIONS_PER_PERSON || !window.HOURS_ALLOWED_PER_DAY_FLYING) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }
  
  const totalEmployees = numDirectors + numManagers + numGeneralists;
  const FLYING_SPEED_MPH = window.FLYING_SPEED_MPH?.kodiak || 140;
  
  // Flying calculation (Kodiak)
  const flyHours = flyingMiles / FLYING_SPEED_MPH; // Round trip
  const flyDistanceCost = flyingMiles * window.COST_PER_MILE.flyingKodiak;
  const flyNumDays = Math.floor((flyHours + hoursAtDestination) / window.HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodging = (totalEmployees + 2) * window.ACCOMMODATIONS_PER_PERSON * flyNumDays;
  const flyTotal = flyDistanceCost + flyLodging;
  
  return {
    total: flyTotal,
    distanceCost: flyDistanceCost,
    lodging: flyLodging,
    hours: flyHours
  };
}

// Detect aircraft type from tail number
function detectAircraftType(tailNumber) {
  if (!tailNumber) return null;
  const tail = tailNumber.trim().toUpperCase();
  
  // King Air tail numbers
  if (tail === '55MN' || tail === '70MN') {
    return 'kingAir';
  }
  
  // Kodiak tail numbers
  if (tail === 'N12MN' || tail === 'N24MN') {
    return 'kodiak';
  }
  
  return null;
}

// Calculate fly cost using detected aircraft type from tail number
function calculateFlyCostByTail(options) {
  const { tailNumber } = options;
  const aircraftType = detectAircraftType(tailNumber);
  
  if (aircraftType === 'kingAir') {
    return calculateFlyCostKingAir(options);
  } else if (aircraftType === 'kodiak') {
    return calculateFlyCostKodiak(options);
  } else {
    // Fallback: choose cheaper option if aircraft type unknown
    const kingAir = calculateFlyCostKingAir(options);
    const kodiak = calculateFlyCostKodiak(options);
    return kingAir.total <= kodiak.total ? kingAir : kodiak;
  }
}

// Calculate best fly option (lower cost between King Air and Kodiak)
function calculateFlyCost(options) {
  const kingAir = calculateFlyCostKingAir(options);
  const kodiak = calculateFlyCostKodiak(options);
  return kingAir.total <= kodiak.total ? kingAir : kodiak;
}

// Export functions
window.CostCalculator = {
  calculateDriveCost,
  calculateFlyCostKingAir,
  calculateFlyCostKodiak,
  calculateFlyCost,
  calculateFlyCostByTail,
  detectAircraftType
};
