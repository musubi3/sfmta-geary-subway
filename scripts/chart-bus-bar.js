export async function drawRidershipChart() {
    try {
        // 1. Load the new summary data
        const data = await d3.json("../data/corridor_ridership_summary.json");

        // 2. Define chart dimensions and margins (UPDATED)
        const baseWidth = 800;
        const baseHeight = 500;
        const margin = { top: 20, right: 30, bottom: 50, left: 120 };
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;

        // 3. Create the SVG container (UPDATED)
        const svg = d3.select("#ridership-chart")
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Select the Tooltip
        const tooltip = d3.select("#tooltip");

        // 5. Define keys for stacking
        const stackKeys = ["Bus_Ridership", "BART_Ridership"];

        // 6. Create the stack generator
        const stack = d3.stack()
            .keys(stackKeys)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(data);

        // 7. Set up scales
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.Corridor))
            .range([0, height])
            .padding(0.15);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Total_Ridership)])
            .range([0, width])
            .nice();

        const colorScale = d3.scaleOrdinal()
            .domain(stackKeys)
            .range(["#aaa", "#0099D8"])
            .unknown("#ccc");

        // 8. Transpose data for corridor grouping
        const corridorData = data.map((corridor, i) => {
            return {
                corridor: corridor.Corridor,
                segments: [
                    stackedData[0][i], // bus segment
                    stackedData[1][i]  // bart segment
                ]
            };
        });

        // 9. Define Tooltip Handlers
        const handleMouseOver = (event, d) => {
            const corridor = d.data.Corridor;
            const value = d[1] - d[0];

            let key = "Bus_Ridership";
            if (value === d.data.BART_Ridership || (value === 0 && d.data.BART_Ridership === 0)) {
                key = "BART_Ridership";
            }

            tooltip
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`
                    <strong>${corridor}</strong><br>
                    ${key === 'Bus_Ridership' ? 'Muni Bus' : 'BART'}: ${Math.round(value).toLocaleString()}
                `);
        };

        const handleMouseLeave = () => {
            tooltip.style("opacity", 0);
        };

        // 10. Draw the stacked bars
        const corridorGroup = svg.append("g")
            .selectAll("g")
            .data(corridorData)
            .join("g")
            .attr("class", "corridor-group")
            .attr("transform", d => `translate(0, ${yScale(d.corridor)})`);

        corridorGroup.selectAll("rect")
            .data(d => d.segments)
            .join("rect")
            .attr("x", d => xScale(d[0]))
            .attr("width", d => xScale(d[1]) - xScale(d[0]))
            .attr("height", yScale.bandwidth())
            .attr("fill", (d, i) => colorScale(stackKeys[i]))
            .on("mouseover", handleMouseOver)
            .on("mouseleave", handleMouseLeave);

        // 11. Add Y-axis
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale));

        // 12. Add X-axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(",")));

        // Add X-axis title
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 3)
            .attr("text-anchor", "middle")
            .text("Average Daily Weekday Ridership (2024)");

        // 13. Add Chart Legend
        const legend = svg.append("g")
            .attr("transform", `translate(0, -20)`);

        legend.selectAll("rect")
            .data(stackKeys)
            .join("rect")
            .attr("x", (d, i) => i * 100)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d));

        legend.selectAll("text")
            .data(stackKeys)
            .join("text")
            .attr("class", "chart-legend")
            .attr("x", (d, i) => i * 100 + 20)
            .attr("y", 13)
            .text(d => (d === "Bus_Ridership" ? "Muni Bus" : "BART"));

    } catch (error) {
        console.error("Error drawing ridership chart:", error);
    }
}