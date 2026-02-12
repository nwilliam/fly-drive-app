const cacheDom = () => ({
  cityPairs: document.getElementById("city-pairs"),
  cityPairTemplate: document.getElementById("city-pair-template"),
  addCityPairButton: document.getElementById("add-city-pair"),
  removeCityPairButton: document.getElementById("remove-city-pair"),
  tripOptions: document.getElementById("trip-options"),
  roundTripToggle: document.getElementById("round-trip-toggle"),
  resultsHeading: document.getElementById("results-heading"),
  directorsLabel: document.getElementById("directors-label"),
  managersLabel: document.getElementById("managers-label"),
  generalistsLabel: document.getElementById("generalists-label"),
  directorsTooltip: document.getElementById("directors-tooltip"),
  managersTooltip: document.getElementById("managers-tooltip"),
  generalistsTooltip: document.getElementById("generalists-tooltip"),
  directorsInput: document.getElementById("directors"),
  managersInput: document.getElementById("managers"),
  generalistsInput: document.getElementById("generalists"),
  driveTotal: document.getElementById("drive-total"),
  flyTotal: document.getElementById("fly-total"),
  flyTotalKodiak: document.getElementById("fly-total-kodiak"),
  breakdownTable: document.getElementById("breakdownTable")
});

window.cacheDom = cacheDom;
