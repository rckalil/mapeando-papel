// Get the <ul> element by its id
const myList = document.getElementById("my-list");

// Fetch the CSV file
fetch("data/Coffee_Qlty.csv")
    .then(response => response.text())
    .then(csvData => {
        // Parse the CSV data
        const countries = parseCSV(csvData);
        // console.log(countries);

        // Loop through the countries array
        countries.forEach(country => {
            // Create a new <li> element
            const listItem = document.createElement("li");

            // Add the "country" class to the <li> element
            listItem.classList.add("country");

            // Set the text content of the <li> element to the country name
            listItem.textContent = country;

            // Append the <li> element to the <ul> element
            myList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error("Error fetching or parsing CSV file:", error);
    });
console.log(myList);
// Function to parse CSV data
// function parseCSV(csvData) {
//     // Use a CSV parsing library to parse the data
//     // For example, you can use 'csv-parser' or 'papaparse'
//     // Here's an example using 'csv-parser':
//     const parsedData = csvParser(csvData);
    
//     // Extract the country names from the parsed data
//     const countries = parsedData.map(row => row.Country.of.Origin);
    
//     return countries;
// }


// Function to parse CSV data
function parseCSV(csvData) {
    // Use the csv-parser library to parse the data
    const parsedData = csvData
        .split('\n')
        .slice(1)
        .map(row => row.split(','));

    // Extract the country names from the parsed data
    const countries = parsedData.map(row => row[3]);

    // Remove duplicate country names
    const uniqueCountries = [...new Set(countries)];

    return uniqueCountries;
}
