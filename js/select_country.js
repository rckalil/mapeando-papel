// Selecione o elemento <ul>
const ulElement = document.querySelector("ul#my-list");

// Selecione todos os elementos <li> dentro do elemento <ul>
const countries = ulElement.querySelectorAll("li");

let lastClickedCountry = null; // Armazena a referência para o último elemento clicado

function cleanMap() {
    let x = document.getElementsByClassName('map');
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    let y = document.getElementsByClassName('radar');
    for (i = 0; i < y.length; i++) {
        y[i].style.display = "block";
    }
    let z = document.getElementsByClassName('line');
    for (i = 0; i < z.length; i++) {
        z[i].style.display = "block";
    }
}

function remakeMap() {
    let x = document.getElementsByClassName('map');
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "block";
    }
    let y = document.getElementsByClassName('radar');
    for (i = 0; i < y.length; i++) {
        y[i].style.display = "none";
    }
    let z = document.getElementsByClassName('line');
    for (i = 0; i < z.length; i++) {
        z[i].style.display = "none";
    }
}

// Adicione um evento de clique a cada elemento <li>
countries.forEach(country => {
    country.addEventListener("click", () => {
        const conteudo = country.textContent;
        if (lastClickedCountry!=country&&lastClickedCountry!=null) {
            // Redefine o estilo do último elemento clicado
            lastClickedCountry.style.backgroundColor = "";
            lastClickedCountry.style.color = "";
            lastClickedCountry.classList.remove("active");
        }

        // Aplica o estilo ao novo elemento clicado
        country.style.backgroundColor = "#333";
        country.style.color = "#fff";
        country.classList.add("active");

        // Atualiza a referência para o último elemento clicado
        lastClickedCountry = country;

        if (conteudo !== "All") {
            cleanMap();
            radarFunction();
            lineChartFunction();
        }
        else {
            d3.select("#heatmap").selectAll("*").remove();
            window.location.reload();
        }
        
    });
});