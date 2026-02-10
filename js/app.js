const destInput = document.getElementById("dest1");
const destList = document.getElementById("dest1-list");

let roundTrip = document.getElementById("roundTripCheckbox").checked;

// Helper to set text content safely
const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

// Replace static elements (use setText for textContent assignments)
setText("directors-label", ROLES.directors.fullLabel);
setText("managers-label", ROLES.managers.fullLabel);
setText("generalists-label", ROLES.generalists.fullLabel);

// tooltips include HTML, keep using innerHTML
document.getElementById("directors-tooltip").innerHTML = `${tooltip(`Each level of employee has a different
 level of value that they create for MnDOT, which requires them to be separated for calculation purposes. For calculation
 purposes only, ${ROLES.directors.shortLabel} have a rough yearly income greater than $${ROLES.directors.baseAvgYearly}.`)}`
document.getElementById("managers-tooltip").innerHTML = `${tooltip(`Each level of employee has a different
 level of value that they create for MnDOT, which requires them to be separated for calculation purposes. For calculation
 purposes only, ${ROLES.managers.shortLabel} have a rough yearly income of between $${ROLES.managers.baseAvgYearly} and $${ROLES.directors.baseAvgYearly}.`)}`
document.getElementById("generalists-tooltip").innerHTML = `${tooltip(`Each level of employee has a different
 level of value that they create for MnDOT, which requires them to be separated for calculation purposes. For calculation
 purposes only, ${ROLES.generalists.shortLabel} have a rough yearly income of less than $${ROLES.managers.baseAvgYearly}.`)}`

// FAQ: fill placeholders from constants.js
setText("faq-meals-breakfast", `$${MEALS_COST.breakfast}`);
setText("faq-meals-lunch", `$${MEALS_COST.lunch}`);
setText("faq-meals-dinner", `$${MEALS_COST.dinner}`);
setText("faq-lodging-per-person", `$${LODGING_COST.toLocaleString()}`);
setText("faq-vehicle-capacity", `${VEHICLE_CAPACITY}`);
setText("faq-cost-per-mile-driving", `$${COST_PER_MILE.driving}`);
setText("faq-cost-per-mile-flying-kingair", `$${COST_PER_MILE.flyingKingAir}`);
setText("faq-cost-per-mile-flying-kodiak", `$${COST_PER_MILE.flyingKodiak}`);
setText("faq-pilot-lodging", `$${PILOT_LODGING.toLocaleString()}`);

function clearResults() {
  setText("drive-total", "$—");
  setText("fly-total", "$—");
  document.getElementById("breakdownTable").innerHTML =
    `<tr><td colspan="3">Enter inputs to view calculation details.</td></tr>`;
}

function tooltip(text, iconPath = "assets/icons/question-mark.svg") {
  return `
    <span class="tooltip-icon">
      <img alt="tooltip" src="${iconPath}" />
      <span class="tooltip-text">${text}</span>
    </span>
  `;
}

// Airport selector/searcher and debounce
let selectedAirport1 = null;

function filterAirports(query) {
  query = query.toLowerCase();
  return AIRPORTS.filter(a =>
    (a.name && a.name.toLowerCase().includes(query)) ||
    (a.icao && a.icao.toLowerCase().includes(query)) ||
    (a.faa && a.faa.toLowerCase().includes(query))
  ).slice(0, 15);
}

function renderAirportList(listEl, airports) {
  listEl.innerHTML = "";
  airports.forEach(ap => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.textContent = `${ap.name} (${ap.faa}${ap.icao ? " / " + ap.icao : ""})`;
    div.addEventListener("click", () => {
      selectedAirport1 = ap;
      destInput.value = div.textContent;
      listEl.hidden = true;
      calculateAndRender();
    });
    listEl.appendChild(div);
  });
  listEl.hidden = airports.length === 0;
}

let debounceTimer = null;
destInput.addEventListener("input", () => {
  selectedAirport1 = null;
  const query = destInput.value.trim();
  if (query.length < 1) {
    destList.hidden = true;
    return;
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    renderAirportList(destList, filterAirports(query));
  }, 200);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".autocomplete-container")) destList.hidden = true;
});

const inputs = [
  "directors",
  "managers",
  "generalists",
  "hours1",
  "roundTripCheckbox"
].map(id => document.getElementById(id));

let recalcTimer = null;

function scheduleRecalc() {
  clearTimeout(recalcTimer);
  recalcTimer = setTimeout(calculateAndRender, 200);
}

inputs.forEach(input => {
  input.addEventListener("input", scheduleRecalc);
});

// Handle Round Trip checkbox separately (change event for checkboxes)
const roundTripCheckbox = document.getElementById("roundTripCheckbox");
roundTripCheckbox.addEventListener("change", () => {
  roundTrip = roundTripCheckbox.checked;
  scheduleRecalc();
});

// Calculation Logic
function calculateAndRender() {
  if (!selectedAirport1) {
    clearResults();
    return;
  }

  const numDirectors = parseInt(document.getElementById("directors").value) || 0;
  const numManagers = parseInt(document.getElementById("managers").value) || 0;
  const numGeneralists = parseInt(document.getElementById("generalists").value) || 0;
  const hoursAtDest = parseFloat(document.getElementById("hours1").value) || 0;

  const totalEmployees = numDirectors + numManagers + numGeneralists;

  // Employee cost per hour for driving only
  const costDirectors =
    numDirectors * ROLES.directors.hourlyRate * ROLES.directors.prcFactor;
  const costManagers =
    numManagers * ROLES.managers.hourlyRate * ROLES.managers.prcFactor;
  const costGeneralists =
    numGeneralists * ROLES.generalists.hourlyRate * ROLES.generalists.prcFactor;
  const totalEmployeeCostPerHour =
    costDirectors + costManagers + costGeneralists;

  // Driving
  const driveHours =
    selectedAirport1.drivingFromKSTP / DRIVING_SPEED_MPH * (roundTrip ? 2 : 1);
  const carsNeeded =
    Math.ceil(totalEmployees / VEHICLE_CAPACITY);
  const driveDistanceCost =
    selectedAirport1.drivingFromKSTP * COST_PER_MILE.driving * (roundTrip ? 2 : 1) * carsNeeded;
  const numDays =
    Math.floor((driveHours + hoursAtDest) / HOURS_ALLOWED_PER_DAY);
  const driveLodging =
    totalEmployees * ACCOMMODATIONS_PER_PERSON * numDays;
  const driveEmployeeTotal =
    totalEmployeeCostPerHour * driveHours;
  const driveTotal =
    driveEmployeeTotal + driveDistanceCost + driveLodging;

  // Flying - King Air
  // Commented code uses a more complex calculation of flight hours based on different speeds for different phases of flight, but I have simplified to just use an average speed for now.
  /* const flyHoursKingAir =
    selectedAirport1.flyingFromKSTP / FLYING_SPEED_MPH.kingAir * (ROUND_TRIP ? 2 : 1); //+ (ROUND_TRIP ? .4 : .3); */
  
  const cruiseMilesKingAir = Math.round(Math.max(0, selectedAirport1.flyingFromKSTP - AIRCRAFT_INFO.kingAir.departure_distance - AIRCRAFT_INFO.kingAir.approach_distance));
  // If cruiseMiles are 0, then we have a very short flight. We need to break up departure/approach proportionally to their defined distances. Otherwise, we can just calculate hours normally.
  let departureMilesKingAir, approachMilesKingAir = 0;

  if (cruiseMilesKingAir === 0) {
    departureMilesKingAir = Math.round(selectedAirport1.flyingFromKSTP * (AIRCRAFT_INFO.kingAir.departure_distance / (AIRCRAFT_INFO.kingAir.departure_distance + AIRCRAFT_INFO.kingAir.approach_distance)));
    approachMilesKingAir = Math.round(selectedAirport1.flyingFromKSTP - departureMilesKingAir)
  } else {
    departureMilesKingAir = AIRCRAFT_INFO.kingAir.departure_distance;
    approachMilesKingAir = AIRCRAFT_INFO.kingAir.approach_distance;
  }

  const flyHoursKingAir =
    ((departureMilesKingAir / AIRCRAFT_INFO.kingAir.departure_speed_mph) +
    (approachMilesKingAir / AIRCRAFT_INFO.kingAir.approach_speed_mph) +
    cruiseMilesKingAir / AIRCRAFT_INFO.kingAir.cruise_speed_mph) *
    (roundTrip ? 2 : 1);
   
  
  const flyDistanceCostKingAir =
    selectedAirport1.flyingFromKSTP * COST_PER_MILE.flyingKingAir * (roundTrip ? 2 : 1);
  const flyNumDaysKingAir =
    Math.floor((flyHoursKingAir + hoursAtDest) / HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodgingKingAir =
    (totalEmployees + 2) * (ACCOMMODATIONS_PER_PERSON) * flyNumDaysKingAir; //technically we could just send the plane home. if(hoursAtDest > X) flyDistanceCostKingAir*=2
  const flyTotalKingAir =
    flyDistanceCostKingAir + flyLodgingKingAir;

  // Flying - Kodiak
  // Commented code uses a more complex calculation of flight hours based on different speeds for different phases of flight, but I have simplified to just use an average speed for now.
  /* const flyHoursKodiak =
    selectedAirport1.flyingFromKSTP / FLYING_SPEED_MPH.kodiak * (ROUND_TRIP ? 2 : 1); */
  
  
  let departureMilesKodiak, approachMilesKodiak = 0;
  const cruiseMilesKodiak = Math.round(Math.max(0, selectedAirport1.flyingFromKSTP - AIRCRAFT_INFO.kodiak.departure_distance - AIRCRAFT_INFO.kodiak.approach_distance));
  
  if (cruiseMilesKodiak === 0) {
    departureMilesKodiak = Math.round(selectedAirport1.flyingFromKSTP * (AIRCRAFT_INFO.kodiak.departure_distance / (AIRCRAFT_INFO.kodiak.departure_distance + AIRCRAFT_INFO.kodiak.approach_distance)));
    approachMilesKodiak = Math.round(selectedAirport1.flyingFromKSTP - departureMilesKodiak);
  } else {
    departureMilesKodiak = AIRCRAFT_INFO.kodiak.departure_distance;
    approachMilesKodiak = AIRCRAFT_INFO.kodiak.approach_distance;
  }
  const flyHoursKodiak =
    ((departureMilesKodiak / AIRCRAFT_INFO.kodiak.departure_speed_mph) +
    (approachMilesKodiak / AIRCRAFT_INFO.kodiak.approach_speed_mph) +
    cruiseMilesKodiak / AIRCRAFT_INFO.kodiak.cruise_speed_mph) *
    (roundTrip ? 2 : 1);  

  const flyDistanceCostKodiak =
    selectedAirport1.flyingFromKSTP * COST_PER_MILE.flyingKodiak * (roundTrip ? 2 : 1);
  const flyNumDaysKodiak =
    Math.floor((flyHoursKodiak + hoursAtDest) / HOURS_ALLOWED_PER_DAY_FLYING);
  const flyLodgingKodiak =
    (totalEmployees + 2) * (ACCOMMODATIONS_PER_PERSON) * flyNumDaysKodiak; //technically we could just send the plane home. if(hoursAtDest > X) flyDistanceCostKingAir*=2
  const flyTotalKodiak =
    flyDistanceCostKodiak + flyLodgingKodiak;

  // Update Totals and set card texts
  setText("drive-cost-label", `Total ${roundTrip ? "Round-Trip" : "One-Way"} Cost`);
  setText("fly-cost-label", `Total ${roundTrip ? "Round-Trip" : "One-Way"} Cost`);
  setText("fly-cost-label-kodiak", `Total ${roundTrip ? "Round-Trip" : "One-Way"} Cost`);
  setText("drive-total", "$" + driveTotal.toLocaleString(undefined, {maximumFractionDigits: 0})
    + " - " + driveHours.toLocaleString(undefined, {maximumFractionDigits: 1}) + "hrs");
  setText("fly-total", "$" + flyTotalKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})
    + " - " + flyHoursKingAir.toLocaleString(undefined, {maximumFractionDigits: 1}) + "hrs");
  setText("fly-total-kodiak", "$" + flyTotalKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})
    + " - " + flyHoursKodiak.toLocaleString(undefined, {maximumFractionDigits: 1}) + "hrs");

  // Build the Breakdown Table
  // I am aware that I need to build this a bit more programatically. Instead, you get tech debt. Sorry. 
  const breakdownTable = document.getElementById("breakdownTable");
  breakdownTable.innerHTML = `
  <tr><th colspan="3" style="text-align:center">Employee Costs per Hour</th></tr>
  <tr>
    <td>${ROLES.directors.shortLabel}
        ${tooltip(`Average ${ROLES.directors.shortLabel} compensation per hour is $${ROLES.directors.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA study by the NBAA has determined that the value these individuals create is worth a Productivity Factor of ${ROLES.directors.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Productivity Factor times the average hourly compensation.`)}
    </td>
    <td>${ROLES.directors.hourlyRate.toFixed(2)}/hr cost x ${ROLES.directors.prcFactor} Productivity Factor x ${numDirectors} ${ROLES.directors.shortLabel.toLowerCase()} traveling</td>
    <td>$${costDirectors.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr>
    <td>${ROLES.managers.shortLabel}
      ${tooltip(`Average ${ROLES.managers.shortLabel} compensation per hour is $${ROLES.managers.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA study by the NBAA has determined that the value these individuals create is worth a Productivity Factor of ${ROLES.managers.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Productivity Factor times the average hourly compensation.`)}
    </td>
    <td>${ROLES.managers.hourlyRate.toFixed(2)}/hr cost x ${ROLES.managers.prcFactor} Productivity Factor x ${numManagers} ${ROLES.managers.shortLabel.toLowerCase()} traveling</td>
    <td>$${costManagers.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr>
    <td>${ROLES.generalists.shortLabel}
      ${tooltip(`Average ${ROLES.generalists.shortLabel} compensation per hour is $${ROLES.generalists.hourlyRate.toFixed(2)}, including the cost of benefits.\n\nA study by the NBAA has determined that the value these individuals create is worth a Productivity Factor of ${ROLES.generalists.prcFactor} times their compensation.\n\nTo calculate the hourly cost of having this individual driving a vehicle and not working ("windshield time"), we multiply this Productivity Factor times the average hourly compensation.`)}</td>
    </td>
    <td>${ROLES.generalists.hourlyRate.toFixed(2)}/hr cost x ${ROLES.generalists.prcFactor} Productivity Factor x ${numGeneralists} ${ROLES.generalists.shortLabel.toLowerCase()} traveling</td>
    <td>$${costGeneralists.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</td>
  </tr>
  <tr class="total-row">
    <td><b>Employee Total</b>
        <!-- ${tooltip(`Total cost of all employees traveling, per hour.`)}--></td><td></td>
    <td><b>$${totalEmployeeCostPerHour.toLocaleString(undefined, {maximumFractionDigits: 2})}/hr</b></td>
  </tr>

  <tr><th colspan="3" style="text-align:center">Driving Costs</th></tr>
  <tr>
    <td>Travel Hours
        ${tooltip(`Average travel time from KSTP to ${selectedAirport1.name} airport, in hours\n\nMileage is derived from MapQuest to calculate actual driving distances with an average driving speed of ${DRIVING_SPEED_MPH} mph.`)}
    </td>
    <td>${selectedAirport1.drivingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`} ÷ ${DRIVING_SPEED_MPH} mph</td>
    <td>${driveHours.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Employee Cost
        ${tooltip(`Employee cost represents the cost to MnDOT in "windshield time" where employees are unable to perform their duties. Time spent in a car is considered dead time because the environment is not conducive to work.`)}</td>
    <td>$${totalEmployeeCostPerHour.toLocaleString(undefined, {maximumFractionDigits: 2})} Total employee cost per hour x ${driveHours.toFixed(2)} hours traveling</td>
    <td>$${driveEmployeeTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Vehicles Needed
        ${tooltip(`Number of vehicles needed to transport employees. We assume ${VEHICLE_CAPACITY} employees traveling per vehicle.`)}</td>
    <td>${totalEmployees} employees traveling ÷ ${VEHICLE_CAPACITY} per vehicle</td>
    <td>${carsNeeded}</td>
  </tr>
  <tr>
    <td>Distance Cost
        ${tooltip(`This is the total cost of all vehicles traveling to the site and back, representing the total cost to MnDOT in either reimbursement or general costs of using the MnDOT fleet. We use the current Federal mileage reimbursement rate of $${COST_PER_MILE.driving}.`)}</td>
    <td>${selectedAirport1.drivingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`} x
        $${COST_PER_MILE.driving} Federal mileage reimbursement rate x ${carsNeeded} vehicles needed</td>
    <td>$${driveDistanceCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging & Meals
        ${tooltip(`If the total hours is greater than a standard workday of ${HOURS_ALLOWED_PER_DAY} hours, employees are assumed to be reimbursed for an overnight stay including lodging and meals.\n\nThis cost is $${ACCOMMODATIONS_PER_PERSON} per person and is based on $120 lodging cost please three meals reimbursed at $11, $13, and $19.`)}</td>
    <td>$${ACCOMMODATIONS_PER_PERSON} per person lodging and meals x ${totalEmployees} total employees x ${numDays} overnights</td>
    <td>$${driveLodging.toLocaleString()}</td>
  </tr>
  <tr class="total-row">
    <td colspan="2"><b>Total Driving</b></td>
    <td><b>$${driveTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>
  
  
  <!-- KING AIR STARTS HERE -->
  <tr><th colspan="3" style="text-align:center">Flying Costs - King Air</th></tr>
  <tr>
    <td>Travel Hours
      ${tooltip(`Travel hours are calculated using ${AIRCRAFT_INFO.kingAir.departure_speed_mph} mph for the first ${departureMilesKingAir} miles, ${AIRCRAFT_INFO.kingAir.cruise_speed_mph} mph for the cruise portion, and ${AIRCRAFT_INFO.kingAir.approach_speed_mph} mph for the last ${approachMilesKingAir} miles. Employee costs are not included in this calculation as the environment of these aircraft is conducive to work being done either in teams or individually on laptops.`)}</td>
    <td>${selectedAirport1.flyingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`}, ${departureMilesKingAir * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kingAir.departure_speed_mph} mph + ${cruiseMilesKingAir * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kingAir.cruise_speed_mph} mph + ${approachMilesKingAir * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kingAir.approach_speed_mph} mph</td>
    <td>${flyHoursKingAir.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Distance Cost
      ${tooltip(`The cost per flight mile of the King Air aircraft is derived by adding together both the fixed and variable costs of operating the aircraft over the preceding year and dividing by the total mileage flown. This gives an average cost per mile to of $${COST_PER_MILE.flyingKingAir} to operate this aircraft and is updated yearly.`)}</td>
    <td>${selectedAirport1.flyingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`} x
        $${COST_PER_MILE.flyingKingAir} cost per mile</td>
    <td>$${flyDistanceCostKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging & Meals
       ${tooltip(`If the total hours is greater than ${HOURS_ALLOWED_PER_DAY_FLYING} hours, employees are reimbursed for an overnight stay including lodging and meals, and the two pilots' worth of lodging and meals is added to the cost.\n\nThis cost is $${ACCOMMODATIONS_PER_PERSON} per person and is based on $120 lodging cost plus three meals reimbursed at $11, $13, and $19.\n\n12 hours is used for calculating flying as employees are not required to be active during the return trip.`)}
    <td>$${ACCOMMODATIONS_PER_PERSON} per person lodging and meals x ${totalEmployees + 2} total employees (including pilots) x ${flyNumDaysKingAir} overnights</td>
    <td>$${flyLodgingKingAir.toLocaleString()}</td>
  </tr>
  <tr class="total-row">
    <td colspan="2"><b>Total Flying</b></td>
    <td><b>$${flyTotalKingAir.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>

  
  <!--- KODIAK STARTS HERE -->
  <tr><th colspan="3" style="text-align:center">Flying Costs - Kodiak</th></tr>
  <tr>
    <td>Travel Hours
    ${tooltip(`Travel hours are calculated using ${AIRCRAFT_INFO.kodiak.departure_speed_mph} mph for the first ${departureMilesKodiak} miles, ${AIRCRAFT_INFO.kodiak.cruise_speed_mph} mph for the cruise miles, and ${AIRCRAFT_INFO.kodiak.approach_speed_mph} mph for the last ${approachMilesKodiak} miles.`)}</td>
    <td>${selectedAirport1.flyingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`}, ${departureMilesKodiak * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kodiak.departure_speed_mph} mph + ${cruiseMilesKodiak * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kodiak.cruise_speed_mph} mph + ${approachMilesKodiak * (roundTrip ? 2 : 1)} miles at ${AIRCRAFT_INFO.kodiak.approach_speed_mph} mph</td>
    <td>${flyHoursKodiak.toFixed(2)} hrs</td>
  </tr>
  <tr>
    <td>Distance Cost
    ${tooltip(`The cost per flight mile of the Kodiak aircraft is derived by adding together both the fixed and variable costs of operating the aircraft over the preceding year and dividing by the total mileage flown. This gives an average cost per mile to of $${COST_PER_MILE.flyingKodiak} to operate this aircraft and is updated yearly.`)}</td>
    <td>${selectedAirport1.flyingFromKSTP * (roundTrip ? 2 : 1)} ${roundTrip ? `total round-trip miles` : `total miles`} x
        $${COST_PER_MILE.flyingKodiak} cost per mile</td>
    <td>$${flyDistanceCostKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
  </tr>
  <tr>
    <td>Lodging & Meals
    ${tooltip(`If the total hours is greater than ${HOURS_ALLOWED_PER_DAY_FLYING} hours, employees are reimbursed for an overnight stay including lodging and meals, and the two pilots' worth of lodging and meals is added to the cost.\n\nThis cost is $${ACCOMMODATIONS_PER_PERSON} per person and is based on $120 lodging cost plus three meals reimbursed at $11, $13, and $19.\n\n12 hours is used for calculating flying as employees are not required to be active during the return trip.`)}</td>
    <td>$${ACCOMMODATIONS_PER_PERSON} per person lodging and meals x ${totalEmployees + 2} total employees (including pilots) x ${flyNumDaysKodiak} overnights</td>
    <td>$${flyLodgingKodiak.toLocaleString()}</td>
  </tr>
  <tr class="total-row">
    <td colspan="2"><b>Total Flying</b></td>
    <td><b>$${flyTotalKodiak.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></td>
  </tr>
    `;
}
