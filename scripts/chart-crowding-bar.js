export async function drawCrowdingChart() {
    try {
        // 1. Load the new summary data
        const data = await d3.json("../data/corridor_crowding_peak.json");

        // 2. Define chart dimensions and margins (UPDATED)
        const baseWidth = 800;
        const baseHeight = 600;
        const margin = { top: 20, right: 200, bottom: 50, left: 200 }; // Symmetrical
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;

        // 3. Create the SVG container (UPDATED)
        const svg = d3.select("#crowding-chart")
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Select the Tooltip
        const tooltip = d3.select("#tooltip");

        // 5. Set up scales
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.ROUTE_NAME))
            .range([0, height])
            .padding(0.1);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Max_Peak_Crowding_Prc)])
            .range([0, width])
            .nice();

        const colorScale = d3.scaleOrdinal()
            .domain(["Geary Route", "Other Route"])
            .range(["#e11845", "#aaa"]);

        // 6. Define Tooltip Handlers
        const handleMouseOver = (event, d) => {
            tooltip
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`
                    <strong>${d.ROUTE_NAME}</strong><br>
                    ${d.Max_Peak_Crowding_Prc.toFixed(1)}% of peak trips are crowded
                `);
            d3.select(event.currentTarget).style("fill", "#555");
        };

        const handleMouseLeave = (event, d) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget).style("fill", colorScale(d.Highlight));
        };

        // 7. Draw the bars
        svg.selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.ROUTE_NAME))
            .attr("x", xScale(0))
            .attr("width", d => xScale(d.Max_Peak_Crowding_Prc))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.Highlight))
            .on("mouseover", handleMouseOver)
            .on("mouseleave", handleMouseLeave);

        // 8. Add Y-axis
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale));

        // 9. Add X-axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`));

        // Add X-axis title
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 3)
            .attr("text-anchor", "middle")
            .text("Max Peak Crowding (AM Inbound or PM Outbound, 2024)");

    } catch (error) {
        console.error("Error drawing crowding chart:", error);
    }
}