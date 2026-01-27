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
    fullLabel: "Managers / Supervisors / Professionals",
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
  flyingKingAir: 15.52,
  flyingKodiak: 7.76 //completely made up
};

const FLYING_SPEED_MPH = {
  kingAir: 280,
  kodiak: 180
};

const VEHICLE_CAPACITY = 4;
const LODGING_PER_PERSON = 163; //includes meals? No way to figure out TOD so lets say hotel = 120 + (11 + 13 + 19) = 163
const PILOT_LODGING = 272; // Why are we doing this separately? Maybe we should just use the same rate as generalists?
const DRIVING_SPEED_MPH = 60;
const HOURS_ALLOWED_PER_DAY = 10;
const HOURS_ALLOWED_PER_DAY_FLYING = 12;
const ROUND_TRIP = true; // can be used to multiply distances/times
