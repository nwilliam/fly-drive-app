(() => {
  const dom = window.cacheDom ? window.cacheDom() : null;
  if (!dom) {
    return;
  }

  const HOME_AIRPORT = (window.AIRPORTS || []).find(a => a.icao === "KSTP" || a.faa === "STP")
    || (window.AIRPORTS ? window.AIRPORTS[0] : null);
  const MAX_PAIRS = 6;
  let roundTrip = true;

  const formatAirport = (airport) => {
    if (!airport) return "";
    const codes = [airport.icao, airport.faa].filter(Boolean).join(" / ");
    return `${codes} - ${airport.name}`.trim();
  };

  const toAirportCode = (airport) => airport?.icao || airport?.faa || "";

  const getHoursBetween = (startValue, endValue) => {
    if (!startValue || !endValue) return null;
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

  const getDriveMiles = (origin, destination) => {
    if (!origin || !destination) return 0;
    const originCode = toAirportCode(origin);
    const destCode = toAirportCode(destination);
    if (window.DistanceCalc && originCode && destCode) {
      return safeNumber(window.DistanceCalc.getDrivingDistance(originCode, destCode));
    }
    if ((origin.icao === "KSTP" || origin.faa === "STP") && destination.drivingFromKSTP != null) {
      return safeNumber(destination.drivingFromKSTP);
    }
    return 0;
  };

  const getFlyMiles = (origin, destination) => {
    if (!origin || !destination) return 0;
    const originCode = toAirportCode(origin);
    const destCode = toAirportCode(destination);
    if (window.DistanceCalc && originCode && destCode) {
      return safeNumber(window.DistanceCalc.getFlyingDistance(originCode, destCode));
    }
    if ((origin.icao === "KSTP" || origin.faa === "STP") && destination.flyingFromKSTP != null) {
      return safeNumber(destination.flyingFromKSTP);
    }
    return 0;
  };

  const cityPairs = [];

  const updateResultsHeading = () => {
    if (!dom.resultsHeading) {
      return;
    }
    if (cityPairs.length <= 1) {
      dom.resultsHeading.textContent = `Results (${roundTrip ? "Round Trip" : "One Way"})`;
      return;
    }
    dom.resultsHeading.textContent = "Results (Multiple Legs)";
  };

  const updatePairControls = () => {
    const hasMultiple = cityPairs.length > 1;
    const showRoundTripToggle = cityPairs.length === 1;
    dom.cityPairs.classList.toggle("has-multiple", hasMultiple);
    if (dom.tripOptions) {
      dom.tripOptions.classList.toggle("is-hidden", hasMultiple);
    }
    cityPairs.forEach((pair, index) => {
      if (pair.roundTripToggle) {
        pair.roundTripToggle.hidden = !showRoundTripToggle || index > 0;
      }
      if (pair.roundTripInput) {
        pair.roundTripInput.checked = roundTrip;
        pair.roundTripInput.disabled = !showRoundTripToggle || index > 0;
      }
      pair.card.classList.toggle("pair-secondary", index > 0);
      pair.card.classList.toggle("city-pair-card--flat", cityPairs.length === 1);
      if (index === 0) {
        pair.originField.textContent = formatAirport(HOME_AIRPORT);
      } else {
        const previousDestination = cityPairs[index - 1]?.destination;
        pair.originField.textContent = previousDestination
          ? formatAirport(previousDestination)
          : "Select destination above";
      }

      const isReturnPair = hasMultiple && index === cityPairs.length - 1;
      if (isReturnPair) {
        pair.destination = HOME_AIRPORT;
        pair.destInput.value = formatAirport(HOME_AIRPORT);
        pair.destInput.disabled = true;
        pair.destInput.hidden = true;
        if (pair.hoursAtDestinationInput) {
          pair.hoursAtDestinationInput.value = "0";
          pair.hoursAtDestinationInput.disabled = true;
        }
        if (pair.hoursAtDestinationError) {
          window.setFieldError(pair.hoursAtDestinationInput, pair.hoursAtDestinationError, "");
        }
        if (pair.destinationStatic) {
          pair.destinationStatic.hidden = false;
          pair.destinationStatic.textContent = formatAirport(HOME_AIRPORT);
        }
        window.setFieldError(pair.destInput, pair.destError, "");
      } else {
        pair.destInput.disabled = false;
        pair.destInput.hidden = false;
        if (pair.hoursAtDestinationInput) {
          pair.hoursAtDestinationInput.disabled = false;
        }
        if (pair.destinationStatic) {
          pair.destinationStatic.hidden = true;
          pair.destinationStatic.textContent = "";
        }
      }
    });
    dom.removeCityPairButton.disabled = cityPairs.length <= 1;
    dom.addCityPairButton.disabled = cityPairs.length >= MAX_PAIRS;
    updateResultsHeading();
  };

  const buildPair = () => {
    const fragment = dom.cityPairTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".city-pair-card");
    const originField = fragment.querySelector(".origin-field");
    const destInput = fragment.querySelector(".dest-input");
    const destList = fragment.querySelector(".autocomplete-list");
    const destError = fragment.querySelector(".dest-error");
    const destinationStatic = fragment.querySelector(".destination-static");
    const roundTripToggle = fragment.querySelector(".trip-toggle");
    const roundTripInput = fragment.querySelector(".trip-toggle input[type='checkbox']");
    const hoursAtDestinationInput = fragment.querySelector(".hours-at-destination-input");
    const hoursAtDestinationError = fragment.querySelector(".hours-at-destination-error");

    // Arrival/Departure picker references intentionally disconnected for now,
    // but left commented for future restoration.
    // const pickerNodes = Array.from(fragment.querySelectorAll(".datetime-picker"));
    // const arrivalPicker = pickerNodes[0];
    // const departurePicker = pickerNodes[1];

    const pair = {
      card,
      originField,
      destInput,
      destList,
      destError,
      destinationStatic,
      roundTripToggle,
      roundTripInput,
      hoursAtDestinationInput,
      hoursAtDestinationError,
      // Arrival/Departure values preserved for future reuse.
      // arrivalValue: arrivalPicker ? arrivalPicker.querySelector(".datetime-value") : null,
      // departureValue: departurePicker ? departurePicker.querySelector(".datetime-value") : null,
      // departureDisplay: departurePicker ? departurePicker.querySelector(".datetime-input") : null,
      // departureError: departurePicker ? departurePicker.querySelector(".departure-error") : null,
      destination: null
    };

    if (roundTripInput) {
      roundTripInput.checked = roundTrip;
      roundTripInput.addEventListener("change", () => {
        if (cityPairs[0] !== pair) {
          roundTripInput.checked = roundTrip;
          return;
        }
        roundTrip = roundTripInput.checked;
        updateResultsHeading();
        scheduleRecalc();
      });
    }

    if (hoursAtDestinationInput) {
      hoursAtDestinationInput.addEventListener("input", scheduleRecalc);
    }

    originField.textContent = formatAirport(HOME_AIRPORT);

    if (destinationStatic) {
      destinationStatic.hidden = true;
    }

    window.initAirportAutocomplete({
      input: destInput,
      list: destList,
      onSelect: (airport, displayText) => {
        pair.destination = airport;
        destInput.value = displayText;
        window.setFieldError(destInput, destError, "");
        updatePairControls();
        scheduleRecalc();
      },
      onClear: () => {
        pair.destination = null;
        updatePairControls();
        scheduleRecalc();
      },
      onInput: () => scheduleRecalc()
    });

    return { fragment, pair };
  };

  const addPairToDom = (fragment, pair, beforeNode = null) => {
    if (beforeNode && beforeNode.parentNode) {
      beforeNode.parentNode.insertBefore(fragment, beforeNode);
    } else {
      dom.cityPairs.appendChild(fragment);
    }
    // Arrival/Departure picker initialization intentionally disabled for now.
    // window.initDateTimePickers(scheduleRecalc, pair.card);
  };

  const addCityPair = () => {
    if (cityPairs.length <= 1) {
      const newPair = buildPair();
      addPairToDom(newPair.fragment, newPair.pair);
      cityPairs.push(newPair.pair);
      if (cityPairs.length === 2) {
        const returnPair = buildPair();
        addPairToDom(returnPair.fragment, returnPair.pair);
        cityPairs.push(returnPair.pair);
      }
      updatePairControls();
      return;
    }

    const insertBefore = cityPairs[cityPairs.length - 1]?.card || null;
    const newPair = buildPair();
    addPairToDom(newPair.fragment, newPair.pair, insertBefore);
    cityPairs.splice(cityPairs.length - 1, 0, newPair.pair);
    updatePairControls();
  };

  const removeCityPair = () => {
    if (cityPairs.length <= 1) return;

    if (cityPairs.length === 2) {
      const returnPair = cityPairs.pop();
      returnPair.card.remove();
      updatePairControls();
      scheduleRecalc();
      return;
    }

    const removeIndex = cityPairs.length - 2;
    const removedPair = cityPairs.splice(removeIndex, 1)[0];
    removedPair.card.remove();
    updatePairControls();
    scheduleRecalc();
  };

  let recalcTimer = null;

  const scheduleRecalc = () => {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(calculateAndRender, 200);
  };

  const readInputs = () => ({
    numDirectors: parseInt(dom.directorsInput.value, 10) || 0,
    numManagers: parseInt(dom.managersInput.value, 10) || 0,
    numGeneralists: parseInt(dom.generalistsInput.value, 10) || 0
  });

  const getTripMultiplier = (totalPairs) => {
    if (totalPairs <= 1) {
      return roundTrip ? 2 : 1;
    }
    return 1;
  };

  const getPairTrip = (pair, index, totalPairs) => {
    const originAirport = index === 0 ? HOME_AIRPORT : cityPairs[index - 1]?.destination;
    if (!pair.destination || !originAirport) {
      if (pair.destInput.value.trim()) {
        window.setFieldError(pair.destInput, pair.destError, "Select a destination from the list.");
      } else {
        window.setFieldError(pair.destInput, pair.destError, "");
      }
      return null;
    }

    window.setFieldError(pair.destInput, pair.destError, "");

    const rawHoursAtDest = pair.hoursAtDestinationInput?.value?.trim() ?? "";
    let hoursAtDest = rawHoursAtDest === "" ? 0 : parseFloat(rawHoursAtDest);
    if (!Number.isFinite(hoursAtDest) || hoursAtDest < 0) {
      window.setFieldError(
        pair.hoursAtDestinationInput,
        pair.hoursAtDestinationError,
        "Enter a valid non-negative number of hours."
      );
      return null;
    }
    window.setFieldError(pair.hoursAtDestinationInput, pair.hoursAtDestinationError, "");

    // Arrival/Departure hours calculation intentionally disabled for now,
    // but preserved here for future restoration.
    // const hours = getHoursBetween(pair.arrivalValue?.value, pair.departureValue?.value);
    // if (hours == null) {
    //   if (pair.arrivalValue?.value || pair.departureValue?.value) {
    //     window.setFieldError(pair.departureDisplay, pair.departureError, "Select both arrival and departure.");
    //   } else {
    //     window.setFieldError(pair.departureValue, pair.departureError, "");
    //   }
    // } else if (hours < 0) {
    //   window.setFieldError(pair.departureDisplay, pair.departureError, "Departure must be after arrival.");
    // } else {
    //   window.setFieldError(pair.departureDisplay, pair.departureError, "");
    //   hoursAtDest = hours;
    // }

    const multiplier = getTripMultiplier(totalPairs);
    const driveMilesOneWay = getDriveMiles(originAirport, pair.destination);
    const flyMilesOneWay = getFlyMiles(originAirport, pair.destination);

    return {
      label: `${formatAirport(originAirport)} → ${formatAirport(pair.destination)}`,
      driveMiles: driveMilesOneWay * multiplier,
      flyMiles: flyMilesOneWay * multiplier,
      tripLegs: multiplier,
      hoursAtDest
    };
  };

  const calculateAndRender = () => {
    const inputs = readInputs();
    const trips = cityPairs
      .map((pair, index) => getPairTrip(pair, index, cityPairs.length))
      .filter(Boolean);

    if (!trips.length) {
      window.clearResults(dom);
      return;
    }

    const totals = {
      totalEmployees: inputs.numDirectors + inputs.numManagers + inputs.numGeneralists,
      costDirectors: 0,
      costManagers: 0,
      costGeneralists: 0,
      totalEmployeeCostPerHour: 0,
      driveHours: 0,
      carsNeeded: 0,
      driveDistanceCost: 0,
      numDays: 0,
      driveLodging: 0,
      driveEmployeeTotal: 0,
      driveTotal: 0,
      flyHoursKingAir: 0,
      flyDistanceCostKingAir: 0,
      flyNumDaysKingAir: 0,
      flyLodgingKingAir: 0,
      flyTotalKingAir: 0,
      flyHoursKodiak: 0,
      flyDistanceCostKodiak: 0,
      flyNumDaysKodiak: 0,
      flyLodgingKodiak: 0,
      flyTotalKodiak: 0
    };

    totals.costDirectors = inputs.numDirectors * ROLES.directors.hourlyRate * ROLES.directors.prcFactor;
    totals.costManagers = inputs.numManagers * ROLES.managers.hourlyRate * ROLES.managers.prcFactor;
    totals.costGeneralists = inputs.numGeneralists * ROLES.generalists.hourlyRate * ROLES.generalists.prcFactor;
    totals.totalEmployeeCostPerHour = totals.costDirectors + totals.costManagers + totals.costGeneralists;
    totals.carsNeeded = Math.ceil(totals.totalEmployees / window.VEHICLE_CAPACITY);

    const tripTotals = trips.reduce((acc, trip) => {
      const result = window.calculateTripCosts({
        driveMiles: trip.driveMiles,
        flyMiles: trip.flyMiles,
        hoursAtDest: trip.hoursAtDest,
        tripLegs: trip.tripLegs,
        ...inputs
      });
      acc.driveMiles += trip.driveMiles;
      acc.flyMiles += trip.flyMiles;
      acc.hoursAtDest += trip.hoursAtDest;
      acc.driveHours += result.driveHours;
      acc.driveDistanceCost += result.driveDistanceCost;
      acc.driveEmployeeTotal += result.driveEmployeeTotal;
      acc.flyHoursKingAir += result.flyHoursKingAir;
      acc.flyDistanceCostKingAir += result.flyDistanceCostKingAir;
      acc.flyHoursKodiak += result.flyHoursKodiak;
      acc.flyDistanceCostKodiak += result.flyDistanceCostKodiak;
      return acc;
    }, {
      driveMiles: 0,
      flyMiles: 0,
      hoursAtDest: 0,
      driveHours: 0,
      driveDistanceCost: 0,
      driveEmployeeTotal: 0,
      flyHoursKingAir: 0,
      flyDistanceCostKingAir: 0,
      flyHoursKodiak: 0,
      flyDistanceCostKodiak: 0,
      flyNumDaysKingAir: 0,
      flyLodgingKingAir: 0,
      flyTotalKingAir: 0,
      flyNumDaysKodiak: 0,
      flyLodgingKodiak: 0,
      flyTotalKodiak: 0,
      numDays: 0,
      driveLodging: 0,
      driveTotal: 0
    });

    const driveNumDays = Math.floor((tripTotals.driveHours + tripTotals.hoursAtDest) / window.HOURS_ALLOWED_PER_DAY);
    const driveLodging = totals.totalEmployees * window.ACCOMMODATIONS_PER_PERSON * driveNumDays;
    const driveTotal = tripTotals.driveEmployeeTotal + tripTotals.driveDistanceCost + driveLodging;
    const totalTimeAwayDrive = tripTotals.driveHours + tripTotals.hoursAtDest;

    const flyNumDaysKingAir = Math.floor(
      (tripTotals.flyHoursKingAir + tripTotals.hoursAtDest) / window.HOURS_ALLOWED_PER_DAY_FLYING
    );
    const flyLodgingKingAir = (totals.totalEmployees + 2) * window.ACCOMMODATIONS_PER_PERSON * flyNumDaysKingAir;
    const flyTotalKingAir = tripTotals.flyDistanceCostKingAir + flyLodgingKingAir;
    const totalTimeAwayKingAir = tripTotals.flyHoursKingAir + tripTotals.hoursAtDest;

    const flyNumDaysKodiak = Math.floor(
      (tripTotals.flyHoursKodiak + tripTotals.hoursAtDest) / window.HOURS_ALLOWED_PER_DAY_FLYING
    );
    const flyLodgingKodiak = (totals.totalEmployees + 2) * window.ACCOMMODATIONS_PER_PERSON * flyNumDaysKodiak;
    const flyTotalKodiak = tripTotals.flyDistanceCostKodiak + flyLodgingKodiak;
    const totalTimeAwayKodiak = tripTotals.flyHoursKodiak + tripTotals.hoursAtDest;

    const summary = {
      ...totals,
      hoursAtDestination: tripTotals.hoursAtDest,
      driveHours: tripTotals.driveHours,
      totalTimeAwayDrive,
      driveDistanceCost: tripTotals.driveDistanceCost,
      numDays: driveNumDays,
      driveLodging,
      driveEmployeeTotal: tripTotals.driveEmployeeTotal,
      driveTotal,
      flyHoursKingAir: tripTotals.flyHoursKingAir,
      totalTimeAwayKingAir,
      flyDistanceCostKingAir: tripTotals.flyDistanceCostKingAir,
      flyNumDaysKingAir,
      flyLodgingKingAir,
      flyTotalKingAir,
      flyHoursKodiak: tripTotals.flyHoursKodiak,
      totalTimeAwayKodiak,
      flyDistanceCostKodiak: tripTotals.flyDistanceCostKodiak,
      flyNumDaysKodiak,
      flyLodgingKodiak,
      flyTotalKodiak
    };

    window.renderTotals(dom, summary);
    window.renderBreakdownTable(dom, summary, {
      label: trips.length > 1 ? "All trips" : trips[0].label,
      driveMiles: tripTotals.driveMiles,
      flyMiles: tripTotals.flyMiles
    }, inputs);
  };

  dom.directorsInput.addEventListener("input", scheduleRecalc);
  dom.managersInput.addEventListener("input", scheduleRecalc);
  dom.generalistsInput.addEventListener("input", scheduleRecalc);
  dom.addCityPairButton.addEventListener("click", () => {
    addCityPair();
    scheduleRecalc();
  });
  dom.removeCityPairButton.addEventListener("click", removeCityPair);

  window.initRoleLabels(dom);
  addCityPair();
  window.clearResults(dom);
})();
