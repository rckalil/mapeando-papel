function lineChartFunction(selectedVariable) {
    console.log("Line Chart Function: " + selectedVariable);
    d3.select(".lineChart").selectAll("*").remove();

    // Define the dimensions and margins of the graph
    const margin = { top: 50, right: 50, bottom: 30, left: 50 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select(".lineChart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

    // Read the data
    d3.csv("data/psd_coffee_clean.csv", function(data) {
        // Filter the data
        var filterData = data.filter(d => d["Country"] === "Brazil"); // Example: Filter by Brazil

        // Group data by year and calculate average
        var sumStat = d3.nest()
            .key(function(d) { return d.Year; })
            .rollup(function(leaves) {
                return d3.mean(leaves, function(d) {
                    return parseFloat(d[selectedVariable]);
                });
            }).entries(filterData);

        // Add X axis
        const x = d3.scaleLinear()
            .domain(d3.extent(filterData, function(d) { return d.Year; }))
            .range([ 0, width ]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(sumStat, function(d) { return +d.value; })])
            .range([ height, 0 ]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add the line
        svg.append("path")
            .datum(sumStat)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(d.key) })
                .y(function(d) { return y(d.value) })
            );
    });
}