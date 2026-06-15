
function lineChartFunction() {
console.log("Line Chart Function");
d3.select(".lineChart").selectAll("*").remove();
d3.select(".chart-container").selectAll("*").remove();
d3.select(".chart-container").remove();
// set the dimensions and margins of the graph
const margin = { top: 50, right: 30, bottom: 30, left: 40 },
    width = 700 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom,
    legendWidth = 100,
    legendHeight = 100;


const country = document.querySelector("ul#my-list li.active").textContent;
console.log(country);

//Read the data
d3.csv("data/Coffee_Qlty.csv").then(function (data) {

    /// Filter the data
    var filterDataBoth = data.filter(function (d) { return d["Country.of.Origin"] == country && d["Harvest.Year"] != 0; });
    var filterDataArabica = data.filter(function (d) { return d["Country.of.Origin"] == country && d["Species"] == "Arabica" && d["Harvest.Year"] != 0; });
    var filterDataRobusta = data.filter(function (d) { return d["Country.of.Origin"] == country && d["Species"] == "Robusta" && d["Harvest.Year"] != 0; });
    var filterData = filterDataBoth;

    // Transform the data
    var variables = ["Aroma", "Flavor", "Aftertaste", "Acidity", "Balance", "Sweetness"];

/*
// Add legend
const svg = d3.select("body")
.append("div")
.attr("class", "chart-container")
.append("svg")
.attr("width", width + margin.left + margin.right + legendWidth)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
    `translate(${margin.left},${margin.top})`);

var legend = svg.append("g")
.attr("class", "legend")
.attr("transform", "translate(" + (width + 10) + ",0)");

var legendColors = ["steelblue", "green", "red"];
var legendTexts = ["Both", "Arabica", "Robusta"];

legend.selectAll("rect")
.data(legendColors)
.enter()
.append("rect")
.attr("y", function (d, i) { return i * 20; })
.attr("width", 18)
.attr("height", 18)
.style("fill", function (d) { return d; });

legend.selectAll("text")
.data(legendTexts)
.enter()
.append("text")
.attr("x", 25)
.attr("y", function (d, i) { return i * 20 + 9; })
.attr("dy", ".35em")
.text(function (d) { return d; });
*/
    variables.forEach(function (variable, index) {
        var tranData = [];
        var groups = Array.from(new Set(filterDataBoth.map(d => d["Harvest.Year"])));

        groups.forEach(function (group) {
            var values = filterDataBoth.filter(function (d) { return d["Harvest.Year"] == group; })
                .map(function (d) { return +d[variable]; });
            var average = d3.mean(values);
            var obj = {
                group: +group,
                value: average / 2,
                species: "Both"
            };
            tranData.push(obj);
        });

        groups = Array.from(new Set(filterDataArabica.map(d => d["Harvest.Year"])));

        groups.forEach(function (group) {
            var values = filterDataArabica.filter(function (d) { return d["Harvest.Year"] == group; })
                .map(function (d) { return +d[variable]; });
            var average = d3.mean(values);
            var obj = {
                group: +group,
                value: average / 2,
                species: "Arabica"
            };
            tranData.push(obj);
        });

        groups = Array.from(new Set(filterDataRobusta.map(d => d["Harvest.Year"])));

        groups.forEach(function (group) {
            var values = filterDataRobusta.filter(function (d) { return d["Harvest.Year"] == group; })
                .map(function (d) { return +d[variable]; });
            var average = d3.mean(values);
            var obj = {
                group: +group,
                value: average / 2,
                species: "Robusta"
            };
            tranData.push(obj);
        });
        
        // Sort tranData by year
        tranData.sort(function (a, b) {
            return a.group - b.group; // Sort by year
        });

        // Add an svg element for each variable and legend
        const svg = d3.select(".lineChart")
            .append("div")
            .attr("class", "chart-container")
            .append("svg")
            .attr("class", "lineChart")
            .attr("width", width + margin.left + margin.right + legendWidth)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left},${margin.top})`);

                svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 0 - (margin.top / 2))
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .text("Progression over time for " +variable);

                svg.append("text")
                .attr("x", width+margin.right)
                .attr("y", height + margin.bottom)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Year");

                svg.append("text")
                .attr("x", 40)
                .attr("y", 0 - margin.left/2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Score(avg in the year)");

        // Filter unique years for "Both" species
        const uniqueYears = [...new Set(tranData.filter(d => d.species === "Both").map(d => d.group))];
        console.log(uniqueYears);

    // Add X axis
    const x = d3.scaleLinear()
        .domain([d3.min(uniqueYears), d3.max(uniqueYears)]) // Use unique years
        .range([0, width]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(d3.max(uniqueYears)-d3.min(uniqueYears)+1).tickFormat(d3.format("d"))); // Format tick as integer
        
            console.log(x.domain(), x.range());

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([3, 5])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".1f"))); // Set tick format to one decimal place

        // Draw the lines for each species
        var color = d3.scaleOrdinal()
            .domain(["Both", "Arabica", "Robusta"])
            .range(["#45240a", "#b66a22", "#e7caaf"]);


        color.domain().forEach(function (species) {
            svg.append("path")
            .datum(tranData.filter(function (d) { return d.species == species; }))
            .attr("fill", "none")
            .attr("stroke", color(species))
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(function (d) { return x(d.group); })
                .y(function (d) { return y(d.value); })
            );

            // Desenhar círculos para cada espécie
            svg.selectAll(".circle-" + species) // Use uma classe específica para cada espécie
            .data(tranData.filter(function (d) { return d.species == species; }))
            .enter()
            .append("circle")
            .attr("class", "circle-" + species) // Adicione uma classe específica para cada círculo
            .attr("cx", function (d) { return x(d.group); })
            .attr("cy", function (d) { return y(d.value); })
            .attr("r", 6)
            .style("fill", color(species))
            .attr("transform", function(d) {
            var noiseX = Math.random() * 10 - 2;
            return "translate(" + noiseX + "," + 0 + ")";
            });

        });


    
    });



});
};