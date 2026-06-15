function buildMap() {
    //console.log("Construindo o mapa");
    const sWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const sHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    console.log("Largura da tela: ", sWidth);
    console.log("Altura da tela: ", sHeight);
    // Set the dimensions and margins of the graph
    const margin = { top: sHeight/60, right: sWidth/120, bottom: sHeight/60, left: sWidth/120 };
    const width = sWidth/2 - margin.left - margin.right;  // Ajuste a largura conforme necessário
    const height = 2*sHeight/3 - margin.top - margin.bottom;  // Ajuste a altura conforme necessário

    // Create SVG element
    const svg = d3.select("#map").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height*2/3 + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a projection and path generator
    const projection = d3.geoMercator().scale(sWidth/20).translate([width/3, height/2]);  // Ajuste a escala conforme necessário
    const path = d3.geoPath().projection(projection);

    // Load and render the world map
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(worldData => {
        //console.log("Mapa vindo");
        const countries = worldData.features;
        //console.log("Countries: ", countries);

        const countryPaths = svg.selectAll("path")
            .data(countries)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country");

        //console.log("Country paths: ", countryPaths);

        // Create a brush
        const brush = d3.brush()
            .extent([[0, 0], [width, height]])
            .on("brush", brushed)
            .on("end", brushended);

        svg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            const selection = event.selection;
            if (selection === null) return;

            const [[x0, y0], [x1, y1]] = selection;

            svg.selectAll("path")
                .classed("selected", d => {
                    const [x, y] = path.centroid(d);
                    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                });
            //console.log("Nenhum país selecionado");
            updateHeatmap();
            //console.log("Heatmap atualizado");
        }

        function brushended(event) {
            if (!event.selection) {
                svg.selectAll(".selected").classed("selected", false);
            }
        }
    }).catch(error => {
        console.error("Erro ao carregar os dados do mapa: ", error);
    });
}
