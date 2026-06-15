// Definindo a margem e o tamanho dos retângulos
const margin = { top: 100, right: 50, bottom: 50, left: 100 };
const rectSize = 30; // Tamanho fixo para os retângulos
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

function buildHeatmap(data, filterType) {
    // Limpar o conteúdo SVG anterior
    d3.select("#heatmap").selectAll("*").remove();

    console.log("Iniciando a construção do heatmap com o tipo de café:", filterType);

    // Filtrar os dados
    console.log("Tipo dos dados:", data[0].Info);
    const filteredData = data.filter(d => d.Info === filterType);
    console.log("Dados filtrados:", filteredData);

    // Ordenar os dados
    filteredData.sort((a, b) => parseFloat(a.YearMonth) - parseFloat(b.YearMonth));

    // Pegar países únicos
    const countries = Array.from(new Set(filteredData.map(d => d.Country)));
    // Pegar tempos únicos
    const times = Array.from(new Set(filteredData.map(d => d.YearMonth)));

    console.log("Países:", countries);
    console.log("Tempos:", times);

    // Criar uma matriz bidimensional
    const heatmapData = [];
    countries.forEach(country => {
        times.forEach(time => {
            const entry = filteredData.find(d => d.Country === country && d.YearMonth === time);
            heatmapData.push({
                country: country,
                time: time,
                value: entry ? entry.Value : 0
            });
        });
    });

    console.log("Dados do heatmap:", heatmapData);

    // Calcular a largura e a altura do gráfico baseados no tamanho dos retângulos
    const totalWidth = times.length * rectSize;
    const totalHeight = countries.length * rectSize;

    // Adicionando o SVG ao corpo da página
    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", totalWidth + margin.left + margin.right)
        .attr("height", totalHeight + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Definindo as escalas
    const xScale = d3.scaleBand()
        .domain(times)
        .range([0, totalWidth])
        .padding(0.01);

    const yScale = d3.scaleBand()
        .domain(countries)
        .range([0, totalHeight])
        .padding(0.01);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(heatmapData, d => d.value)]);

    // Adicionando os retângulos para o heatmap
    const rows = g.selectAll(".row")
        .data(countries)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", d => "translate(0," + yScale(d) + ")")
        .call(d3.drag()
            .on("drag", function(event, d) {
                const y = event.y;
                const index = Math.max(0, Math.min(countries.length - 1, Math.floor(y / rectSize)));
                const currentIndex = countries.indexOf(d);
                if (index !== currentIndex) {
                    countries.splice(currentIndex, 1);
                    countries.splice(index, 0, d);
                    updateHeatmap();
                }
            })
        );

    rows.selectAll(".cell")
        .data(d => times.map(time => ({
            country: d,
            time: time,
            value: heatmapData.find(h => h.country === d && h.time === time).value
        })))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => xScale(d.time))
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("fill", d => colorScale(d.value))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // Adicionando eixos
    const xAxis = d3.axisTop(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "x axis sticky-x-axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis sticky-y-axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis);

    // Adicionando barra indicando as cores
    const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, ${totalHeight + 30})`);

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(heatmapData, d => d.value)])
        .range([0, totalWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickSize(10)
        .tickFormat(d3.format(".2f"));

    legend.append("g")
        .attr("class", "legend-axis")
        .call(legendAxis);

    const legendGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d3.max(heatmapData, d => d.value)));

    legend.append("rect")
        .attr("x", 0)
        .attr("y", -10)
        .attr("class", "sticky-x-axis")
        .attr("width", totalWidth)
        .attr("height", 10)
        .style("fill", "url(#legend-gradient)");

    // Função para atualizar o heatmap após o reordenamento
    function updateHeatmap() {
        yScale.domain(countries);

        rows.transition()
            .duration(300)
            .attr("transform", d => "translate(0," + yScale(d) + ")");

        svg.select(".y.axis")
            .transition()
            .duration(300)
            .call(yAxis);
    }
}
