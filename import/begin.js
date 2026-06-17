preselectData = function() {
    const svg = d3.select("#map svg g");
    const selection = [[100, 100], [300, 300]];  // Ajuste conforme necessário
    const [[x0, y0], [x1, y1]] = selection;

    const selectedPaths = svg.selectAll("path")
        .filter(d => d.properties.pais === "Argentina" || d.properties.pais === "Uruguay")
        .classed("selected", true);

    updateHeatmap();
}

document.addEventListener('DOMContentLoaded', function() {
    buildMap();
    prepareData();
    preselectData();
});