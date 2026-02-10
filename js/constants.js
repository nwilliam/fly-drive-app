const ROLES = {
  directors: {
    shortLabel: "Directors",
    fullLabel: "Office Directors / Principle Engineers",
    hourlyRate: 86.53,
    prcFactor: 5.7,
    baseAvgYearly: "120,000"
  },
  managers: {
    shortLabel: "Professionals",
    fullLabel: "Supervisors / Professionals",
    hourlyRate: 67.46,
    prcFactor: 3.8,
    baseAvgYearly: "80,000"
  },
  generalists: {
    shortLabel: "Generalists",
    fullLabel: "Transportation Generalists",
    hourlyRate: 51.40,
    prcFactor: 2.4,
    baseAvgYearly: "40,000"
  }
};

const COST_PER_MILE = {
  driving: 0.725,
  flyingKingAir: 11.64,
  flyingKodiak: 8.50 
};

/* There's a lot of debate on the way this should be done. Have three "phases" of flight based on mileage - first say 50 miles is at a low speed for climb/ATC, 
cruise is at a different speed, and last say 30 miles is at a different speed for approach. This would be a more accurate approximation - cities like St Cloud 
(70 miles) would all be at a "Slow" speed, and cities further apart would spend more time at a "high" speed. */

const AIRCRAFT_INFO = {
  kingAir: {
    departure_distance: 50, // This represents the climbout and vectoring you tend to get around the metro area. Its arbitrary, but is close and the estimates are better.
    approach_distance: 30, // This represents the descent and approach phase, which is also slower. Again, arbitrary but close enough for estimates.
    departure_speed_mph: 180, 
    cruise_speed_mph: 280,
    approach_speed_mph: 150
    // I should probably pull COST_PER_MILE into this object too, but its not a big deal to have it seperate.
  },
  kodiak: {
    departure_distance:30,
    approach_distance: 20,
    departure_speed_mph: 120,
    cruise_speed_mph: 180,
    approach_speed_mph: 120
  }
}; 

/* Left in for posterity - these were the old averages. They came from the ATS Flt Ops Calculator spreadsheet, but the new method is more accurate.
const FLYING_SPEED_MPH = {
  kingAir: 215,
  kodiak: 150
}; */

const LODGING_COST = 120;
const MEALS_COST = {
  breakfast: 11,
  lunch: 13,
  dinner: 19
};

const VEHICLE_CAPACITY = 4;
const ACCOMMODATIONS_PER_PERSON = LODGING_COST + MEALS_COST.breakfast + MEALS_COST.lunch + MEALS_COST.dinner;
const PILOT_LODGING = 272; // Why are we doing this separately? Maybe we should just use the same rate as generalists?
const DRIVING_SPEED_MPH = 55;
const HOURS_ALLOWED_PER_DAY = 10;
const HOURS_ALLOWED_PER_DAY_FLYING = 12;
//const ROUND_TRIP = true; // can be used to multiply distances/times
