

function buildHeatmap(data, filterType) {
    const sWidth = window.innerWidth; const sHeight = window.innerHeight;

    const margin = { top: sHeight/12, right: sWidth/16, bottom: sHeight/12, left: sWidth/16 };
    const rectWidth = sWidth/60;
    const rectHeight = sHeight/40;
    const width = sWidth - margin.left - margin.right;
    const height = sHeight - margin.top - margin.bottom;
    d3.select("#heatmap").selectAll("*").remove();
    //console.log(rectHeight, rectWidth, width, height, margin.top, margin.right, margin.bottom, margin.left)

    //console.log("Iniciando a construção do heatmap com o tipo de café:", filterType);

    const filteredData = data.filter(d => d.Info === filterType);
    filteredData.sort((a, b) => parseFloat(a.YearMonth) - parseFloat(b.YearMonth));

    const countries = Array.from(new Set(filteredData.map(d => d.Country)));
    const times = Array.from(new Set(filteredData.map(d => d.YearMonth)));
    const years = Array.from(new Set(filteredData.map(d => d.Year)));

    //console.log("Países:", countries);
    //console.log("Tempos:", times);

    const heatmapData0 = [];
    countries.forEach(country => {
        times.forEach(time => {
            const entry = filteredData.find(d => d.Country === country && d.YearMonth === time);
            heatmapData0.push({
                country: country,
                time: time,
                year: entry ? entry.Year : 0,
                value: entry ? entry.Value : 0
            });
        });
    });


    // Crie todas as combinações possíveis de anos e países
    const allCombinations = years.flatMap(year => 
        countries.map(country => ({ year, country }))
    );

    //console.log("Dados do heatmap:", heatmapData0);
    // Agrupando os dados por ano e país
    const aggregatedData = d3.rollups(
        heatmapData0,
        v => d3.sum(v, d => d.value),
        d => d.year,
        d => d.country
    );

    // Achatar a estrutura para que cada entrada contenha year, country e value diretamente
    const existingData = aggregatedData.flatMap(([year, countries]) =>
        countries.map(([country, value]) => ({
            year: year,
            country: country,
            value: value
        }))
    );

    const box = document.querySelector('.order-checkbox');
    const rankCountries = [];
    if (box.checked) {
        const minimumData = d3.rollups(
            existingData,
            v => d3.min(v, d => d.value),
            d => d.country
        );
    
        const sumData  = minimumData.flatMap(([country, value]) => ({
            country: country,
            value: value
        }));
    
        //Ordenar por value decrescentemente
        sumData.sort((a, b) => b.value - a.value);
        rankCountries.push(sumData.map(d => d.country).slice(0, 13));
        //console.log("Países com maior valor:", rankCountries);
    }
    else {
        rankCountries.push(countries.slice(0, 15).sort());
        //console.log("Países com maior valor:", rankCountries);
    }

    const finalCountries = rankCountries[0];

    // Mesclar os dados existentes com todas as combinações possíveis, preenchendo valores ausentes com zero
    const heatmapData = allCombinations.map(combination => {
        const match = existingData.find(d => d.year === combination.year && d.country === combination.country);
        return {
            year: combination.year,
            country: combination.country,
            value: match ? match.value : 0
        };
    });

    ////console.log("Dados agregados:", heatmapData);

    const totalWidth = years.length * rectWidth;
    const totalHeight = finalCountries.length * rectHeight;

    if (finalCountries.length!=0) {
        console.log("Países:", finalCountries);
        const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", totalWidth + margin.left + margin.right)
        .attr("height", totalHeight + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, totalWidth])
        .padding(0.01);

    const yScale = d3.scaleBand()
        .domain(finalCountries)
        .range([0, totalHeight])
        .padding(0.01);

    const colorScale = d3.scaleSequential(d3.interpolateRgb("#ffefdc", "#4a2f02"))
        .domain([0, d3.max(heatmapData, d => d.value)]);

    const rows = g.selectAll(".row")
        .data(finalCountries)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", d => "translate(0," + yScale(d) + ")")
        .call(d3.drag()
            .on("drag", function(event, d) {
                const y = event.y;
                const index = Math.max(0, Math.min(countries.length - 1, Math.floor(y / rectHeight)));
                const currentIndex = finalCountries.indexOf(d);
                if (index !== currentIndex) {
                    finalCountries.splice(currentIndex, 1);
                    finalCountries.splice(index, 0, d);
                    reorderHeatmap();
                }
            })
        );

    rows.selectAll(".cell")
        .data(d => heatmapData.filter(hd => hd.country === d))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => xScale(d.year))
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", d => colorScale(d.value))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    const xAxis = d3.axisTop(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "x axis sticky-x-axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "1vh");

    svg.append("g")
        .attr("class", "y axis sticky-y-axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "1vh");

    const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, ${totalHeight + 30})`);

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(heatmapData, d => d.value)])
        .range([0, totalWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickSize(10)
        .tickFormat(d3.format(".3s"));

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
    function reorderHeatmap() {
        yScale.domain(finalCountries);

        rows.transition()
            .duration(300)
            .attr("transform", d => "translate(0," + yScale(d) + ")");

        svg.select(".y.axis")
            .transition()
            .duration(300)
            .call(yAxis);
    }
    }
}
