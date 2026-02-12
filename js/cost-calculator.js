/**
 * Cost calculation for drive vs. fly scenarios
 * Extracted from app.js logic
 */

// Calculate employee cost per hour
function calculateEmployeeCostPerHour(options) {
  const {
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0
  } = options;

  if (!window.ROLES) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }

  const directors = numDirectors * window.ROLES.directors.hourlyRate * window.ROLES.directors.prcFactor;
  const managers = numManagers * window.ROLES.managers.hourlyRate * window.ROLES.managers.prcFactor;
  const generalists = numGeneralists * window.ROLES.generalists.hourlyRate * window.ROLES.generalists.prcFactor;
  const total = directors + managers + generalists;

  return {
    directors,
    managers,
    generalists,
    total
  };
}

function getFlightSegments(flyingMiles, aircraftInfo) {
  const cruiseMiles = Math.round(Math.max(0, flyingMiles - aircraftInfo.departure_distance - aircraftInfo.approach_distance));
  let departureMiles = 0;
  let approachMiles = 0;

  if (cruiseMiles === 0) {
    departureMiles = Math.round(
      flyingMiles * (aircraftInfo.departure_distance / (aircraftInfo.departure_distance + aircraftInfo.approach_distance))
    );
    approachMiles = Math.round(flyingMiles - departureMiles);
  } else {
    departureMiles = aircraftInfo.departure_distance;
    approachMiles = aircraftInfo.approach_distance;
  }

  return {
    cruiseMiles,
    departureMiles,
    approachMiles
  };
}

// Calculate total drive cost for a single leg
function calculateDriveCost(options) {
  const {
    drivingMiles,
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0,
    hoursAtDestination = 0,
    roundTrip = false
  } = options;
  
  if (!window.COST_PER_MILE || !window.ACCOMMODATIONS_PER_PERSON || !window.HOURS_ALLOWED_PER_DAY || !window.VEHICLE_CAPACITY) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }
  
  const totalEmployees = numDirectors + numManagers + numGeneralists;
  const drivingSpeedMph = window.DRIVING_SPEED_MPH || 70;
  const tripMultiplier = roundTrip ? 2 : 1;
  const totalMiles = drivingMiles * tripMultiplier;

  const employeeCostPerHour = calculateEmployeeCostPerHour({
    numDirectors,
    numManagers,
    numGeneralists
  });
  
  // Driving calculation
  const driveHours = totalMiles / drivingSpeedMph;
  const carsNeeded = Math.ceil(totalEmployees / window.VEHICLE_CAPACITY);
  const driveDistanceCost = totalMiles * window.COST_PER_MILE.driving * carsNeeded;
  const numDays = Math.floor((driveHours + hoursAtDestination) / window.HOURS_ALLOWED_PER_DAY); 
  const driveLodging = totalEmployees * window.ACCOMMODATIONS_PER_PERSON * numDays;
  const driveEmployeeTotal = employeeCostPerHour.total * driveHours;
  const driveTotal = driveEmployeeTotal + driveDistanceCost + driveLodging;
  
  return {
    total: driveTotal,
    employeeCost: driveEmployeeTotal,
    distanceCost: driveDistanceCost,
    lodging: driveLodging,
    hours: driveHours,
    totalMiles,
    carsNeeded,
    numDays,
    employeeCostPerHour
  };
}

// Calculate total fly cost for a single leg (King Air)
function calculateFlyCostKingAir(options) {
  return calculateFlyCostDetailed({
    ...options,
    aircraftType: 'kingAir'
  });
}

// Calculate total fly cost for a single leg (Kodiak)
function calculateFlyCostKodiak(options) {
  return calculateFlyCostDetailed({
    ...options,
    aircraftType: 'kodiak'
  });
}

function calculateFlyCostDetailed(options) {
  const {
    flyingMiles,
    numDirectors = 0,
    numManagers = 0,
    numGeneralists = 0,
    hoursAtDestination = 0,
    roundTrip = false,
    aircraftType
  } = options;

  if (!window.COST_PER_MILE || !window.ACCOMMODATIONS_PER_PERSON || !window.HOURS_ALLOWED_PER_DAY_FLYING || !window.AIRCRAFT_INFO) {
    throw new Error("Constants not loaded. Ensure constants.js is included.");
  }

  const aircraftInfo = window.AIRCRAFT_INFO[aircraftType];
  if (!aircraftInfo) {
    throw new Error(`Unknown aircraft type: ${aircraftType}`);
  }

  const totalEmployees = numDirectors + numManagers + numGeneralists;
  const tripMultiplier = roundTrip ? 2 : 1;

  const segments = getFlightSegments(flyingMiles, aircraftInfo);
  const flyHours = (
    (segments.departureMiles / aircraftInfo.departure_speed_mph) +
    (segments.approachMiles / aircraftInfo.approach_speed_mph) +
    (segments.cruiseMiles / aircraftInfo.cruise_speed_mph)
  ) * tripMultiplier;

  const costPerMile = aircraftType === 'kingAir'
    ? window.COST_PER_MILE.flyingKingAir
    : window.COST_PER_MILE.flyingKodiak;

  const flyDistanceCost = flyingMiles * costPerMile * tripMultiplier;
  const flyNumDays = Math.floor((flyHours + hoursAtDestination) / window.HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodging = (totalEmployees + 2) * window.ACCOMMODATIONS_PER_PERSON * flyNumDays;
  const flyTotal = flyDistanceCost + flyLodging;

  return {
    total: flyTotal,
    distanceCost: flyDistanceCost,
    lodging: flyLodging,
    hours: flyHours,
    numDays: flyNumDays,
    segments,
    tripMultiplier,
    costPerMile
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
  calculateEmployeeCostPerHour,
  calculateDriveCost,
  calculateFlyCostKingAir,
  calculateFlyCostKodiak,
  calculateFlyCost,
  calculateFlyCostByTail,
  calculateFlyCostDetailed,
  detectAircraftType
};
