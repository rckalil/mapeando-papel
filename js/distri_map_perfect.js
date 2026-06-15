// Variáveis globais
var variable = "Total Distribution";
var currentCSV = "data/psd_coffee_variations_mean.csv"; // Caminho padrão do arquivo CSV
var svg, projection, path, tooltip;

document.addEventListener("DOMContentLoaded", function () {
    initializeMap();
    initializeLine(); // Chamada para inicializar o gráfico de linha
    const initialVariable = 'Total Distribution'; // Define a variável inicial aqui
    updateVariable(initialVariable);
    toggleActiveButton(initialVariable, '#attributes button', 'button-active', initialVariable);
});

function initializeMap() {
    width = 942.48;
    height = 471.24;
    svg = d3.select("#map_d3")
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

function renderMap() {
    svg.selectAll("*").remove(); // Limpa o SVG

    Promise.all([
        d3.json("geo_data/world.geojson"),
        d3.csv(currentCSV)
    ]).then(function ([world, data]) {
        var dataById = new Map(data.map(d => [d.id, +d[variable]]));
        var dataValues = data.map(d => +d[variable]);
        var rankings = updateRanking(data); // Atualiza o ranking e obtém os rankings
        var colorScale = d3.scaleSequential(d3.interpolateRgb("#ebffdc", "#1f4a02"))
            .domain([d3.min(dataValues), d3.max(dataValues)]);

        drawLegend(colorScale, d3.min(dataValues), d3.max(dataValues));
        drawMap(world, dataById, colorScale, rankings); // Certifique-se de passar rankings aqui
    });
}

function drawLegend(colorScale, min, max) {
    // Remove a legenda anterior se já existir
    svg.select("g.legend").remove();

    // Cria um grupo para a legenda
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(30, 100)");

    // Cria e limpa um gradiente de cores
    svg.select("defs").selectAll("*").remove();
    var gradient = svg.append("defs").append("linearGradient")
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
        .text(`Average value of ${variable}`) // Usa a variável para personalizar o título
        .attr("font-weight", "bold");

}

function drawMap(world, dataById, colorScale, rankings) {
    svg.selectAll("path").remove(); // Limpa qualquer mapa anterior

    tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.82)") 
    .style("border", "solid 1px #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

    svg.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("data-country", d => d.properties.name) // Facilita a seleção por país
        .attr("fill", d => {
            const value = dataById.get(d.id);
            return value === undefined ? "#ccc" : colorScale(value);
        })
        .on("mouseover", function (event, d) {
            var value = dataById.get(d.id) || "No data";
            var countryName = d.properties.name;
            var displayValue = (typeof value === 'number') ? value.toFixed(2) : "No data";
            var rank = rankings[countryName] || "Not ranked";

            // Calcula as coordenadas centrais do país no path
            var bbox = this.getBBox();
            var centerX = bbox.x + bbox.width / 2;
            var centerY = bbox.y + bbox.height / 2;

            // Posiciona o tooltip no centro do path do país
            tooltip.style("display", "block")
                   .html(`<strong>Country:</strong> ${countryName}<br><strong>Mean of ${variable} per year:</strong> ${displayValue}<br><strong>Rank:</strong> ${rank}`)
                   .style("left", `${centerX + svg.node().getBoundingClientRect().left}px`) // Considera a posição do SVG no documento
                   .style("top", `${centerY + svg.node().getBoundingClientRect().top}px`);

            d3.select(this).attr("opacity", 0.7);
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            var value = dataById.get(d.id);
            if (value !== undefined) {
                abre_radar(d.properties.name, value, rankings[d.properties.name]);
            }
        });
}

function abre_radar(countryName, value, rank) {
    console.log(`Country: ${countryName}, Value: ${value}, Rank: ${rank}`);
    // Aqui, implemente a lógica para mostrar os detalhes. Pode ser a abertura de um modal, por exemplo.
    // Você pode usar alert, ou, se preferir algo mais avançado, pode criar um modal no HTML e aqui apenas alterar seu conteúdo e exibi-lo.


    const conteudo = countryName;
    const ulElement = document.querySelector("ul#my-list");
    const countries = ulElement.querySelectorAll("li");
    const country = Array.from(countries).find(li => li.textContent.includes(conteudo));
    //if (liElement) {
    //    liElement.scrollIntoView({ behavior: 'smooth' });
    //}
    console.log(country);
    if (lastClickedCountry != country && lastClickedCountry != null) {
        // Redefine o estilo do último elemento clicado
        lastClickedCountry.style.backgroundColor = "";
        lastClickedCountry.style.color = "";
        lastClickedCountry.classList.remove("active");
    }
    country.style.backgroundColor = "#333";
    country.style.color = "#fff";
    country.classList.add("active");
    lastClickedCountry = country;
    cleanMap();
    radarFunction();
    lineChartFunction();
}

function updateRanking(data) {
    const rankingList = document.getElementById("countryRanking");
    rankingList.innerHTML = ''; // Limpa a lista existente

    const sortedData = data.sort((a, b) => +b[variable] - +a[variable]);
    let rankings = {};

    sortedData.forEach((d, index) => {
        const li = document.createElement("li");
        const value = +d[variable];
        const country = d.Country;
        rankings[country] = index + 1;

        li.textContent = isNaN(value) ? `${country}: Valor inválido` : `${country}: ${value.toFixed(2)}`;
        li.id = `list-${country.replace(/ /g, '_')}`; // Garanta um ID único para cada item da lista
        li.addEventListener('mouseover', function(event) {
            this.classList.add('country-highlight');
            const path = svg.select(`path[data-country='${country}']`); // Seleciona o caminho baseado em um atributo de dados
            path.dispatch('mouseover', {bubbles: true});
        });
        li.addEventListener('mouseout', function() {
            this.classList.remove('country-highlight');
            const path = svg.select(`path[data-country='${country}']`);
            path.dispatch('mouseout', {bubbles: true});
        });

        rankingList.appendChild(li);
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
    variable = newVariable;
    renderMap();
    cleanLine(); // Limpa o gráfico de linha
    initializeLine(); // Atualiza o gráfico de linha
    toggleActiveButton(newVariable, "#attributes button", 'button-active', newVariable);
}

function cleanLine() { 
    d3.select("#timeSeries").selectAll("*").remove(); // Limpa o SVG
}

// Inicializa o gráfico de linha
function initializeLine() {

    const margin = {top: 20, right: 20, bottom: 50, left: 50};
    const width = 1126.263 ;
    const height = 221.24 ;
    
    const svg = d3.select("#timeSeries")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Carrega os dados aqui
    d3.csv("data/psd_coffee_variations_year.csv").then(function(data) {
        data.forEach(function(d) {
            d.Year = +d.Year;
            d[variable] = +d[variable];
        });

        // Desenha o gráfico de linha com os dados carregados
        lineDistrib(svg, data, width, height); // Adiciona os argumentos de dimensões e margem
    }).catch(error => {
        console.error("Error loading CSV data: ", error);
    });
}

function lineDistrib(svg, data, width, height) {
    // Define as escalas X e Y
    const x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.Year; }))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d[variable]; })])
        .range([height, 0]);

    // Define a escala de cor
    const colorScale = d3.scaleSequential(d3.interpolateRgb("#ebffdc", "#1f4a02"))
        .domain([0, d3.max(data, function(d) { return d[variable]; })]);

    // Adiciona os eixos X e Y ao SVG
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Cria uma linha para cada segmento entre pontos
    const line = d3.line()
        .x(function(d) { return x(d.Year); })
        .y(function(d) { return y(d[variable]); });

    svg.selectAll(".line-segment")
        .data(data.slice(0, -1))  // ignora o último ponto para evitar erro no segmento seguinte
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d, i) {  // define a cor baseada no valor de Y
            return colorScale((d[variable] + data[i + 1][variable]) / 2);  // média de y entre pontos para cor
        })
        .attr("stroke-width", 1.5)
        .attr("d", function(d, i) {  // desenha cada segmento de linha individualmente
            return line([d, data[i + 1]]);
        });

    // Adiciona título ao gráfico
    svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")  // Define o texto para negrito
    .text("Progression of " + variable + " over time in years");
}
