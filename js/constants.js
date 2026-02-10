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
}

const COST_PER_MILE = {
  driving: 0.725,
  flyingKingAir: 11.64,
  flyingKodiak: 8.50 
};

const FLYING_SPEED_MPH = {
  kingAir: 215,
  kodiak: 150
};

const LODGING_COST = 120;
const MEALS_COST = {
  breakfast: 11,
  lunch: 13,
  dinner: 19
};
const VEHICLE_CAPACITY = 4;
const ACCOMMODATIONS_PER_PERSON = LODGING_COST + MEALS_COST.breakfast + MEALS_COST.lunch + MEALS_COST.dinner;
const PILOT_LODGING = 272; // Why are we doing this separately? Maybe we should just use the same rate as generalists?
const DRIVING_SPEED_MPH = 50;
const HOURS_ALLOWED_PER_DAY = 10;
const HOURS_ALLOWED_PER_DAY_FLYING = 12;
const ROUND_TRIP = true; // can be used to multiply distances/times
