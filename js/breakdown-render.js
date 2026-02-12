const renderBreakdownTable = (dom, data, trip, inputs) => {
  const {
    numDirectors,
    numManagers,
    numGeneralists
  } = inputs;

  dom.breakdownTable.innerHTML = `
  <tr><th colspan="3" class="table-section-header">Employee Costs per Hour</th></tr>
  <tr>
    <td>${ROLES.directors.shortLabel}
        ${tooltip(`Average ${ROLES.directors.shortLabel} compensation per hour is $${ROLES.directors.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA MnDOT study has determined that the value these individuals create is worth a Value Factor of ${ROLES.directors.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Value Factor times the average hourly compensation.`)}
    </td>
    <td>${ROLES.directors.hourlyRate.toFixed(2)}/hr cost x ${ROLES.directors.prcFactor} Value Factor x ${numDirectors} ${ROLES.directors.shortLabel.toLowerCase()} traveling</td>
    <td>$${data.costDirectors.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr>
    <td>${ROLES.managers.shortLabel}
      ${tooltip(`Average ${ROLES.managers.shortLabel} compensation per hour is $${ROLES.managers.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA MnDOT study has determined that the value these individuals create is worth a Value Factor of ${ROLES.managers.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Value Factor times the average hourly compensation.`)}
    </td>
    <td>${ROLES.managers.hourlyRate.toFixed(2)}/hr cost x ${ROLES.managers.prcFactor} Value Factor x ${numManagers} ${ROLES.managers.shortLabel.toLowerCase()} traveling</td>
    <td>$${data.costManagers.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr>
    <td>${ROLES.generalists.shortLabel}
      ${tooltip(`Average ${ROLES.generalists.shortLabel} compensation per hour is $${ROLES.generalists.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA MnDOT study has determined that the value these individuals create is worth a Value Factor of ${ROLES.generalists.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Value Factor times the average hourly compensation.`)}</td>
    <td>${ROLES.generalists.hourlyRate.toFixed(2)}/hr cost x ${ROLES.generalists.prcFactor} Value Factor x ${numGeneralists} ${ROLES.generalists.shortLabel.toLowerCase()} traveling</td>
    <td>$${data.costGeneralists.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr class="total-row">
    <td><b>Employee Total</b></td><td></td>
    <td><b>$${data.totalEmployeeCostPerHour.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</b></td>
  </tr>

  <tr><th colspan="3" class="table-section-header">Driving Costs</th></tr>
  <tr>
    <td>Travel Hours
        ${tooltip(`Average travel time for ${trip.label}, in hours\n\nMileage is derived using total driving miles with an average driving speed of ${DRIVING_SPEED_MPH} mph.`)}
    </td>
    <td>${trip.driveMiles.toFixed(1)} total miles / ${DRIVING_SPEED_MPH} mph</td>
    <td>${data.driveHours.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Employee Cost
        ${tooltip(`Employee cost represents the cost to MnDOT in "windshield time" where employees are unable to perform their duties. Time spent in a car is considered dead time because the environment is not conducive to work.`)}</td>
    <td>$${data.totalEmployeeCostPerHour.toLocaleString(undefined, {maximumFractionDigits: 2})} Total employee cost per hour x ${data.driveHours.toFixed(2)} hours traveling</td>
    <td>$${data.driveEmployeeTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Vehicles Needed
        ${tooltip(`Number of vehicles needed to transport employees. We assume ${VEHICLE_CAPACITY} employees traveling per vehicle.`)}</td>
    <td>${data.totalEmployees} employees traveling / ${VEHICLE_CAPACITY} per vehicle</td>
    <td>${data.carsNeeded}</td>
  </tr>
  <tr>
    <td>Vehicle Cost</td>
    <td>${trip.driveMiles.toFixed(1)} miles x $${COST_PER_MILE.driving}/mile x ${data.carsNeeded} vehicles</td>
    <td>$${data.driveDistanceCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging
        ${tooltip(`Lodging cost is calculated using total trip hours with ${HOURS_ALLOWED_PER_DAY} hours/day allowed before requiring an overnight stay.\n\nOvernight accommodations are calculated at $${ACCOMMODATIONS_PER_PERSON} per person per night.`)}</td>
    <td>${data.totalEmployees} employees x $${ACCOMMODATIONS_PER_PERSON} per night x ${data.numDays} nights</td>
    <td>$${data.driveLodging.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr class="total-row">
    <td><b>Driving Total</b></td><td></td>
    <td><b>$${data.driveTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>

  <tr><th colspan="3" class="table-section-header">Flying Costs - King Air</th></tr>
  <tr>
    <td>Travel Hours
      ${tooltip(`Travel hours use segmented speeds: ${AIRCRAFT_INFO.kingAir.departure_speed_mph} mph for the first ${AIRCRAFT_INFO.kingAir.departure_distance} miles, ${AIRCRAFT_INFO.kingAir.cruise_speed_mph} mph for cruise, and ${AIRCRAFT_INFO.kingAir.approach_speed_mph} mph for the last ${AIRCRAFT_INFO.kingAir.approach_distance} miles. Short trips are proportionally weighted across departure and approach distances.`)}
    </td>
    <td>${(() => {
      const total = trip.flyMiles;
      const legs = Math.max(1, trip.tripLegs || 1);
      const oneWay = total / legs;
      const maxSegment = AIRCRAFT_INFO.kingAir.departure_distance + AIRCRAFT_INFO.kingAir.approach_distance;
      const depPerLeg = oneWay <= maxSegment
        ? oneWay * (AIRCRAFT_INFO.kingAir.departure_distance / maxSegment)
        : AIRCRAFT_INFO.kingAir.departure_distance;
      const appPerLeg = oneWay <= maxSegment
        ? oneWay - depPerLeg
        : AIRCRAFT_INFO.kingAir.approach_distance;
      const cruisePerLeg = oneWay <= maxSegment ? 0 : oneWay - maxSegment;
      const depMiles = depPerLeg * legs;
      const appMiles = appPerLeg * legs;
      const cruiseMiles = cruisePerLeg * legs;
      return `${total.toFixed(1)} total miles, ${depMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kingAir.departure_speed_mph} mph + ${cruiseMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kingAir.cruise_speed_mph} mph + ${appMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kingAir.approach_speed_mph} mph`;
    })()}</td>
    <td>${data.flyHoursKingAir.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Aircraft Cost
      ${tooltip(`The cost per flight mile of the King Air aircraft is derived by adding together both the fixed and variable costs of operating the aircraft over the preceding year and dividing by the total mileage flown. This gives an average cost per mile of $${COST_PER_MILE.flyingKingAir} to operate this aircraft and is updated yearly.`)}
    </td>
    <td>${trip.flyMiles.toFixed(1)} miles x $${COST_PER_MILE.flyingKingAir}/mile</td>
    <td>$${data.flyDistanceCostKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging
      ${tooltip(`Lodging cost is calculated using total trip hours with ${HOURS_ALLOWED_PER_DAY_FLYING} hours/day allowed before requiring an overnight stay.\n\nOvernight accommodations are calculated at $${ACCOMMODATIONS_PER_PERSON} per person per night. Pilot lodging is included for two pilots.`)}
    </td>
    <td>${data.totalEmployees + 2} travelers x $${ACCOMMODATIONS_PER_PERSON} per night x ${data.flyNumDaysKingAir} nights</td>
    <td>$${data.flyLodgingKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr class="total-row">
    <td><b>King Air Total</b></td><td></td>
    <td><b>$${data.flyTotalKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>

  <tr><th colspan="3" class="table-section-header">Flying Costs - Kodiak</th></tr>
  <tr>
    <td>Travel Hours
      ${tooltip(`Travel hours use segmented speeds: ${AIRCRAFT_INFO.kodiak.departure_speed_mph} mph for the first ${AIRCRAFT_INFO.kodiak.departure_distance} miles, ${AIRCRAFT_INFO.kodiak.cruise_speed_mph} mph for cruise, and ${AIRCRAFT_INFO.kodiak.approach_speed_mph} mph for the last ${AIRCRAFT_INFO.kodiak.approach_distance} miles. Short trips are proportionally weighted across departure and approach distances.`)}
    </td>
    <td>${(() => {
      const total = trip.flyMiles;
      const legs = Math.max(1, trip.tripLegs || 1);
      const oneWay = total / legs;
      const maxSegment = AIRCRAFT_INFO.kodiak.departure_distance + AIRCRAFT_INFO.kodiak.approach_distance;
      const depPerLeg = oneWay <= maxSegment
        ? oneWay * (AIRCRAFT_INFO.kodiak.departure_distance / maxSegment)
        : AIRCRAFT_INFO.kodiak.departure_distance;
      const appPerLeg = oneWay <= maxSegment
        ? oneWay - depPerLeg
        : AIRCRAFT_INFO.kodiak.approach_distance;
      const cruisePerLeg = oneWay <= maxSegment ? 0 : oneWay - maxSegment;
      const depMiles = depPerLeg * legs;
      const appMiles = appPerLeg * legs;
      const cruiseMiles = cruisePerLeg * legs;
      return `${total.toFixed(1)} total miles, ${depMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kodiak.departure_speed_mph} mph + ${cruiseMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kodiak.cruise_speed_mph} mph + ${appMiles.toFixed(1)} miles @ ${AIRCRAFT_INFO.kodiak.approach_speed_mph} mph`;
    })()}</td>
    <td>${data.flyHoursKodiak.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Aircraft Cost
      ${tooltip(`The cost per flight mile of the Kodiak aircraft is derived by adding together both the fixed and variable costs of operating the aircraft over the preceding year and dividing by the total mileage flown. This gives an average cost per mile of $${COST_PER_MILE.flyingKodiak} to operate this aircraft and is updated yearly.`)}
    </td>
    <td>${trip.flyMiles.toFixed(1)} miles x $${COST_PER_MILE.flyingKodiak}/mile</td>
    <td>$${data.flyDistanceCostKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging
      ${tooltip(`Lodging cost is calculated using total trip hours with ${HOURS_ALLOWED_PER_DAY_FLYING} hours/day allowed before requiring an overnight stay.\n\nOvernight accommodations are calculated at $${ACCOMMODATIONS_PER_PERSON} per person per night. Pilot lodging is included for two pilots.`)}
    </td>
    <td>${data.totalEmployees + 2} travelers x $${ACCOMMODATIONS_PER_PERSON} per night x ${data.flyNumDaysKodiak} nights</td>
    <td>$${data.flyLodgingKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr class="total-row">
    <td><b>Kodiak Total</b></td><td></td>
    <td><b>$${data.flyTotalKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>`;
};

window.renderBreakdownTable = renderBreakdownTable;
