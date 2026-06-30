function prepareData() {
    d3.csv("../flow_heat/big-3.csv").then(function(data) {
        // Formatar os dados corretamente
        data.forEach(d => {
            d.YearMonth = parseFloat(d.Year.slice(-2) + "." + (d.Month.length === 1 ? "0" + d.Month : d.Month));
            d.Year = +d.Year;
            d.Month = +d.Month;
            d.Info = d.Info;
            d.Country = d.Country;
            d.Code = d.Code;
            d.Value = +d.Value;
        });

        // =================================================================
        // NOVA FUNCIONALIDADE: POPULAR E CONFIGURAR O SELECT DINAMICAMENTE
        // =================================================================
        
        // 1. Extrair os tipos de produtos únicos da coluna 'Info' e ordenar de A-Z
        const produtosUnicos = Array.from(new Set(data.map(d => d.Info)))
                                    .filter(d => d) // Remove nulos ou vazios
                                    .sort();

        // 2. Selecionar o elemento HTML <select>
        const selectElement = d3.select("#select-atributos");
        
        // Limpar a mensagem de "Carregando..."
        selectElement.html("");

        // 3. Inserir as opções dinâmicas no select
        selectElement.selectAll("option")
            .data(produtosUnicos)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        // 4. Se a variável global ainda não estiver definida, pegamos o primeiro item da lista
        if (typeof variable === 'undefined' || !variable) {
            variable = produtosUnicos[0];
        } else {
            // Caso já exista um valor inicial, força o select a exibir ele como selecionado
            selectElement.property("value", variable);
        }

        // =================================================================

        // Obter a lista de países únicos
        const countries = Array.from(new Set(data.map(d => d.Country)));
        // Ordenar os países em ordem alfabética
        countries.sort();

        // Função para selecionar ou desmarcar todos os países
        function toggleSelectAll(checked) {
            const checkboxes = document.querySelectorAll(".country-checkbox");
            checkboxes.forEach(cb => cb.checked = checked);
            updateHeatmap();
        }

        // Construir o heatmap inicial com todos os dados
        updateHeatmap();

        // Nota: A função toggleActiveButton e os listeners manuais de botões foram 
        // removidos daqui já que o evento 'onchange' do HTML cuida do select.

    }).catch(function(error) {
        console.error("Erro ao carregar o arquivo CSV:", error);
    });
}

// Função para obter os países selecionados
function getSelectedCountries() {
    const checkboxes = document.querySelectorAll(".selected");
    return Array.from(checkboxes).map(path => path.__data__.id);
}

// Função para atualizar o heatmap com base nos filtros selecionados
function updateHeatmap() {
    d3.csv("../flow_heat/big-3.csv").then(function(data) {
        // Formatar os dados corretamente
        data.forEach(d => {
            d.YearMonth = parseFloat(d.Year.slice(-2) + "." + (d.Month.length === 1 ? "0" + d.Month : d.Month));
            d.Year = +d.Year;
            d.Month = +d.Month;
            d.Info = d.Info;
            d.Country = d.Country;
            d.Value = +d.Value;
        });

        const selectedCountries = getSelectedCountries();
        console.log(selectedCountries);
        
        // =================================================================
        // AJUSTE: Pegar o tipo de filtro diretamente da caixa de seleção (<select>)
        // =================================================================
        const select = document.getElementById('select-atributos');
        const filterType = select ? select.value : variable;
        // =================================================================

        if (selectedCountries.length === 0) {
            buildHeatmap([], filterType); // Sem dados se nenhum país estiver selecionado
        } else {
            const filteredData = data.filter(d => selectedCountries.includes(d.Code) && d.Info === filterType);
            buildHeatmap(filteredData, filterType);
        }
    });
}

// Função chamada pelo evento 'onchange' do seu HTML <select>
function updateVariable(newVariable) {
    variable = newVariable;
    updateHeatmap();
}