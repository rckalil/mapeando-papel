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

// Função para carregar o JSON e preencher o select
function carregarOpcoesSelect() {
    const urlJson = './setor.json'; // Atualize com o caminho correto do seu arquivo

    fetch(urlJson)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo JSON');
            }
            return response.json();
        })
        .then(data => {
            const select = document.getElementById('select-atributos');
            
            // Limpa o texto de "Carregando opções..."
            select.innerHTML = '';

            // Popula o select com os novos dados do papel
            data.forEach(item => {
                const option = document.createElement('option');
                // O 'value' é o que será passado para a função updateVariable()
                option.value = item.nome; 
                option.textContent = item.nome;
                select.appendChild(option);
            });

            // Opcional: Dispara a atualização inicial com o primeiro item do JSON
            if (data.length > 0) {
                updateVariable(data[0].nome);
            }
        })
        .catch(error => {
            console.error('Erro na requisição das opções do select:', error);
            const select = document.getElementById('select-atributos');
            select.innerHTML = '<option>Erro ao carregar opções</option>';
        });
}

// Chame a função quando a página/scripts carregarem
document.addEventListener('DOMContentLoaded', carregarOpcoesSelect);