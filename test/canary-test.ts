require("source-map-support").install();

import {strict as assert} from "assert";
import * as fs from "fs";

import {Group as CanaryGroup} from "canary-test";

import * as csv from "../src/index";

export const canary = CanaryGroup("csvjs");
export default canary;

canary.test("Write empty CSV", async function() {
    const data = (new csv.Writer()).write([]);
    assert.equal(data, "");
});

canary.test("Parse empty CSV", async function() {
    const rows = (new csv.Parser()).parse("").rows();
    assert.equal(rows.length, 0);
});

canary.test("Write CSV with a single empty row", async function() {
    const data = (new csv.Writer()).write([[]]);
    assert.equal(data, "\r\n");
});

canary.test("Parse CSV with a single empty row", async function() {
    const rows = (new csv.Parser()).parse("\r\n").rows();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].length, 0);
});

canary.test("Write CSV with a single row and column", async function() {
    const data = (new csv.Writer()).write([["Test"]]);
    assert.equal(data, "Test\r\n");
});

canary.test("Parse CSV with a single row and column", async function() {
    const rows = (new csv.Parser()).parse("Test\r\n").rows();
    assert.deepEqual(rows, [["Test"]]);
});

canary.test("Write CSV with a single row and several columns", async function() {
    const data = (new csv.Writer()).write([["One", "Two", "Three", "Four"]]);
    assert.equal(data, "One,Two,Three,Four\r\n");
});

canary.test("Parse CSV with a single row and several columns", async function() {
    const rows = (new csv.Parser()).parse("One,Two,Three,Four\r\n").rows();
    assert.deepEqual(rows, [["One", "Two", "Three", "Four"]]);
});

canary.test("Write CSV with a single column and several rows", async function() {
    const data = (new csv.Writer()).write([["One"], ["Two"], ["Three"], ["Four"]]);
    assert.equal(data, "One\r\nTwo\r\nThree\r\nFour\r\n");
});

canary.test("Parse CSV with a single column and several rows", async function() {
    const rows = (new csv.Parser()).parse("One\r\nTwo\r\nThree\r\nFour\r\n").rows();
    assert.deepEqual(rows, [["One"], ["Two"], ["Three"], ["Four"]]);
});

const csvRows3x3 = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
];

const csvData3x3 = (
    "1,2,3\r\n" +
    "4,5,6\r\n" +
    "7,8,9\r\n"
);

canary.test("Write CSV with several rows and columns", async function() {
    const data = (new csv.Writer()).write(csvRows3x3);
    assert.equal(data, csvData3x3);
});

canary.test("Parse CSV with several rows and columns", async function() {
    const rows = (new csv.Parser()).parse(csvData3x3).rows();
    assert.deepEqual(rows, csvRows3x3);
});

const csvRowsMissing3x3 = [
    ["1", "", "2"],
    ["", "3", "4"],
    ["5", "6", ""],
    ["", "", ""],
    ["", "7", ""],
    ["8", "", ""],
    ["", "", "9"],
];

const csvDataMissing3x3 = (
    "1,,2\r\n" +
    ",3,4\r\n" +
    "5,6,\r\n" +
    ",,\r\n" +
    ",7,\r\n" +
    "8,,\r\n" +
    ",,9\r\n"
);

canary.test("Write CSV with several rows and some empty columns", async function() {
    const data = (new csv.Writer()).write(csvRowsMissing3x3);
    assert.equal(data, csvDataMissing3x3);
});

canary.test("Parse CSV with several rows and some empty columns", async function() {
    const rows = (new csv.Parser()).parse(csvDataMissing3x3).rows();
    assert.deepEqual(rows, csvRowsMissing3x3);
});

const csvRowsVariable3x3 = [
    ["1", "2", "3"],
    [],
    ["4"],
    ["5", "6"],
];

const csvDataVariable3x3 = (
    "1,2,3\r\n" +
    "\r\n" +
    "4\r\n" +
    "5,6\r\n"
);

canary.test("Write CSV with several rows and varying numbers of columns", async function() {
    const data = (new csv.Writer()).write(csvRowsVariable3x3);
    assert.equal(data, csvDataVariable3x3);
});

canary.test("Parse CSV with several rows and varying numbers of columns", async function() {
    const rows = (new csv.Parser()).parse(csvDataVariable3x3).rows();
    assert.deepEqual(rows, csvRowsVariable3x3);
});

canary.test("Write CSV with values that must be escaped", async function() {
    const dataRowSep = (new csv.Writer()).write([["Hello\r", " ", "World\n", "\r\n!"]]);
    assert.equal(dataRowSep, `"Hello\r", ,"World\n","\r\n!"\r\n`);
    const dataColSep = (new csv.Writer()).write([["Hello,", "World", ",!"]]);
    assert.equal(dataColSep, `"Hello,",World,",!"\r\n`);
    const dataQuote = (new csv.Writer()).write([[`He"o`, `"World"`, "!"]]);
    assert.equal(dataQuote, `"He""o","""World""",!\r\n`);
});

canary.test("Parse CSV with values that must be escaped", async function() {
    const rowsRowSep = (new csv.Parser()).parse(`"Hello\r", ,"World\n","\r\n!"\r\n`).rows();
    assert.deepEqual(rowsRowSep, [["Hello\r", " ", "World\n", "\r\n!"]]);
    const rowsColSep = (new csv.Parser()).parse(`"Hello,",World,",!"\r\n`).rows();
    assert.deepEqual(rowsColSep, [["Hello,", "World", ",!"]]);
    const rowsQuote = (new csv.Parser()).parse(`"He""o","""World""",!\r\n`).rows();
    assert.deepEqual(rowsQuote, [[`He"o`, `"World"`, "!"]]);
});

canary.test("Write CSV with a blank quote-escape character", async function() {
    // This is to make sure the writer doesn't break. Please don't actually do this!
    const writer = new csv.Writer({quote: ""});
    assert.equal(writer.write([[`"Hello\r\n",`]]), `"Hello\r\n",\r\n`);
});

canary.test("Write CSV with a blank column separator", async function() {
    // This is to make sure the writer doesn't break. Please don't actually do this!
    const writer = new csv.Writer({separator: ""});
    const rows = [[], [""], ["Hello"], ["One", "Two"]];
    assert.equal(writer.write(rows), "\r\n\r\nHello\r\nOneTwo\r\n");
});

canary.test("Write CSV with a blank row terminator", async function() {
    // This is to make sure the writer doesn't break. Please don't actually do this!
    const writer = new csv.Writer({newline: ""});
    const rows = [["One", "Two"], [], ["Three", "Four"], []];
    assert.equal(writer.write(rows), "One,TwoThree,Four");
    assert.equal(Array.from(writer.iterate(rows)).join(""), "One,TwoThree,Four");
    assert.deepEqual(Array.from(writer.rows(rows)), ["One,Two", "", "Three,Four", ""]);
});

canary.test("Write CSV with Unix line separators", async function() {
    const data = (new csv.Writer({newline: "\n"})).write([["One"], ["Two"], ["Three"]]);
    assert.equal(data, "One\nTwo\nThree\n");
});

canary.test("Parse CSV with Unix line separators", async function() {
    const rows = (new csv.Parser()).parse("One\nTwo\nThree\n").rows();
    assert.deepEqual(rows, [["One"], ["Two"], ["Three"]]);
});

canary.test("Parse CSV with mixed Unix and Windows line separators", async function() {
    const rows = (new csv.Parser()).parse("One\n\nTwo\r\nThree\n\r\n").rows();
    assert.deepEqual(rows, [["One"], [], ["Two"], ["Three"], []]);
});

canary.test("Parse CSV with no trailing line separator", async function() {
    const rows = (new csv.Parser()).parse("ABC\r\n123").rows();
    assert.deepEqual(rows, [["ABC"], ["123"]]);
});

canary.test("Write CSV with horizontal tab column separators", async function() {
    const writer = new csv.Writer({separator: "\t"});
    const data = writer.write([["One", "Two"], ["Three", "Four"]]);
    assert.equal(data, "One\tTwo\r\nThree\tFour\r\n");
});

canary.test("Parse CSV with horizontal tab column separators", async function() {
    const parser = new csv.Parser({separator: "\t"});
    const rows = parser.parse("One\tTwo\r\nThree\tFour\r\n").rows();
    assert.deepEqual(rows, [["One", "Two"], ["Three", "Four"]]);
});

canary.test("Write CSV with vertical bar column separators", async function() {
    const writer = new csv.Writer({separator: "|"});
    const data = writer.write([["One", "Two"], ["Three", "Four"]]);
    assert.equal(data, "One|Two\r\nThree|Four\r\n");
});

canary.test("Parse CSV with vertical bar column separators", async function() {
    const parser = new csv.Parser({separator: "|"});
    const rows = parser.parse("One|Two\r\nThree|Four\r\n").rows();
    assert.deepEqual(rows, [["One", "Two"], ["Three", "Four"]]);
});

canary.test("Write CSV and iterate characters", async function() {
    const rows = (new csv.Writer()).rows([["One", "Two"], ["Three", "Four"]]);
    let rowNumber = 0;
    for(const row of rows) {
        assert(row === ["One,Two\r\n", "Three,Four\r\n"][rowNumber]);
        rowNumber++;
    }
});

canary.test("Write CSV and iterate rows", async function() {
    const iter = (new csv.Writer()).iterate([["One", "Two"], ["Three", "Four"]]);
    const data = Array.from(iter).join("");
    assert.equal(data, "One,Two\r\nThree,Four\r\n");
});

canary.test("Parse CSV and iterate rows", async function() {
    const rows = (new csv.Parser()).parse("One,Two\r\nThree,Four\r\n");
    let rowNumber = 0;
    for(const row of rows) {
        assert.deepEqual(row, [["One", "Two"], ["Three", "Four"]][rowNumber]);
        rowNumber++;
    };
});

canary.test("Write CSV to file stream", function() {
    return new Promise((resolve, reject) => {
        const path = __dirname + "/test-output.csv";
        const fileStream = fs.createWriteStream(path, "utf8");
        const writeStream = (new csv.Writer()).stream([
            ["One", "Two", "Three"],
            ["Four", "Five", "Six"],
            ["Seven", "Eight", "Nine"],
        ]);
        writeStream.pipe(fileStream);
        writeStream.on("error", reject);
        fileStream.on("error", reject);
        fileStream.on("finish", () => {
            fileStream.end();
            const data = fs.readFileSync(path, "utf8");
            assert.equal(data, (
                "One,Two,Three\r\n" +
                "Four,Five,Six\r\n" +
                "Seven,Eight,Nine\r\n"
            ));
            resolve();
        });
    });
});

canary.test("Parse CSV from file stream", function() {
    return new Promise((resolve, reject) => {
        const path = __dirname + "/../../test/test.csv";
        const fileStream = fs.createReadStream(path, "utf8");
        fileStream.on("error", reject);
        fileStream.on("readable", () => {
            const rows = (new csv.Parser()).parse(fileStream).rows();
            assert.deepEqual(rows, [
                ["One", "Two", "Three"],
                ["Four", "Five", "Six"],
                ["Seven", "Eight", "Nine"],
            ]);
            resolve();
        });
    });
});

canary.test("Write CSV using values yielded from a generator", async function() {
    const generator = function* rows() {
        yield ["ABC", "DEF"];
        yield ["GHI", "JKL"];
        yield (function*(){yield "MNO"; yield "PQR";})();
    }
    const rows = (new csv.Writer()).write(generator());
    assert.equal(rows, (
        "ABC,DEF\r\n" +
        "GHI,JKL\r\n" +
        "MNO,PQR\r\n"
    ));
});

canary.test("Write CSV using values yielded from an iterator", async function() {
    const iterator = (<any> [["One", "Two"], ["Three", "Four"]])[Symbol.iterator]();
    assert.equal((new csv.Writer()).write(iterator), "One,Two\r\nThree,Four\r\n");
});

canary.test("Write CSV with all columns quoted", async function() {
    const writer = new csv.Writer({quoteAll: true});
    assert.equal(writer.write([["Hello", `"World"`, "!"]]),
        `"Hello","""World""","!"\r\n`
    );
});

canary.test("Write CSV with custom quote character", async function() {
    const writer = new csv.Writer({quote: "'"});
    assert.equal(writer.write([["Hello,", "'", `"World"`, "!"]]),
        `'Hello,','''',"World",!\r\n`
    );
});

canary.test("Parse CSV with custom quote character", async function() {
    const parser = new csv.Parser({quote: "'"});
    assert.deepEqual(parser.parse(`'Hello,','''',"World",!\r\n`).rows(),
        [["Hello,", "'", `"World"`, "!"]]
    );
});

canary.test("Write CSV individually row-by-row", async function() {
    const writer = new csv.Writer();
    assert.equal(writer.writeRow([]), "\r\n");
    assert.equal(writer.writeRow(["Test"]), "Test\r\n");
    assert.equal(writer.writeRow(["One", "Two"]), "One,Two\r\n");
    // Reasonably handle the degenerate case where no row was given
    assert.equal(writer.writeRow(<any> null), "\r\n");
});

canary.test("Parse without any assigned source data", async function() {
    // A typical failure case - never assigned a source
    const parser = new csv.Parser();
    assert.equal(0, parser.rows().length);
    // Other degenerate case - assigned a NodeJS readable stream source
    // but the iterable object hasn't actually been assigned a backing stream.
    parser.parse(new csv.NodeStreamSource(<any> null));
    assert.equal(0, parser.rows().length);
});

canary.test("Parse CSV using convenience global function", async function() {
    assert.deepEqual(csv.parse("One,Two\nThree,Four").rows(), [
        ["One", "Two"], ["Three", "Four"]
    ]);
});

canary.test("Write CSV using convenience global function", async function() {
    assert.equal(csv.write([["One", "Two"], ["Three", "Four"]]),
        "One,Two\r\nThree,Four\r\n"
    );
});

canary.test("Stream CSV using convenience global functions", async function() {
    const original = [["One", "Two"], ["Three", "Four"], ["Five", "Six"]];
    const parsed = csv.parse(csv.stream(original)).rows();
    assert.deepEqual(original, parsed);
});
