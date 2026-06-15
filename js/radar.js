// Define the features you want to visualize in the radar chart
const features = ["AVG_Acidity", "AVG_Aftertaste", "AVG_Aroma", "AVG_Balance", "AVG_Flavor", "AVG_Sweetness"];

// Colors for different datasets
const colors = ["#45240a", "#b66a22", "#e7caaf"]; 


function radarFunction() {
    initializeRadar();
}


// Center the radar chart
function initializeRadar() {
    d3.select("#radarChart").selectAll("*").remove();
    svg = d3.select("#radarChart").append("svg")
        .attr("width", 600)
        .attr("height", 600)
        .attr("background-color", "green")
        .append("g")
        .attr("transform", "translate(300,300)");



    const country = document.querySelector("ul#my-list li.active").textContent;
    console.log(country);
    const tipo = document.querySelector("div#tipo button.button-active-tipo").textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log(tipo);
    renderRadarChart(country);
}
// Function to load CSV data and filter by country
function loadData(paths, country) {
    return Promise.all(paths.map(path => d3.csv(path)))
        .then(datasets => {
            return datasets.map((data, index) => {
                const filtered = data.filter(d => d.Country_of_Origin === country);
                return filtered.length > 0 ? prepareData(filtered[0]) : null;
            });
        });
}

// Prepare data for radar chart
function prepareData(data) {
    return features.map(feature => {
        return { axis: feature, value: +data[feature] };
    });
}

// Main function to render the radar chart
function renderRadarChart(country) {
    const csvPaths = [
        "data/Coffee_Qlty_By_Country_copy.csv",
        "data/Coffee_Qlty_By_Country_Arabica_copy.csv",
        "data/Coffee_Qlty_By_Country_Robusta_copy.csv"
    ];

    loadData(csvPaths, country).then(dataSets => {
        const svg = d3.select("#radarChart")
            .attr("width", 600)
            .attr("height", 600);

        // Draw each dataset
        dataSets.forEach((data, i) => {
            if (data) {
                drawRadarPath(svg, data, colors[i], 300, 300); // Assuming drawRadarPath is a function to draw the radar path
            }
        });

        // Display the country name as the chart title
        svg.append("text")
            .attr("class", "title")
            .attr("x", 300)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .text(country);

        // Add a legend to the radar chart
        const legend = svg.append("g")
            .attr("transform", "translate(0, 50)"); // Position the legend at the bottom of the chart

        const legendEntries = ["Both", "Arabica", "Robusta"];

        legend.selectAll(".legend-box")
            .data(dataSets)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (_, i) => i * 25)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", (_, i) => dataSets[i] ? colors[i] : "#cdcdcd");

        legend.selectAll(".legend-text")
            .data(legendEntries)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", (_, i) => i * 25 + 9)
            .text((d, i) => d + (dataSets[i] ? "" : " (No data)"))
            .attr("fill", (_, i) => dataSets[i] ? colors[i] : "#cdcdcd")
            .style("font-size", "20px");
    });
    console.log("Radar Chart Rendered");
}
// Function to draw the radar path for each dataset
function drawRadarPath(svg, data, color, cx, cy) {
    const angleSlice = Math.PI * 2 / features.length;
    const rScale = d3.scaleLinear()
        .domain([0, 10])  // Valores do gráfico variam de 0 a 10
        .range([0, 400]); // O maior círculo tem raio 250

    // Cria um grupo para o gráfico radar no centro do SVG
    const radarGroup = svg.append("g")
        .attr("transform", `translate(${cx}, ${cy})`);

    // Desenha os círculos de fundo
    radarGroup.selectAll(".gridCircle")
        .data(d3.range(1, 6)) // 5 níveis assumidos
        .enter().append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => rScale(d))
        .style("fill", "#d8d8d8")
        .style("stroke", "#ccc")
        .style("fill-opacity", 0.1);

    // Adiciona rótulos nos círculos de grade
    radarGroup.selectAll(".gridLabel")
        .data(d3.range(1, 6)) // Mesmo alcance que seus círculos
        .enter().append("text")
        .attr("class", "gridLabel")
        .attr("x", 5) // Pequeno deslocamento horizontal
        .attr("y", d => -rScale(d)) // Posição alinhada com os círculos
        .text(d => d) // Mostra o número do nível
        .style("font-size", "14px")
        .attr("fill", "#8a8a8a");

    // Desenha os eixos (uma linha por característica)
    const axes = radarGroup.selectAll(".axis")
        .data(features)
        .enter().append("g")
        .attr("class", "axis")

    // Linhas dos eixos terminam no último círculo
    axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(5) * Math.cos(angleSlice * i - Math.PI / 2)) // Ajuste para terminar no círculo externo
        .attr("y2", (d, i) => rScale(5) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "#d8d8d8")
        .style("stroke-width", "2px");

    // Adiciona rótulos dos eixos
    axes.append("text")
        .attr("class", "legend")
        .attr("text-anchor", "middle")
        .attr("x", (d, i) => rScale(6) * Math.cos(angleSlice * i - Math.PI / 2)) // Ligeiramente fora do último círculo para legibilidade
        .attr("y", (d, i) => rScale(6) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .style("font-family", "sans-serif")
        .style("font-size", "16px")
        .attr("alignment-baseline", "middle")
        .attr("fill", "black");

    // Desenha o caminho do radar
    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    radarGroup.append("path")
        .datum(data)
        .attr("d", radarLine)
        .style("stroke", color)
        .style("fill", color)
        .style("fill-opacity", 0)
        .style("stroke-width", 3);
}