/**
 * Flight reporting orchestration and aggregation
 * Processes flight logs and generates monthly cost reports
 */

// Aggregate flight data by month and allocate 5% as generalists
function aggregateByMonth(flights) {
  const monthMap = {};
  
  for (const flight of flights) {
    const date = new Date(flight.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        month: monthKey,
        directors: 0,
        managers: 0,
        totalMilesFly: 0,
        totalMilesDrive: 0,
        totalCostDrive: 0,
        totalCostFly: 0,
        flightCount: 0
      };
    }
    
    const month = monthMap[monthKey];
    month.directors += flight.classified.directors.length;
    month.managers += flight.classified.managers.length;
    month.totalMilesFly += flight.flyDistance || 0;
    month.totalMilesDrive += flight.driveDistance || 0;
    month.totalCostDrive += flight.costDrive.total || 0;
    month.totalCostFly += flight.costFly.total || 0;
    month.flightCount += 1;
  }
  
  // Calculate generalists as configured percentage of total personnel per month
  const result = Object.values(monthMap);
  for (const month of result) {
    const totalPeople = month.directors + month.managers;
    const generalistCount = Math.ceil(totalPeople * window.GENERALIST_PERCENTAGE);
    month.generalists = generalistCount;
    month.managers = Math.max(0, totalPeople - month.directors - generalistCount);
    // Calculate savings: positive means flying is cheaper, negative means driving is cheaper
    month.savings = month.totalCostDrive - month.totalCostFly;
  }
  
  return result.sort((a, b) => a.month.localeCompare(b.month));
}

// Process flight and calculate costs
async function processFlightLeg(flight, directorsList) {
  try {
    // Classify passengers
    const classified = window.PassengerClassifier.classifyPassengers(flight.passengers, directorsList);
    
    // Calculate distances
    const flyDistance = window.DistanceCalc.getFlyingDistance(flight.origin, flight.destination);
    const driveDistance = window.DistanceCalc.getDrivingDistance(flight.origin, flight.destination);
    
    // Calculate costs
    const costDrive = window.CostCalculator.calculateDriveCost({
      drivingMiles: driveDistance,
      numDirectors: classified.directors.length,
      numManagers: classified.managers.length,
      numGeneralists: classified.generalists.length,
      hoursAtDestination: 0
    });
    
    const costFly = window.CostCalculator.calculateFlyCostByTail({
      flyingMiles: flyDistance,
      numDirectors: classified.directors.length,
      numManagers: classified.managers.length,
      numGeneralists: classified.generalists.length,
      hoursAtDestination: 0,
      tailNumber: flight.tail
    });
    
    return {
      success: true,
      ...flight,
      classified,
      flyDistance,
      driveDistance,
      costDrive,
      costFly,
      savings: costDrive.total - costFly.total
    };
  } catch (error) {
    return {
      success: false,
      error: `${flight.dateStr} ${flight.origin}-${flight.destination}: ${error.message}`,
      ...flight
    };
  }
}

// Process all flights
async function processAllFlights(cleanedFlights, directorsList) {
  const processed = [];
  const errors = [];
  for (const flight of cleanedFlights) {
    const result = await processFlightLeg(flight, directorsList);
    if (result.success) {
      processed.push(result);
    } else {
      errors.push(result.error);
    }
  }
  return { flights: processed, errors };
}

// Generate output CSV
function generateReportCSV(monthlyData, dateRangeStart, dateRangeEnd) {
  const months = monthlyData.map(m => m.month);
  
  // CSV rows
  const rows = [
    ['Metric', ...months, 'Total'],
    ['Number of Directors', ...monthlyData.map(m => m.directors), monthlyData.reduce((sum, m) => sum + m.directors, 0)],
    ['Number of Managers', ...monthlyData.map(m => m.managers), monthlyData.reduce((sum, m) => sum + m.managers, 0)],
    ['Number of Generalists', ...monthlyData.map(m => m.generalists), monthlyData.reduce((sum, m) => sum + m.generalists, 0)],
    ['Total Miles Flown', ...monthlyData.map(m => Math.round(m.totalMilesFly)), monthlyData.reduce((sum, m) => sum + m.totalMilesFly, 0)],
    ['Total Miles if Driven', ...monthlyData.map(m => Math.round(m.totalMilesDrive)), monthlyData.reduce((sum, m) => sum + m.totalMilesDrive, 0)],
    ['Total Cost of Driving', ...monthlyData.map(m => Math.round(m.totalCostDrive)), monthlyData.reduce((sum, m) => sum + m.totalCostDrive, 0)],
    ['Total Cost of Flying', ...monthlyData.map(m => Math.round(m.totalCostFly)), monthlyData.reduce((sum, m) => sum + m.totalCostFly, 0)],
    ['Savings (Driving - Flying)', ...monthlyData.map(m => Math.round(m.totalCostDrive - m.totalCostFly)), monthlyData.reduce((sum, m) => sum + (m.totalCostDrive - m.totalCostFly), 0)]
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}

// Export functions
window.FlightReports = {
  aggregateByMonth,
  processFlightLeg,
  processAllFlights,
  generateReportCSV
};
