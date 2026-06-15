function prepareData() {
    d3.csv("big-3.csv").then(function(data) {
        //d("Dados CSV carregados:", data);
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

        // Verificar a estrutura dos dados
        //d("Dados CSV carregados:", data);

        // Defina o tipo de café a ser filtrado
        const filterType = "Papel Kraft, de peso igual ou superior a 40 g/m2, mas não superior a 150 g/m2"; // Altere conforme necessário

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

        function toggleActiveButton(value, selector, activeClass, selectedValue) {
            const buttons = document.querySelectorAll('button');
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
            //d("Variável atualizada para:", variable);
            toggleActiveButton(newVariable, "#attributes-button", 'button-active', newVariable);
            updateHeatmap();
        }

    // Adicionar evento de clique aos botões
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.innerText;
            updateVariable(buttonText);
        });
    });

    }).catch(function(error) {
        console.error("Erro ao carregar o arquivo CSV:", error);
    });
}

// Função para obter os países selecionados
function getSelectedCountries() {
    const checkboxes = document.querySelectorAll(".selected");
    //d("Checkboxes:", checkboxes);
    return Array.from(checkboxes).map(path => path.__data__.id);
    //return Array.from(checkboxes).map(checkbox => checkbox.getAttribute("data-country"));
}

// Função para atualizar o heatmap com base nos filtros selecionados
function updateHeatmap() {
    d3.csv("big-3.csv").then(function(data) {
        //d("Dados CSV carregados:", data);
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
        //d("Países selecionados:", selectedCountries);
        //const selectedCountries = countries;
        const filterType = document.querySelector('button.button-active').innerText;
        if (selectedCountries.length === 0) {
            buildHeatmap([], filterType); // Sem dados se nenhum país estiver selecionado
        } else {
            const filteredData = data.filter(d => selectedCountries.includes(d.Code) && d.Info === filterType);
            //d("Dados filtrados:", filteredData);
            buildHeatmap(filteredData, filterType);
        }
    });
}