export async function drawRidershipLineChart() {
    try {
        const data = await d3.json("../data/corridor_growth_data.json");
        const baseWidth = 800;
        const baseHeight = 500;
        const margin = { top: 30, right: 30, bottom: 50, left: 80 };
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;

        const svg = d3.select("#ridership-line-chart")
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(data[0].values, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.max(d.values, v => v.ridership))])
            .range([height, 0])
            .nice();

        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.corridor))
            .range(["#e11845", "#f2ca19", "#8931EF", "#87E911", "#0057e9", "#ff00bd"]);

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
            .attr("y", 0 - margin.left + 25)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Avg. Daily Weekday Ridership");

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.ridership));

        const lineGroup = svg.append("g")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("class", "line-path")
            .attr("id", d => `line-${d.corridor.replace(/[\s/]+/g, '-')}`)
            .attr("d", d => line(d.values))
            .style("stroke", d => colorScale(d.corridor));

        const legend = svg.append("g")
            .attr("transform", `translate(0, -20)`);

        let cumulativeWidth = 0;
        const legendPadding = 25;

        const legendItems = legend.selectAll("g")
            .data(data)
            .join("g")
            .attr("class", "line-chart-legend")
            .on("click", (event, d) => {
                const clickedLabel = d3.select(event.currentTarget).select(".legend-label");
                const clickedLineID = `#line-${d.corridor.replace(/[\s/]+/g, '-')}`;

                const isAlreadySelected = !clickedLabel.classed("faded");
                const fadedCount = d3.selectAll(".line-chart-legend .legend-label.faded").size();

                if (isAlreadySelected && fadedCount > 0) {
                    d3.selectAll(".line-path").classed("faded", false);
                    d3.selectAll(".legend-label").classed("faded", false);
                } else {
                    d3.selectAll(".line-path").classed("faded", true);
                    d3.selectAll(".legend-label").classed("faded", true);

                    d3.select(clickedLineID).classed("faded", false);
                    clickedLabel.classed("faded", false);
                }
            });

        legendItems.each(function (d) {
            const g = d3.select(this);

            g.append("rect")
                .attr("x", 0)
                .attr("y", -10)
                .attr("width", 15)
                .attr("height", 10)
                .attr("fill", d => colorScale(d.corridor));

            g.append("text")
                .attr("class", "legend-label")
                .attr("x", 20)
                .attr("y", 0)
                .text(d => d.corridor);

            const itemWidth = this.getBBox().width;
            g.attr("transform", `translate(${cumulativeWidth}, 0)`);
            cumulativeWidth += itemWidth + legendPadding;
        });

    } catch (error) {
        console.error("Error drawing ridership line chart:", error);
    }
}