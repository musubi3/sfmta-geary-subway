import { drawRidershipChart } from "./chart-bus-bar.js";
import { drawDensityMap } from "./chart-density-map.js";

window.addEventListener('DOMContentLoaded', async function() {
    await drawDensityMap();
    await drawRidershipChart();
});