// Variáveis globais
var variable = "Exports";
var currentCSV = d3.csv("../data_dist/country_data_until_2016.csv"); // Caminho padrão do arquivo CSV
var svg_mapa, projection, path, tooltip;
var years_list = ['../data_dist/country_data_until_2016.csv', '../data_dist/country_data_until_2017.csv', '../data_dist/country_data_until_2018.csv', '../data_dist/country_data_until_2019.csv', '../data_dist/country_data_until_2020.csv', '../data_dist/country_data_until_2021.csv', '../data_dist/country_data_until_2022.csv', '../data_dist/country_data_until_2023.csv', '../data_dist/country_data_until_2024.csv', '../data_dist/country_data_until_2025.csv'];
let dict_year_csv = {};
let startYear = 2016;

for (let i = 0; i < years_list.length; i++) {
    dict_year_csv[startYear + i] = years_list[i];
}

console.log(dict_year_csv);
document.addEventListener("DOMContentLoaded", function () {
    const slider = document.getElementById('yearSlider');
    const display = document.getElementById('yearDisplay');

    slider.oninput = function() {
        display.textContent = this.value;
        updateCurrentCSV(this.value);
    }
});

let fluxoAtual = 'Exports'; // Valor padrão

function trocarFluxo(novoFluxo) {
    fluxoAtual = novoFluxo;
    document.getElementById('btnExport').classList.toggle('button-active', fluxoAtual === 'Exports');
    document.getElementById('btnImport').classList.toggle('button-active', fluxoAtual === 'Imports');
    // O seu código já tem renderMap() e updateVariable(), 
    // force uma atualização:
    renderMap();
}

// Substitua o renderMap por esta versão unificada
function renderMap() {
    svg_mapa.selectAll("*").remove();

    Promise.all([
        d3.json("geo_data/world.geojson"),
        Promise.resolve(currentCSV)
    ]).then(function ([world, data]) {
        // Agora usamos o fluxoAtual + a variável de categoria
        // Exemplo: se fluxo = "Exports" e variável = "Coffee", buscamos d["Exports"]
        // Ajuste conforme o nome das colunas nos seus novos CSVs processados
        var dataById = new Map(data.map(d => [d.id, +d[fluxoAtual]])); 
        
        var dataValues = data.map(d => +d[fluxoAtual]);
        var rankings = updateRanking(data); 
        
        var minNonZero = d3.min(dataValues.filter(value => value > 0));
        var max = d3.max(dataValues);

        var colorScale = d3.scaleSequential(d3.interpolateRgb("#ebffdc", "#1f4a02"))
            .domain([minNonZero || 0, max || 1]); 

        drawLegend(colorScale, minNonZero, max);
        drawMap(world, dataById, colorScale, rankings);
    });
}

function initializeMap() {
    renderZoomableChart("Brazil");
    width = 942.48;
    height = 471.24;
    svg_mapa = d3.select("#map_distri")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    projection = d3.geoEquirectangular()
        .scale(150)
        .translate([width / 2, height / 2]);

    path = d3.geoPath().projection(projection);

    tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "solid 1px #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

    renderMap();
}

function drawLegend(colorScale, min, max) {
    // Remove a legenda anterior se já existir
    svg_mapa.select("g.legend").remove();

    // Cria um grupo para a legenda
    var legend = svg_mapa.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(30, 100)");

    // Cria e limpa um gradiente de cores
    svg_mapa.select("defs").selectAll("*").remove();
    var gradient = svg_mapa.append("defs").append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    // Define os pontos de parada do gradiente baseados na escala de cores
    gradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Adiciona o retângulo que usará o gradiente
    legend.append("rect")
        .attr("width", 20)
        .attr("height", 320)
        .style("fill", "url(#gradient)");

    // Calcula os rótulos para os valores
    const numTicks = 5; // Inclui mínimo, máximo e três intermediários
    let ticks = [min];
    let step = (max - min) / (numTicks - 1);
    for (let i = 1; i < numTicks; i++) {
        ticks.push(min + i * step);
    }

    // Adiciona rótulos
    legend.selectAll("text")
        .data(ticks)
        .enter().append("text")
        .attr("x", 30)
        .attr("y", (d, i) => 320 - (i * 320 / (numTicks - 1)))
        .attr("dominant-baseline", "middle")
        .text(d => d?.toFixed(2) || 'No data');

    // Adiciona um título à legenda, rotacionado verticalmente
    legend.append("text")
        .attr("transform", "translate(-10, 160) rotate(-90)")
        .attr("text-anchor", "middle")
        .text(`${variable} in the selected year`) // Usa a variável para personalizar o título
        .attr("font-weight", "bold");

}

function drawMap(world, dataById, colorScale, rankings) {
    svg_mapa.selectAll("path").remove(); // Clears any previous map

    // Tooltip Initialization
    var tooltip = d3.select("body").selectAll(".tooltip").data([null]);
    tooltip = tooltip.enter().append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "solid 1px #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none")
        .merge(tooltip);

    // Function to update the tooltip's position and content
    function updateTooltip(event, d) {
        var value = dataById.get(d.id); // Get value directly
        var countryName = d.properties.name;
        var displayValue;
    
        // Check if value is a number and format accordingly
        if (typeof value === 'number') {
            displayValue = value.toFixed(2);
        } else {
            displayValue = "No data"; // Default text if value is not a number
        }
    
        var rank = rankings[countryName] || "Not ranked";
    
        tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .html(`<strong>Country:</strong> ${countryName}<br><strong>Mean of ${variable} per year:</strong> ${displayValue}<br><strong>Rank:</strong> ${rank}`)
            .style("display", "block");
    }

    svg_mapa.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("data-country", d => d.properties.name)
        .attr("fill", d => {
            const value = dataById.get(d.id);
            return value === 0 || value === undefined ? "#ccc" : colorScale(value);
        })
        .on("mouseover", updateTooltip)
        .on("mouseout", function() {
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            d3.select("#zoomableChart").selectAll("*").remove(); 
            
            updateTooltip(event, d); 
            updateTooltip(event, d); 
            if (dataById.get(d.id) === undefined || dataById.get(d.id) === 0) {
                displayNoDataMessage(); // Display "No data" message if data does not exist
            } else {
                renderZoomableChart(d.properties.name); // Renders new chart if data exists
            }
            tooltip.style("display", "none");
            updateCountryName(d.properties.name);
        });
}

function displayNoDataMessage() {

    const container = d3.select("#zoomableChart");
    container.html('<p style="color: #e0e0e0; font-weight: bold; font-size: 24px; class="no-data-message">No data</p>'); 
}
function updateRanking(data) {
    // A função ainda processa o ranking, mas não tenta modificar o DOM.
    const sortedData = data.sort((a, b) => +b[variable] - +a[variable]);
    let rankings = {};
 
    sortedData.forEach((d, index) => {
        const country = d.Country;
        rankings[country] = index + 1;  // Ainda calcula e armazena o ranking.
    });
 
    return rankings;
 }

function toggleActiveButton(value, selector, activeClass, selectedValue) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
        if (button.innerText === selectedValue) {
            button.classList.add(activeClass);
        } else {
            button.classList.remove(activeClass);
        }
    });
}

function updateVariable(newVariable) {
    // Se o botão selecionado for "Exports" ou "Imports", atualize o fluxo
    if (newVariable === "Exports" || newVariable === "Imports") {
        trocarFluxo(newVariable);
    } else {
        variable = newVariable; // Se for sub-categoria, mantém o foco
    }
    renderMap();
    // ... restante da função
}

function cleanLine() { 
    d3.select("#timeSeries").selectAll("*").remove(); // Limpa o SVG
}

function lineDistrib(svg, data, width, height) {

    const x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.Year; }))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d[variable]; })])
        .range([height, 0]);

    const colorScale = d3.scaleSequential(d3.interpolateRgb("#ebffdc", "#1f4a02"))
        .domain([0, d3.max(data, function(d) { return d[variable]; })]);

    
    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y).ticks(4));


    xAxis.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 35) 
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .text("Year");

    yAxis.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50) 
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .text( variable);


    const line = d3.line()
        .x(function(d) { return x(d.Year); })
        .y(function(d) { return y(d[variable]); });

    svg.selectAll(".line-segment")
        .data(data.slice(0, -1))  
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d, i) { 
            return colorScale((d[variable] + data[i + 1][variable]) / 2);  
        })
        .attr("stroke-width", 1.5)
        .attr("d", function(d, i) { 
            return line([d, data[i + 1]]);
        });

    // Adiciona título ao gráfico
    svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")  // Define o texto para negrito
    .text("Accumulated progression of " + variable + " bags over time in years in the world.");
}

function updateCurrentCSV(year) {
    // Define o caminho correto para o arquivo CSV com base no ano
    var csvPath = dict_year_csv[year];
    
    // Carrega o novo arquivo CSV e, em seguida, renderiza o mapa
    d3.csv(csvPath).then(data => {
        currentCSV = data;  // Atualiza currentCSV com os novos dados carregados
        renderMap();  // Chama renderMap para atualizar o mapa com os novos dados
    }).catch(error => {
        console.error("Failed to load CSV data: ", error);
    });
}

function updateCountryName(name) {
    const countryNameElement = document.getElementById("countryName");
    countryNameElement.textContent = name; // Atualiza o texto do elemento com o novo nome do país
}












const svgSize = 150; // Tamanho do SVG, ajuste conforme necessário
const radiusZoom = svgSize / 3; // Define o raio com base no tamanho do SVG


function initializeZoomable() {
    d3.select("#zoomableChart").selectAll("*").remove();
    svg_zoom = d3.select("#zoomableChart")
        .attr("width", 300)
        .attr("height", 300)
        .attr("background-color", "green")
        .append("g")
        .attr("transform", "translate(150,150)");


    const country = document.querySelector("ul#my-list li.active").textContent;
    console.log(country);
    const tipo = document.querySelector("div#tipo button.button-active-tipo").textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log(tipo);
    renderZoomableChart(country);
}

function renderZoomableChart(country) {
    
    const json = {"Albania" : "data_json/ALB.json", "Algeria" : "data_json/DZA.json", "Angola" : "data_json/AGO.json", "Argentina" : "data_json/ARG.json", "Armenia" : "data_json/ARM.json", "Australia" : "data_json/AUS.json", "Benin" : "data_json/BEN.json", "Bolivia" : "data_json/BOL.json", "Bosnia and Herzegovina" : "data_json/BIH.json", "Brazil" : "data_json/BRA.json", "Burundi" : "data_json/BDI.json", "Cameroon" : "data_json/CMR.json", "Canada" : "data_json/CAN.json", "Central African Republic" : "data_json/CAF.json", "Chile" : "data_json/CHL.json", "China" : "data_json/CHN.json", "Colombia" : "data_json/COL.json", "Costa Rica" : "data_json/CRI.json", "Croatia" : "data_json/HRV.json", "Cuba" : "data_json/CUB.json", "Dominican Republic" : "data_json/DOM.json", "Ecuador" : "data_json/ECU.json", "Egypt" : "data_json/EGY.json", "El Salvador" : "data_json/SLV.json", "Equatorial Guinea" : "data_json/GNQ.json", "Ethiopia" : "data_json/ETH.json", "Gabon" : "data_json/GAB.json", "Georgia" : "data_json/GEO.json", "Ghana" : "data_json/GHA.json", "Guatemala" : "data_json/GTM.json", "Guinea" : "data_json/GIN.json", "Guyana" : "data_json/GUY.json", "Haiti" : "data_json/HTI.json", "Honduras" : "data_json/HND.json", "India" : "data_json/IND.json", "Indonesia" : "data_json/IDN.json", "Iran" : "data_json/IRN.json", "Jamaica" : "data_json/JAM.json", "Jordan" : "data_json/JOR.json", "Kazakhstan" : "data_json/KAZ.json", "Kenya" : "data_json/KEN.json", 
    "Laos" : "data_json/LAO.json", "Liberia" : "data_json/LBR.json", "Madagascar" : "data_json/MDG.json", "Malawi" : "data_json/MWI.json", "Malaysia" : "data_json/MYS.json", "Mexico" : "data_json/MEX.json", "Montenegro" : "data_json/MNE.json", "Morocco" : "data_json/MAR.json", "New Caledonia" : "data_json/NCL.json", "New Zealand" : "data_json/NZL.json", "Nicaragua" : "data_json/NIC.json", "Nigeria" : "data_json/NGA.json", "North Macedonia" : "data_json/MKD.json", "Norway" : "data_json/NOR.json", "Panama" : "data_json/PAN.json", "Papua New Guinea" : "data_json/PNG.json", "Paraguay" : "data_json/PRY.json", "Peru" : "data_json/PER.json", "Philippines" : "data_json/PHL.json", "Rwanda" : "data_json/RWA.json", "Saudi Arabia" : "data_json/SAU.json", "Senegal" : "data_json/SEN.json", "Serbia" : "data_json/SRB.json", "Sierra Leone" : "data_json/SLE.json", "Singapore" : "data_json/SGP.json", "South Africa" : "data_json/ZAF.json", "Sri Lanka" : "data_json/LKA.json", "Switzerland" : "data_json/CHE.json", "Taiwan" : "data_json/TWN.json", "Tanzania" : "data_json/TZA.json", "Thailand" : "data_json/THA.json", "Togo" : "data_json/TGO.json", "Trinidad and Tobago" : "data_json/TTO.json", "Uganda" : "data_json/UGA.json", "Ukraine" : "data_json/UKR.json", "United Kingdom" : "data_json/GBR.json", "United States" : "data_json/USA.json", "Uruguay" : "data_json/URY.json", "Venezuela" : "data_json/VEN.json", "Vietnam" : "data_json/VNM.json", "Yemen" : "data_json/YEM.json", "Zambia" : "data_json/ZMB.json", "Zimbabwe" : "data_json/ZWE.json"};
    fetch(json[country])
      .then(response => response.json())  
      .then(data => {
                console.log(data);  
            
            console.log(data.someKey);

          const categories = ["Exports", "Imports", "Bean Exports", "Roast & Ground Imports", "Soluble Exports", "Bean Imports", "Roast & Ground Exports", "Soluble Imports"];

        // // Escolha cores específicas para cada categoria
        // const colorMapping = {
        //     "Exports": "#492907",
        //     "Roast & Ground Exports": "#703f0c",
        //     "Bean Exports": "#703f0c",
        //     "Soluble Exports": "#703f0c",
        //     "Imports": "#ae773c",
        //     "Roast & Ground Imports": "#cc8e4bn",
        //     "Bean Imports": "#cc8e4b",
        //     "Soluble Imports": "#cc8e4b"
        // };


        const color = d3.scaleOrdinal()
            .domain(categories)
            .range(categories.map(cat => colorMapping[cat] || "#999"));


          // Compute the layout.
          const hierarchy = d3.hierarchy(data)
              .sum(d => d.value)
              .sort((a, b) => b.value - a.value);
          const root = d3.partition()
              .size([2 * Math.PI, hierarchy.height + 1])
            (hierarchy);
          root.each(d => d.current = d);

          // Create the arc generator.
          const arc = d3.arc()
              .startAngle(d => d.x0)
              .endAngle(d => d.x1)
              .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
              .padRadius(radiusZoom * 1.5)
              .innerRadius(d => d.y0 * radiusZoom)
              .outerRadius(d => Math.max(d.y0 * radiusZoom, d.y1 * radiusZoom - 1))

      
              svg_zoom = d3.select("#zoomableChart").append("svg")
          .attr("width", 300)
          .attr("height", 300)
          .attr("background-color", "green")
          .append("g")
          .attr("transform", "translate(150,150)");
      
          const path = svg_zoom.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
              .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
              .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
              .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
              .attr("d", d => arc(d.current));

          path.filter(d => d.children)
              .style("cursor", "pointer")
              .on("click", clicked);
            path.on("mouseover", function(event, d) {
            
                // Adiciona ou atualiza um tooltip, se desejado.
                d3.select('.tooltip')
                  .style('display', 'block')
                  .style('left', `${event.pageX + 10}px`)
                  .style('top', `${event.pageY + 10}px`)
                  .html(`<strong>Category:</strong> ${d.data.name}<br><strong>Value:</strong> ${d.value}`);
            })
            .on("mouseout", function(d) {
                // Remove a realce quando o mouse não está mais sobre o caminho.
            
                // Esconde o tooltip
                d3.select('.tooltip')
                  .style('display', 'none');
            });

          const format = d3.format(",d");


          const label = svg_zoom.append("g")
              .attr("pointer-events", "none")
              .attr("text-anchor", "middle")
              .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
              .attr("dy", "0.35em")
              .attr("fill-opacity", d => +labelVisible(d.current))
              .attr("transform", d => labelTransform(d.current))
              .text(d => d.data.name.replace("Roast & Ground", "R&G"));

          const parent = svg_zoom.append("circle")
              .datum(root)
              .attr("r", radiusZoom)
              .attr("fill", "none")
              .attr("pointer-events", "all")
              .on("click", clicked);

          // Handle zoom on click.
          function clicked(event, p) {
            parent.datum(p.parent || root);
          
            root.each(d => d.target = {
              x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
              x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
              y0: Math.max(0, d.y0 - p.depth),
              y1: Math.max(0, d.y1 - p.depth)
            });
          
            const t = svg_zoom.transition().duration(750);
          
            path.transition(t)
                .tween("data", d => {
                  const i = d3.interpolate(d.current, d.target);
                  return t => d.current = i(t);
                })
              .filter(function(d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
              })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none") 
            
                .attrTween("d", d => () => arc(d.current));
            
            label.filter(function(d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
              }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
  }
  
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radiusZoom;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }


  })
  .catch(error => console.error('Error loading JSON:', error));

}

function zoomableFunction() {
  initializeZoomable();
}