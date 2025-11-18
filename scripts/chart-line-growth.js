// --- NEW FUNCTION TO DRAW THE LINE CHART ---
export async function drawRidershipLineChart() {
    try {
        // 1. Load the new summary data
        const data = await d3.json("../data/corridor_growth_data.json");

        // 2. Define chart dimensions and margins
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // 3. Create the SVG container
        const svg = d3.select("#ridership-line-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Set up scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data[0].values, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.max(d.values, v => v.ridership))])
            .range([height, 0])
            .nice();

        // Your 6-color palette
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.corridor))
            .range(["#e11845", "#ff00bd", "#f2ca19", "#87E911", "#0057e9", "#8931EF"]);

        // 5. Add Axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(data[0].values.length).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d / 1000}k`));

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Avg. Daily Weekday Ridership");

        // 6. Define the line generator
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.ridership));

        // 7. Draw the lines
        const lineGroup = svg.append("g")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("class", "line-path")
            .attr("id", d => `line-${d.corridor.replace(/[\s/]+/g, '-')}`)
            .attr("d", d => line(d.values))
            .style("stroke", d => colorScale(d.corridor));

        // --- 8. Add Chart Legend (UPDATED CLICK LOGIC) ---
        const legend = svg.append("g")
            .attr("transform", `translate(0, -20)`);

        let cumulativeWidth = 0;
        const legendPadding = 25;

        const legendItems = legend.selectAll("g")
            .data(data)
            .join("g")
            .attr("class", "line-chart-legend")
            .on("click", (event, d) => {
                // --- THIS IS THE CORRECTED LOGIC ---
                const clickedLabel = d3.select(event.currentTarget).select(".legend-label");
                const clickedLineID = `#line-${d.corridor.replace(/[\s/]+/g, '-')}`;

                // Check if the clicked item is currently selected (i.e., not faded)
                const isAlreadySelected = !clickedLabel.classed("faded");

                // Check if any *other* items are faded
                const fadedCount = d3.selectAll(".line-chart-legend .legend-label.faded").size();

                // Restore all lines if:
                // 1. The clicked item is *already selected*
                // 2. And, there are *other* items that are currently faded.
                if (isAlreadySelected && fadedCount > 0) {
                    // Restore all lines
                    d3.selectAll(".line-path").classed("faded", false);
                    d3.selectAll(".legend-label").classed("faded", false);
                } else {
                    // Isolate this one line
                    // First, fade everything
                    d3.selectAll(".line-path").classed("faded", true);
                    d3.selectAll(".legend-label").classed("faded", true);

                    // Then, un-fade the clicked one
                    d3.select(clickedLineID).classed("faded", false);
                    clickedLabel.classed("faded", false);
                }
            });

        // Use .each() to dynamically set positions
        legendItems.each(function (d) {
            const g = d3.select(this); // 'this' is the <g> element

            // Add the rect
            g.append("rect")
                .attr("x", 0)
                .attr("y", -10)
                .attr("width", 15)
                .attr("height", 10)
                .attr("fill", d => colorScale(d.corridor));

            // Add the text
            g.append("text")
                .attr("class", "legend-label")
                .attr("x", 20)
                .attr("y", 0)
                .text(d => d.corridor);

            // Get the total width of *this* <g> element
            const itemWidth = this.getBBox().width;

            // Set the transform based on the cumulative width
            g.attr("transform", `translate(${cumulativeWidth}, 0)`);

            // Update the cumulative width for the next item
            cumulativeWidth += itemWidth + legendPadding;
        });

    } catch (error) {
        console.error("Error drawing ridership line chart:", error);
    }
}