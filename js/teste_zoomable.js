  // Specify the chart’s dimensions.
  const width = 600;
  const height = width;
  const radius = width / 6;

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('countryName');
    renderZoomableChart(paramValue);
});
// Center the zoomable chart
function initializeZoomable() {
    d3.select("#zoomableChart").selectAll("*").remove();
    svg = d3.select("#zoomableChart").append("svg")
        .attr("width", 600)
        .attr("height", 600)
        .attr("background-color", "green")
        .append("g")
        .attr("transform", "translate(300,300)");


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

        // Escolha cores específicas para cada categoria
        const colorMapping = {
            "Exports": "#492907",
            "Roast & Ground Exports": "#703f0c",
            "Bean Exports": "#703f0c",
            "Soluble Exports": "#703f0c",
            "Imports": "#ae773c",
            "Roast & Ground Imports": "#cc8e4bn",
            "Bean Imports": "#cc8e4b",
            "Soluble Imports": "#cc8e4b"
        };

        // Criar uma escala de cor que usa este mapeamento
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
              .padRadius(radius * 1.5)
              .innerRadius(d => d.y0 * radius)
              .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

          // Create the SVG container.
          svg = d3.select("#zoomableChart").append("svg")
          .attr("width", 600)
          .attr("height", 600)
          .attr("background-color", "green")
          .append("g")
          .attr("transform", "translate(300,300)");
          // Append the arcs.
          const path = svg.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
              .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
              .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
              .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
              .attr("d", d => arc(d.current));

          // Make them clickable if they have children.
          path.filter(d => d.children)
              .style("cursor", "pointer")
              .on("click", clicked);

          const format = d3.format(",d");
          path.append("title")
              .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

          const label = svg.append("g")
              .attr("pointer-events", "none")
              .attr("text-anchor", "middle")
              .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
              .attr("dy", "0.35em")
              .attr("fill-opacity", d => +labelVisible(d.current))
              .attr("transform", d => labelTransform(d.current))
              .text(d => d.data.name);

          const parent = svg.append("circle")
              .datum(root)
              .attr("r", radius)
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
          
            const t = svg.transition().duration(750);
          
            // Transition the data on all arcs, even the ones that aren’t visible,
            // so that if this transition is interrupted, entering arcs will start
            // the next transition from the desired position.
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
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }


  })
  .catch(error => console.error('Error loading JSON:', error));

}

function zoomableFunction() {
  initializeZoomable();
}

