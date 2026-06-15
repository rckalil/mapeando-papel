
function heatmapFunction() {
  // Limpar o conteúdo SVG anterior
  d3.select("#heatmap").selectAll("*").remove();
// set the dimensions and margins of the graph
const margin = {top: 80, right: 80, bottom: 50, left: 80},
  width = 500 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;



// append the svg object to the body of the page
const svg = d3.select("#heatmap")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // svg.selectAll("rect")
  //   .style("fill", "white");

  const country = document.querySelector("ul#my-list li.active").textContent;
  console.log(country);
  const tipo = document.querySelector("div#tipo button.button-active-tipo").textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  console.log(tipo);

//Read the data
d3.csv("data/Coffee_Qlty.csv").then(function(data) {

//   Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
//   const myGroups = Array.from(new Set(data.map(d => d.group)))
//   const myVars = Array.from(new Set(data.map(d => d.variable)))

// Filter the data
if (tipo === "Both") {
  var filterData = data.filter(function(d) { return d["Country.of.Origin"] == country; });
} else {
  var filterData = data.filter(function(d) { return d["Country.of.Origin"] == country && d.Species == tipo; });
}

// Transform the data
var tranData = [];
var groups = Array.from(new Set(filterData.map(d => d["Harvest.Year"])));
var variables = ["Aroma", "Flavor", "Aftertaste", "Acidity", "Balance", "Sweetness"];

var averageData = d3.rollups(
  tranData,
  function(v) { return d3.mean(v, function(d) { return d.value; }); },
  function(d) { return d.group; }
);

groups.forEach(function(group) {
  variables.forEach(function(variable) {
    var values = filterData.filter(function(d) { return d["Harvest.Year"] == group; })
                          .map(function(d) { return d[variable]; });
    var average = d3.mean(values);
    var obj = {
      group: group,
      variable: variable,
      value: average
    };
    tranData.push(obj);
  });
});

// Add the average values to tranData
tranData.forEach(function(d) {
  var average = averageData.find(function(a) { return a[0] === d.group; });
  d.value = average ? average[1] : d.value;
});

// Get unique groups and variables
var myGroups = Array.from(new Set(tranData.map(function(d) { return d.group; })));
myGroups.sort((a, b) => a.localeCompare(b));
myGroups = myGroups.filter(group => group !== "");
var myVars = Array.from(new Set(tranData.map(function(d) { return d.variable; })));

// // Sort tranData by groups
// tranData.sort((a, b) => a.group.localeCompare(b.group));

const selectedRectangles = [];

// Função para calcular minValue e maxValue
function calculateMinMax() {
  if (selectedRectangles.length > 0) {
    const selectedValues = selectedRectangles.map(d => d.value);
    minValue = d3.min(selectedValues);
    maxValue = d3.max(selectedValues);
  } else {
    const allValues = tranData.map(d => d.value);
    minValue = d3.min(allValues);
    maxValue = d3.max(allValues);
  }
}

calculateMinMax();



  // Build X scales and axis:
  const x = d3.scaleBand()
    .range([ 0, width ])
    .domain(myGroups)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .select(".domain").remove();

  // Build Y scales and axis:
  const y = d3.scaleBand()
    .range([ height, 0 ])
    .domain(myVars)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove()

  // Build color scale
  const myColor = d3.scaleSequential()
    .interpolator(d3.interpolateRgb("#ebffdc", "#1f4a02"))
    .domain([minValue, maxValue])

  // create a tooltip
  const tooltip = d3.select("#heatmap")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function(event,d) {
    tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
      // console.log("Mouseover event triggered!");
  }
//   const mousemove = function(event,d) {
//     const [xCoord, yCoord] = d3.pointer(event, this);
//     tooltip
//       .html("The exact value of<br>this cell is: " + d.value)
//       .style("left", (xCoord + 10) + "px")
//       .style("top", (yCoord + 10) + "px")
//     console.log("Mousemove event triggered!");
// }
const mousemove = function(event,d) {
  tooltip
    .html("The exact value of<br>this cell is: " + d.value)
    .style("left", (event.x) + "px")
    .style("top", (event.y) + "px")
  // console.log("Mousemove event triggered!" + d.value);
}
  const mouseleave = function(event,d) {
    tooltip
      .style("opacity", 0)
    if (!selectedRectangles.includes(d)) {
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }
    // console.log("Mouseleave event triggered!");
  }

  // add the squares
  svg.selectAll()
    .data(tranData, function(d) {return d.group+':'+d.variable;})
    .join("rect")
      .attr("class", "cell")
      .attr("x", function(d) { return x(d.group) })
      .attr("y", function(d) { return y(d.variable) })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.value)} )
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
  
///////////////////// Gradiente de cores
// Define a escala linear para o gradiente de cores
const colorScale = d3.scaleSequential(d3.interpolateRgb("#ebffdc", "#1f4a02"))
  // .range(["#FF0000", "#00FF00"]) // Escolha as cores desejadas
  .domain([minValue, maxValue]); // Use os valores mínimos e máximos de sua escala de cores

// Adicione um gradiente de cores ao SVG
svg.append("linearGradient")
  .attr("id", "colorGradient")
  .attr("gradientUnits", "userSpaceOnUse")
  .attr("x1", 0).attr("y1", 0)
  .attr("x2", 0).attr("y2", height)
  .selectAll("stop")
  .data(colorScale.ticks(10)) // Divida a escala de cores em 10 partes (ou o número desejado de etapas)
  .enter().append("stop")
    .attr("offset", d => ((d - minValue) / (maxValue - minValue)) * 100 + "%")
    .attr("stop-color", d => colorScale(d));

// Adicione o retângulo que mostrará o gradiente de cores
svg.append("rect")
  .attr("class", "colorLegend")
  .attr("width", 20) // Largura do retângulo
  .attr("height", height) // Altura do retângulo
  .attr("x", width + 10) // Posição x do retângulo
  .attr("y", 0) // Posição y do retângulo
  .style("fill", "url(#colorGradient)"); // Preenchimento com o gradiente de cores

// Adicione a legenda
svg.append("text")
  .attr("class", "legend")
  .attr("x", width + 10) // Posição x do texto
  .attr("y", -10) // Posição y do texto
  .attr("text-anchor", "left")
  .style("font-size", "12px")
  .text(maxValue.toFixed(2)); // Texto da legenda

svg.append("text")
  .attr("class", "legend")
  .attr("x", width + 10) // Posição x do texto
  .attr("y", height + 10) // Posição y do texto
  .attr("text-anchor", "left")
  .style("font-size", "12px")
  .text(minValue.toFixed(2)); // Texto da legenda

// Função para atualizar a escala de cores e o gradiente de cores
function updateColorScale() {
  // Atualizar escala de cores
  colorScale.domain([minValue, maxValue]);

  svg.selectAll(".cell")
    .style("fill", function(d) { return colorScale(d.value); });

  // Atualizar gradiente de cores
  svg.select("#colorGradient")
    .selectAll("stop")
    .data(colorScale.ticks(10))
    .attr("offset", d => ((d - minValue) / (maxValue - minValue)) * 100 + "%")
    .attr("stop-color", d => colorScale(d));

  // Atualizar o retângulo que mostra o gradiente de cores
  svg.select(".colorLegend")
    .attr("width", 20) // Largura do retângulo
    .attr("height", height) // Altura do retângulo
    .attr("x", width + 10) // Posição x do retângulo
    .attr("y", 0) // Posição y do retângulo
    .style("fill", "url(#colorGradient)"); // Preenchimento com o gradiente de cores
  

  // Atualizar a legenda
  svg.selectAll("text.legend").remove(); // Remove a legenda anterior

  svg.append("text")
    .attr("class", "legend")
    .attr("x", width + 10) // Posição x do texto
    .attr("y", -10) // Posição y do texto
    .attr("text-anchor", "left")
    .style("font-size", "12px")
    .text(minValue.toFixed(2)); // Texto da legenda

  svg.append("text")
    .attr("class", "legend")
    .attr("x", width + 10) // Posição x do texto
    .attr("y", height + 10) // Posição y do texto
    .attr("text-anchor", "left")
    .style("font-size", "12px")
    .text(maxValue.toFixed(2)); // Texto da legenda
}
updateColorScale();

// // Função para atualizar a aparência dos retângulos com base nos valores selecionados
// function updateRectangles() {
//   svg.selectAll("rect")
//     .style("fill", function(d) { return myColor(d.value); })
//     .style("stroke", function(d) { return selectedRectangles.includes(d) ? "black" : "none"; });
// }


///////Clique num retângulo para análise particular
// Adicione a seleção de retângulos com o cursor

const clickRectangle = function(event, d) {
  const rectangle = d3.select(this);

  // Verifique se o retângulo já está selecionado
  const isSelected = selectedRectangles.includes(d);

  // Se o retângulo já estiver selecionado, remova-o da lista e restaure sua aparência original
  if (isSelected) {
    selectedRectangles.splice(selectedRectangles.indexOf(d), 1);
    rectangle.style("stroke", "none");
  } else { // Se o retângulo não estiver selecionado, adicione-o à lista e mude sua aparência para indicar seleção
    selectedRectangles.push(d);
    rectangle.style("stroke", "black")
             .style("stroke-width", 2);
  }

  // Aqui você pode adicionar qualquer lógica adicional com base nos retângulos selecionados, se necessário
  calculateMinMax();
  updateColorScale();
}


// Adicione o evento de clique aos retângulos
svg.selectAll("rect")
  .on("click", clickRectangle);




/////////////// Adicione um botão como um elemento SVG
const clearButton = svg.append("foreignObject")
  .attr("x", -80) // Posição x do botão
  .attr("y", height) // Posição y do botão
  .attr("width", 60) // Largura do botão
  .attr("height", 30); // Altura do botão

// Adicione um botão dentro do elemento foreignObject
clearButton.append("xhtml:button")
  .attr("class", "clearButton") // Adicione uma classe CSS para estilização opcional
  .text("Limpar")
  .on("click", function() {
    // Remova a borda de todos os retângulos selecionados
    svg.selectAll("rect")
      .style("stroke", "none");
    console.log("Limpar Seleção");

    // Limpe a lista de retângulos selecionados
    selectedRectangles.length = 0;
    calculateMinMax();
    updateColorScale();
  });




})

// Add title to graph
svg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text("Características do café em " + country);

// Add subtitle to graph
svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("fill", "grey")
        .style("max-width", 400)
        .text("Selecione os retângulos para uma análise detalhada.");


}
