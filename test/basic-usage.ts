const assert = require("assert").strict;
const fs = require("fs");

const csv = require("../src/index");

// My table containing very important data
const data = [
    ["Continent", "Country", "Capital"],
    ["Africa", "Egypt", "Cairo"],
    ["Africa", "Morocco", "Rabat"],
    ["Asia", "China", "Beijing"],
    ["Asia", "Japan", "Tokyo"],
    ["Australia", "Australia", "Canberra"],
    ["Europe", "Britian", "London"],
    ["Europe", "Finland", "Helsinki"],
    ["North America", "Cuba", "Havana"],
    ["North America", "United States", "Washington"],
    ["South America", "Brazil", "Brasilia"],
    ["South America", "Ecuador", "Quito"],
];

// Write my data as a CSV file
const path = __dirname + "/basic-usage.csv";
fs.writeFileSync(path, csv.write(data));

// Load the data back from my CSV file
const content = fs.readFileSync(path, "utf8");
const parsedRows = csv.parse(content).rows();

// Parsed data is equivalent to the written data
assert.deepEqual(parsedRows, data);
