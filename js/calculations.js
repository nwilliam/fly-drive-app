const calculateTripCosts = ({
  driveMiles,
  flyMiles,
  hoursAtDest,
  numDirectors,
  numManagers,
  numGeneralists,
  tripLegs = 1
}) => {
  const totalEmployees = numDirectors + numManagers + numGeneralists;

  const costDirectors =
    numDirectors * ROLES.directors.hourlyRate * ROLES.directors.prcFactor;
  const costManagers =
    numManagers * ROLES.managers.hourlyRate * ROLES.managers.prcFactor;
  const costGeneralists =
    numGeneralists * ROLES.generalists.hourlyRate * ROLES.generalists.prcFactor;
  const totalEmployeeCostPerHour =
    costDirectors + costManagers + costGeneralists;

  const driveHours = driveMiles / DRIVING_SPEED_MPH;
  const carsNeeded =
    Math.ceil(totalEmployees / VEHICLE_CAPACITY);
  const driveDistanceCost =
    driveMiles * COST_PER_MILE.driving * carsNeeded;
  const numDays =
    Math.floor((driveHours + hoursAtDest) / HOURS_ALLOWED_PER_DAY);
  const driveLodging =
    totalEmployees * ACCOMMODATIONS_PER_PERSON * numDays;
  const driveEmployeeTotal =
    totalEmployeeCostPerHour * driveHours;
  const driveTotal =
    driveEmployeeTotal + driveDistanceCost + driveLodging;

  const getFlightSegments = (miles, aircraftInfo) => {
    const maxSegmentMiles = aircraftInfo.departure_distance + aircraftInfo.approach_distance;
    if (miles <= maxSegmentMiles) {
      const departureMiles = miles * (aircraftInfo.departure_distance / maxSegmentMiles);
      const approachMiles = miles - departureMiles;
      return {
        departureMiles,
        cruiseMiles: 0,
        approachMiles
      };
    }
    return {
      departureMiles: aircraftInfo.departure_distance,
      cruiseMiles: miles - maxSegmentMiles,
      approachMiles: aircraftInfo.approach_distance
    };
  };

  const legs = Math.max(1, tripLegs);
  const oneWayFlyMiles = flyMiles / legs;
  const kingAirSegments = getFlightSegments(oneWayFlyMiles, AIRCRAFT_INFO.kingAir);
  const flyHoursKingAir = (
    (kingAirSegments.departureMiles / AIRCRAFT_INFO.kingAir.departure_speed_mph) +
    (kingAirSegments.cruiseMiles / AIRCRAFT_INFO.kingAir.cruise_speed_mph) +
    (kingAirSegments.approachMiles / AIRCRAFT_INFO.kingAir.approach_speed_mph)
  ) * legs;
  const flyDistanceCostKingAir =
    flyMiles * COST_PER_MILE.flyingKingAir;
  const flyNumDaysKingAir =
    Math.floor((flyHoursKingAir + hoursAtDest) / HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodgingKingAir =
    (totalEmployees + 2) * (ACCOMMODATIONS_PER_PERSON) * flyNumDaysKingAir;
  const flyTotalKingAir =
    flyDistanceCostKingAir + flyLodgingKingAir;

  const kodiakSegments = getFlightSegments(oneWayFlyMiles, AIRCRAFT_INFO.kodiak);
  const flyHoursKodiak = (
    (kodiakSegments.departureMiles / AIRCRAFT_INFO.kodiak.departure_speed_mph) +
    (kodiakSegments.cruiseMiles / AIRCRAFT_INFO.kodiak.cruise_speed_mph) +
    (kodiakSegments.approachMiles / AIRCRAFT_INFO.kodiak.approach_speed_mph)
  ) * legs;
  const flyDistanceCostKodiak =
    flyMiles * COST_PER_MILE.flyingKodiak;
  const flyNumDaysKodiak =
    Math.floor((flyHoursKodiak + hoursAtDest) / HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodgingKodiak =
    (totalEmployees + 2) * (ACCOMMODATIONS_PER_PERSON) * flyNumDaysKodiak;
  const flyTotalKodiak =
    flyDistanceCostKodiak + flyLodgingKodiak;

  return {
    totalEmployees,
    costDirectors,
    costManagers,
    costGeneralists,
    totalEmployeeCostPerHour,
    driveHours,
    carsNeeded,
    driveDistanceCost,
    numDays,
    driveLodging,
    driveEmployeeTotal,
    driveTotal,
    flyHoursKingAir,
    flyDistanceCostKingAir,
    flyNumDaysKingAir,
    flyLodgingKingAir,
    flyTotalKingAir,
    flyHoursKodiak,
    flyDistanceCostKodiak,
    flyNumDaysKodiak,
    flyLodgingKodiak,
    flyTotalKodiak
  };
};

window.calculateTripCosts = calculateTripCosts;
