export async function drawDensityMap() {
    const geoJsonFile = "data/sf_map_data.json";
    const waterFile = "data/sf_water.geojson";
    const landFile = "data/sf_county_boundary.geojson";
    const gearyRouteFile = "data/geary_route.geojson";
    const railFile = "data/sfmta_rail_lines.geojson";
    const bartStationsFile = "data/sf_bart_stations.geojson";

    let sfData, waterData, landData, gearyRouteData, railData, bartStationsData;
    try {
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
                Please check your 'data' folder. The main map file should be 'sf_map_data.json'.</p>`;
        return;
    }

    const filteredSfData = {
        ...sfData,
        features: sfData.features.filter(d => d.properties.population > 0)
    };

    const baseWidth = 800;
    const baseHeight = 600;

    const svg = d3.select("#sf-map")
        .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator()
        .fitSize([baseWidth, baseHeight], filteredSfData);

    const pathGenerator = d3.geoPath().projection(projection);

    const bartLineOrder = [
        "West Oakland", "Embarcadero", "Montgomery St", "Powell St",
        "Civic Center/UN Plaza", "16th St/Mission", "24th St/Mission",
        "Glen Park", "Balboa Park", "Daly City"
    ];
    const stationLookup = new Map(
        bartStationsData.features.map(f => [f.properties.Name, f.geometry.coordinates])
    );
    const bartLineCoords = bartLineOrder.map(name => stationLookup.get(name)).filter(coords => coords);
    const bartLineFeature = { type: "LineString", coordinates: bartLineCoords };

    const densityColors = d3.schemeYlOrRd[9];
    const densityThresholds = [5000, 10000, 20000, 30000, 40000, 50000, 75000, 100000];
    const colorScaleDensity = d3.scaleThreshold().domain(densityThresholds).range(densityColors);

    const equityColors = d3.schemePurples[9];
    const equityThresholds = [10, 20, 30, 40, 50, 60, 70, 80];
    const colorScaleEquity = d3.scaleThreshold().domain(equityThresholds).range(equityColors);

    const tooltip = d3.select("#tooltip");
    const handleMouseOver = (event, d) => {
        const props = d.properties;
        const density = props.population_density_sq_mi;
        const equity = props.percent_no_vehicle;

        tooltip
            .style("opacity", 1)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .html(`
                    <strong>Tract:</strong> ${props.name}<br>
                    <hr style="border: 0; border-top: 1px solid var(--card-border); margin: 4px 0;">
                    <strong>Density:</strong> ${density ? density.toFixed(0) : 0} people/mi²<br>
                    <strong>Population:</strong> ${props.population}<br>
                    <strong>No-Vehicle HH:</strong> ${equity ? equity.toFixed(1) : 0}%
                `);
    };
    const handleMouseLeave = () => {
        tooltip.style("opacity", 0);
    };

    svg.append("defs")
        .append("clipPath")
        .attr("id", "land-mask")
        .selectAll("path")
        .data(landData.features)
        .join("path")
        .attr("d", pathGenerator);


    const tractsFillGroup = svg.append("g")
        .attr("clip-path", "url(#land-mask)");

    tractsFillGroup.selectAll("path")
        .data(sfData.features)
        .join("path")
        .attr("class", "tract-fill")
        .attr("d", pathGenerator)
        .style("pointer-events", "none");

    svg.append("g")
        .selectAll("path")
        .data(waterData.features)
        .join("path")
        .attr("d", pathGenerator)
        .attr("fill", "lightblue")
        .style("stroke", "lightblue")
        .style("stroke-width", "1px")
        .style("pointer-events", "none");

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

    const railLayer = svg.append("g").attr("id", "rail-layer");
    railLayer.selectAll("path").data(railData.features).join("path").attr("d", pathGenerator)
        .style("fill", "none").style("stroke", "#555").style("stroke-width", "2px")
        .style("stroke-opacity", 0.7).style("pointer-events", "none");

    const gearyLayer = svg.append("g").attr("id", "geary-route-layer");
    gearyLayer.selectAll("path").data(gearyRouteData.features).join("path")
        .attr("d", pathGenerator).style("fill", "none").style("stroke", "blue")
        .style("stroke-width", "2.5px").style("stroke-opacity", 0.75).style("pointer-events", "none");

    const bartLayer = svg.append("g").attr("id", "bart-layer");
    bartLayer.append("path").datum(bartLineFeature).attr("class", "bart-line-generated").attr("d", pathGenerator);
    bartLayer.selectAll(".bart-station").data(bartStationsData.features).join("path")
        .attr("class", "bart-station").attr("d", pathGenerator.pointRadius(2)).style("pointer-events", "none");

    const legend = d3.select("#legend");

    function drawLegend(title, colors, thresholds) {
        legend.selectAll("*").remove();

        legend.append("div")
            .attr("class", "legend-title")
            .text(title);

        const legendItems = legend.append("div")
            .style("display", "flex")
            .style("flex-direction", "row");

        legendItems.append("div")
            .attr("class", "legend-item")
            .html(`
                    <div class="legend-color" style="background-color: ${colors[0]}"></div>
                    <div class="legend-label"> &lt; ${thresholds[0]}</div>
                `);

        for (let i = 0; i < thresholds.length; i++) {
            const from = thresholds[i];
            legendItems.append("div")
                .attr("class", "legend-item")
                .html(`
                        <div class="legend-color" style="background-color: ${colors[i + 1]}"></div>
                        <div class="legend-label">${from}</div>
                    `);
        }
    }

    function updateMap() {
        const selectedView = d3.select('input[name="map-view"]:checked').property("value");

        if (selectedView === 'density') {
            svg.selectAll(".tract-fill")
                .data(sfData.features)
                .transition().duration(300)
                .attr("fill", d => {
                    const density = d.properties.population_density_sq_mi;
                    return (density && density > 0) ? colorScaleDensity(density) : "lightblue";
                });
            drawLegend("Population per mi²", densityColors, densityThresholds);

        } else { // 'equity'
            svg.selectAll(".tract-fill")
                .data(sfData.features)
                .transition().duration(300)
                .attr("fill", d => {
                    const equity = d.properties.percent_no_vehicle;
                    return (equity && equity > 0) ? colorScaleEquity(equity) : "lightblue";
                });
            drawLegend("% Households w/ No Vehicle", equityColors, equityThresholds);
        }
    }

    // --- 14. Add Toggle Event Listeners ---
    d3.select("#toggle-geary").on("change", function () {
        d3.select("#geary-route-layer").style("display", this.checked ? null : "none");
    });
    d3.select("#toggle-rail").on("change", function () {
        d3.select("#rail-layer").style("display", this.checked ? null : "none");
    });
    d3.select("#toggle-bart").on("change", function () {
        d3.select("#bart-layer").style("display", this.checked ? null : "none");
    });

    d3.selectAll('input[name="map-view"]').on("change", updateMap);

    // --- 15. Initial Draw ---
    updateMap();
}