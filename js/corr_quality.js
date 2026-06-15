// Set the dimensions and margins for the parallel coordinates plot
var marginPC = { top: 30, right: 50, bottom: 10, left: 75 },
    widthPC = 600 - marginPC.left - marginPC.right,
    heightPC = 400 - marginPC.top - marginPC.bottom;

// Append the SVG object to the parallel coordinates div
var svgPC = d3.select("#parallel_coordinates")
    .append("svg")
    .attr("width", widthPC + marginPC.left + marginPC.right)
    .attr("height", heightPC + marginPC.top + marginPC.bottom)
    .append("g")
    .attr("transform", "translate(" + marginPC.left + "," + marginPC.top + ")");

// Parse the Data for parallel coordinates
d3.csv("data/corr_quality_exports.csv", function (dataPC) {

    // Color scale for parallel coordinates
    var colorPC = d3.scaleOrdinal()
        .domain(dataPC.map(d => d.Country))
        .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]);

    // Dimensions for parallel coordinates
    var dimensionsPC = ['Country', 'Aroma', 'Flavor', 'Aftertaste', 'Acidity', 'Balance', 'Sweetness'];

    // Y scales for parallel coordinates
    var yPC = {};
    dimensionsPC.forEach(function (dim) {
        if (dim === 'Country') {
            yPC[dim] = d3.scalePoint()
                .domain(dataPC.map(d => d[dim]))
                .range([heightPC, 0]);
        } else {
            yPC[dim] = d3.scaleLinear()
                .domain([-1, 1])
                .range([heightPC, 0]);
        }
    });

    // X scale for parallel coordinates
    var xPC = d3.scalePoint()
        .range([0, widthPC])
        .domain(dimensionsPC);

    // Function to draw paths for parallel coordinates
    var pathPC = function (d) {
        return d3.line()(dimensionsPC.map(function (p) { return [xPC(p), yPC[p](d[p])]; }));
    };

    // Draw lines for parallel coordinates
    svgPC.selectAll(".line")
        .data(dataPC)
        .enter().append("path")
        .attr("class", function (d) { return "line " + d.Country.replace(/\s/g, '_'); })
        .attr("d", pathPC)
        .style("fill", "none")
        .style("stroke", function (d) { return colorPC(d.Country); })
        .style("stroke-width", 2)
        .style("opacity", 0.5)
        .on("mouseover", highlightPC)
        .on("mouseleave", doNotHighlightPC)
        .on("click", updateScatterplotFromPC); // Add click event listener

    // Draw axes for parallel coordinates
    svgPC.selectAll(".axis")
        .data(dimensionsPC)
        .enter().append("g")
        .attr("class", "axis")
        .attr("transform", function (d) { return "translate(" + xPC(d) + ")"; })
        .each(function (d) {
            d3.select(this).call(d3.axisLeft().ticks(5).scale(yPC[d]));
        })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) { return d; })
        .style("fill", "black");

    // Highlight function for parallel coordinates
    function highlightPC(d) {
        var selected_country = d.Country;
        d3.selectAll(".line")
            .transition().duration(200)
            .style("stroke", "lightgrey")
            .style("opacity", "0.2");
        d3.selectAll("." + selected_country.replace(/\s/g, '_'))
            .transition().duration(200)
            .style("stroke", colorPC(selected_country))
            .style("opacity", "1");

        // Update dropdown selection if needed
        d3.select("#country-select-sp").property('value', selected_country);


        var filteredDataSP = dataSP.filter(function (data) {
            return data.Country === selected_country;
        });

        // Update scatterplot with filtered data
        updateScatterplotSP(filteredDataSP);
                    
    }

    // Unhighlight function for parallel coordinates
    function doNotHighlightPC() {
        d3.selectAll(".line")
            .transition().duration(200)
            .style("stroke", function (d) { return colorPC(d.Country); })
            .style("opacity", 0.5);
    }

    // Function to update scatterplot from parallel coordinates
    function updateScatterplotFromPC(d) {
        var selected_country = d.Country;

        // Update dropdown selection if needed
        d3.select("#country-select-sp").property('value', selected_country);

        // Trigger scatterplot update
        updateScatterplotSP(selected_country);
    }

    // Add mouseover and mouseout events to country names on the parallel coordinates axes
    svgPC.selectAll(".axis text")
        .on("mouseover", function (d) {
            highlightPC({ Country: d });
        })
        .on("mouseout", function (d) {
            doNotHighlightPC();
        });

});

// Set the dimensions and margins for the scatterplot
var marginSP = { top: 30, right: 150, bottom: 50, left: 60 },
    widthSP = 600 - marginSP.left - marginSP.right,
    heightSP = 400 - marginSP.top - marginSP.bottom;

// Append the SVG object to the scatterplot div
var svgSP = d3.select("#scatterplot")
    .append("svg")
    .attr("width", widthSP + marginSP.left + marginSP.right)
    .attr("height", heightSP + marginSP.top + marginSP.bottom)
    .append("g")
    .attr("transform", "translate(" + marginSP.left + "," + marginSP.top + ")");

// Parse the Data for scatterplot
d3.csv("data/quality_exports.csv", function (dataSP) {

    // Get unique countries for dropdown
    var countriesSP = d3.map(dataSP, function (d) { return d.Country; }).keys().sort();

    // Create dropdown for scatterplot
    var dropdownSP = d3.select("#scatterplot")
        .append("select")
        .attr("id", "country-select-sp");

    dropdownSP.selectAll("option")
        .data(countriesSP)
        .enter().append("option")
        .text(function (d) { return d; });

    // Set initial country for scatterplot
    var selectedCountrySP = "Brazil"; // Definir o país inicial aqui

    // Update scatterplot initially with Brazil
    updateScatterplotSP(selectedCountrySP);

    // Update scatterplot when country is changed
    dropdownSP.on("change", function () {
        selectedCountrySP = this.value;
        updateScatterplotSP(selectedCountrySP);
    });

        // Function to update scatterplot
    function updateScatterplotSP(country) {
        var filteredDataSP = dataSP.filter(function (d) { return d.Country === country; });

        var minYSP = d3.min(filteredDataSP, function (d) { return +d.Exports; }) * 0.9;
        var ySP = d3.scaleLinear()
            .domain([minYSP, d3.max(filteredDataSP, function (d) { return +d.Exports; }) * 1.1])
            .range([heightSP, 0]);

        var qualitiesSP = ['Aroma', 'Flavor', 'Aftertaste', 'Acidity', 'Balance', 'Sweetness'];
        var minXSP = d3.min(filteredDataSP, function (d) { return d3.min(qualitiesSP, function (quality) { return +d[quality]; }); }) * 0.9;
        var maxXSP = d3.max(filteredDataSP, function (d) { return d3.max(qualitiesSP, function (quality) { return +d[quality]; }); });
        var xSP = d3.scaleLinear()
            .domain([minXSP, maxXSP])
            .range([0, widthSP]);

        svgSP.selectAll(".dot").remove();
        svgSP.selectAll(".x-axis").remove();
        svgSP.selectAll(".y-axis").remove();
        svgSP.selectAll(".axis-label").remove();  // Remove existing axis labels

        svgSP.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + heightSP + ")")
            .call(d3.axisBottom(xSP));

        svgSP.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(ySP));

        // Add X axis label
        svgSP.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "end")
            .attr("x", widthSP / 2 + 20)
            .attr("y", heightSP + marginSP.top + 10)
            .text("Quality Score")
            .style("font-size", "12px");

        // Add Y axis label
        svgSP.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -marginSP.left + 10)
            .attr("x", -heightSP / 2)
            .text("Exports")
            .style("font-size", "12px");

        var tooltipSP = d3.select("#scatterplot").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        qualitiesSP.forEach(function (quality) {
            svgSP.selectAll(".dot-" + quality)
                .data(filteredDataSP)
                .enter().append("circle")
                .attr("class", "dot dot-" + quality)
                .attr("cx", function (d) { return xSP(+d[quality]); })
                .attr("cy", function (d) { return ySP(+d.Exports); })
                .attr("r", 5)
                .style("fill", function (d) { return getColorSP(quality); })
                .on("mouseover", function (d) {
                    tooltipSP.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltipSP.html("<strong>Quality:</strong> " + quality + "<br><strong>Score:</strong> " + (+d[quality]).toFixed(2) + "<br><strong>Exports:</strong> " + (+d.Exports).toFixed(0))
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 50) + "px");

                    // Highlight same quality dots
                    d3.selectAll(".dot")
                        .transition().duration(200)
                        .style("opacity", 0.2);
                    d3.selectAll(".dot-" + quality)
                        .transition().duration(200)
                        .style("opacity", 1);
                })
                .on("mouseout", function (d) {
                    tooltipSP.transition()
                        .duration(500)
                        .style("opacity", 0);

                    // Reset opacity of all dots
                    d3.selectAll(".dot")
                        .transition().duration(200)
                        .style("opacity", 1);
                });
        });

        var legendSP = svgSP.selectAll(".legend")
            .data(qualitiesSP)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return "translate(" + (widthSP + 20) + "," + i * 20 + ")"; });

        legendSP.append("rect")
            .attr("x", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", function (d) { return getColorSP(d); });

        legendSP.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function (d) { return d; });

        function getColorSP(quality) {
            var colorScaleSP = d3.scaleOrdinal()
                .domain(['Aroma', 'Flavor', 'Aftertaste', 'Acidity', 'Balance', 'Sweetness'])
                .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']);
            return colorScaleSP(quality);
        }
    }

});