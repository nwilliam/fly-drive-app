/**
 * Distance calculation utilities for flight reporting
 * Uses airports.js for STP-based flights, haversine for others
 */

// Haversine formula to calculate great-circle distance between two lat/lng points (in miles)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get airport data from airports.js (assumes AIRPORTS global exists)
function getAirportByCode(code) {
  if (!window.AIRPORTS) {
    throw new Error("AIRPORTS data not loaded. Ensure airports.js is included.");
  }
  const normalized = code.toUpperCase().trim();
  const airport = window.AIRPORTS.find(a => a.faa === normalized || a.icao === normalized);
  if (!airport) {
    throw new Error(`Airport not found: ${code}`);
  }
  return airport;
}

// Calculate flying distance between two airports
function getFlyingDistance(originCode, destCode) {
  const origin = getAirportByCode(originCode);
  const dest = getAirportByCode(destCode);
  return haversine(origin.lat, origin.lon, dest.lat, dest.lon);
}

// Calculate driving distance between two airports
// If either airport is STP, use pre-calculated driving distance from airports.js
// Otherwise, use haversine × 1.2
function getDrivingDistance(originCode, destCode) {
  const originNormalized = originCode.toUpperCase().trim();
  const destNormalized = destCode.toUpperCase().trim();
  
  // If origin is STP, use destination's drivingFromKSTP
  if (originNormalized === "KSTP" || originNormalized === "STP") {
    const dest = getAirportByCode(destCode);
    return dest.drivingFromKSTP || haversine(dest.lat, dest.lon, 44.8849, -93.2224) * 1.2;
  }
  
  // If destination is STP, use origin's drivingFromKSTP
  if (destNormalized === "KSTP" || destNormalized === "STP") {
    const origin = getAirportByCode(originCode);
    return origin.drivingFromKSTP || haversine(origin.lat, origin.lon, 44.8849, -93.2224) * 1.2;
  }
  
  // Non-STP leg: use haversine × 1.2
  const flyDist = getFlyingDistance(originCode, destCode);
  return flyDist * 1.2;
}

// Export functions
window.DistanceCalc = {
  haversine,
  getFlyingDistance,
  getDrivingDistance,
  getAirportByCode
};
