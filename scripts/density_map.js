/* Add this to your main.js */

// Wait for the DOM to be fully loaded before running D3 code
window.addEventListener('DOMContentLoaded', () => {

    // Use an async function for easy data loading
    (async () => {

        // --- 1. Load Data ---
        const geoJsonFile = "data/sf_tracts_with_density.geojson";
        const waterFile = "data/sf_water.geojson";
        const landFile = "data/sf_county_boundary.geojson";
        const gearyRouteFile = "data/geary_route.geojson";
        const railFile = "data/sfmta_rail_lines.geojson"; // (Using your correct filename)
        const bartStationsFile = "data/sf_bart_stations.geojson";

        let sfData, waterData, landData, gearyRouteData, railData, bartStationsData;
        try {
            // Load ALL SIX files
            [sfData, waterData, landData, gearyRouteData, railData, bartStationsData] = await Promise.all([
                d3.json(geoJsonFile),
                d3.json(waterFile),
                d3.json(landFile),
                d3.json(gearyRouteFile),
                d3.json(railFile),
                d3.json(bartStationsFile)
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
            document.getElementById("map-container").innerHTML =
                `<p style="color: red;"><strong>Error:</strong> Could not load all data files.<br>
                One of your files is missing or misspelled in the 'data' folder. Please check all 6 filenames.</p>`;
            return;
        }

        // --- 2. Filter Data for Projection ---
        const filteredSfData = {
            ...sfData,
            features: sfData.features.filter(d => d.properties.population > 0)
        };

        // --- 3. Setup SVG and Dimensions ---
        const svg = d3.select("#sf-map");
        const width = svg.attr("width");
        const height = svg.attr("height");

        // --- 4. Create Projection and Path ---
        const projection = d3.geoMercator()
            .fitSize([width, height], filteredSfData);

        const pathGenerator = d3.geoPath().projection(projection);

        // --- 5. Prepare BART Line Data (NEW) ---
        // Manually define the order of stations from north to south
        const bartLineOrder = [
            "Embarcadero",
            "Montgomery St",
            "Powell St",
            "Civic Center/UN Plaza",
            "16th St/Mission",
            "24th St/Mission",
            "Glen Park",
            "Balboa Park"
        ];

        // Create a lookup Map for easy access
        const stationLookup = new Map(
            bartStationsData.features.map(f => [f.properties.Name, f.geometry.coordinates])
        );

        // Create an array of [long, lat] coordinates in the correct order
        const bartLineCoords = bartLineOrder
            .map(name => stationLookup.get(name))
            .filter(coords => coords); // Filter out any missing stations

        // Create a GeoJSON-like feature for our line
        const bartLineFeature = {
            type: "LineString",
            coordinates: bartLineCoords
        };

        // --- 6. Create Color Scale ---
        const colorScheme = d3.schemeYlOrRd[9];
        const thresholds = [5000, 10000, 20000, 30000, 40000, 50000, 75000, 100000];
        const colorScale = d3.scaleThreshold().domain(thresholds).range(colorScheme);

        // --- 7. Create Tooltip ---
        const tooltip = d3.select("#tooltip");
        const handleMouseOver = (event, d) => {
            const density = d.properties.population_density_sq_mi;
            tooltip
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`
                    <strong>Tract:</strong> ${d.properties.name}<br>
                    <strong>Density:</strong> ${density ? density.toFixed(0) : 0} people/mi²<br>
                    <strong>Population:</strong> ${d.properties.population}
                `);
        };
        const handleMouseLeave = () => {
            tooltip.style("opacity", 0);
        };

        // --- 8. Define the Land Mask ---
        svg.append("defs")
            .append("clipPath")
            .attr("id", "land-mask")
            .selectAll("path")
            .data(landData.features)
            .join("path")
            .attr("d", pathGenerator);


        // --- 9. Draw the Map (Tract FILL Layer) - CLIPPED ---
        const tractsFillGroup = svg.append("g")
            .attr("clip-path", "url(#land-mask)");

        tractsFillGroup.selectAll("path")
            .data(sfData.features)
            .join("path")
            .attr("class", "tract-fill")
            .attr("d", pathGenerator)
            .attr("fill", d => {
                const density = d.properties.population_density_sq_mi;
                return (density && density > 0) ? colorScale(density) : "lightblue";
            })
            .style("pointer-events", "none");

        // --- 10. Draw the Inland Water Layer (ON TOP of fill) ---
        svg.append("g")
            .selectAll("path")
            .data(waterData.features)
            .join("path")
            .attr("d", pathGenerator)
            .attr("fill", "lightblue")
            .style("stroke", "lightblue")
            .style("stroke-width", "1px")
            .style("pointer-events", "none");

        // --- 14. Draw the Tract INTERACTION Layer - UNCLIPPED ---
        svg.append("g")
            .selectAll("path")
            .data(sfData.features)
            .join("path")
            .attr("class", "tract")
            .attr("d", pathGenerator)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", handleMouseOver)
            .on("mouseleave", handleMouseLeave);

        // --- 11. Draw the Light Rail Lines ---
        const railLayer = svg.append("g")
            .attr("id", "rail-layer")
            .selectAll("path")
            .data(railData.features)
            .join("path")
            .attr("d", pathGenerator)
            .style("fill", "none")
            .style("stroke", "#555")
            .style("stroke-width", "2px")
            .style("stroke-opacity", 0.7)
            .style("pointer-events", "none");

        // --- 12. Draw the Geary Route ---
        const gearyLayer = svg.append("g")
            .attr("id", "geary-route-layer")
            .selectAll("path")
            .data(gearyRouteData.features)
            .join("path")
            .attr("d", pathGenerator)
            .style("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", "2.5px")
            .style("stroke-opacity", 0.75)
            .style("pointer-events", "none");

        // --- 13. Draw BART Layer (Lines and Stations) (UPDATED) ---
        const bartLayer = svg.append("g")
            .attr("id", "bart-layer");

        // Draw the NEW generated line
        bartLayer.append("path")
            .datum(bartLineFeature) // Bind our new line feature
            .attr("class", "bart-line-generated")
            .attr("d", pathGenerator); // Use the path generator

        // Draw the stations
        bartLayer.selectAll(".bart-station") // Use a class to avoid conflicts
            .data(bartStationsData.features)
            .join("path")
            .attr("class", "bart-station")
            .attr("d", pathGenerator.pointRadius(2))
            .style("pointer-events", "none");

        // --- 15. Draw the Legend ---
        const legend = d3.select("#legend");
        const legendThresholds = colorScale.domain();
        const legendColors = colorScale.range();

        legend.selectAll(".legend-item").remove();
        legend.select(".legend-title").remove();

        legend.append("div")
            .attr("class", "legend-title")
            .text("Population per mi²");

        const legendItems = legend.append("div")
            .style("display", "flex")
            .style("flex-direction", "row");

        legendItems.append("div")
            .attr("class", "legend-item")
            .html(`
                <div class="legend-color" style="background-color: ${legendColors[0]}"></div>
                <div class="legend-label"> &lt; ${legendThresholds[0]}</div>
            `);

        for (let i = 0; i < legendThresholds.length; i++) {
            const from = legendThresholds[i];
            legendItems.append("div")
                .attr("class", "legend-item")
                .html(`
                    <div class="legend-color" style="background-color: ${legendColors[i + 1]}"></div>
                    <div class="legend-label">${from}</div>
                `);
        }

        // --- 16. Add Toggle Event Listeners (UPDATED) ---
        d3.select("#toggle-geary").on("change", function () {
            d3.select("#geary-route-layer")
                .style("display", this.checked ? null : "none");
        });

        d3.select("#toggle-rail").on("change", function () {
            d3.select("#rail-layer")
                .style("display", this.checked ? null : "none");
        });

        // This one toggle now controls the *entire* bartLayer group
        d3.select("#toggle-bart").on("change", function () {
            d3.select("#bart-layer")
                .style("display", this.checked ? null : "none");
        });

    })(); // End of async function

}); // End of DOMContentLoaded