// Variáveis globais
var variable = "AVG_Balance";
var currentCSV = "data/Coffee_Qlty_By_Country_copy.csv"; // Caminho padrão do arquivo CSV
var specie = "Both";
var svg, projection, path, tooltip;

document.addEventListener("DOMContentLoaded", function () {
    initializeMap();
    toggleActiveButton('data/Coffee_Qlty_By_Country_copy.csv', '#tipo button', 'button-active-tipo');
    toggleActiveButton('AVG_Balance', '#attributes button', 'button-active');
});

function updateSpecie() {
    switch (currentCSV) {
        case "data/Coffee_Qlty_By_Country_copy.csv":
            specie = "Both";
            break;
        case "data/Coffee_Qlty_By_Country_Arabica_copy.csv":
            specie = "Arábica";
            break;
        case "data/Coffee_Qlty_By_Country_Robusta_copy.csv":
            specie = "Robusta";
            break;
        default:
            specie = "Unknown"; // ou outro valor padrão caso necessário
    }
}

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
        var colorScale = d3.scaleSequential(d3.interpolateRgb("#ffefdc", "#4a2f02"))
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
        .text(`Average value of ${variable.replace('AVG_', '')} of ${specie}`) // Usa a variável para personalizar o título
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
                   .html(`<strong>Country:</strong> ${countryName}<br><strong>Specie:</strong> ${specie}<br><strong>${variable}:</strong> ${displayValue}<br><strong>Rank:</strong> ${rank}`)
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
        const country = d.Country_of_Origin;
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




function toggleActiveButton(value, selector, activeClass) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
        if (button.getAttribute('onclick').includes(value)) {
            button.classList.add(activeClass);
        } else {
            button.classList.remove(activeClass);
        }
    });
    if (document.querySelector("#radar") != null) {
        if (document.querySelector("#radar").style.display == "block") {
            cleanMap();
            radarFunction();
            lineChartFunction();
        }
    }
}

function updateVariable(newVariable) {
    variable = newVariable;
    renderMap();
    toggleActiveButton(newVariable, '#attributes button', 'button-active');
}

function tipo_cafe(csvPath) {
    currentCSV = csvPath;
    updateSpecie();
    renderMap();
    toggleActiveButton(csvPath, '#tipo button', 'button-active-tipo');
}