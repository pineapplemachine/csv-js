const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "src/index.ts"),
    mode: "development",
    module: {
        rules: [{
            test: /\.ts?$/,
            use: "ts-loader",
            exclude: /node_modules/,
        }],
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "webpack-bundle.js",
        library: "csv"
    },
    resolve: {
        extensions: [".js", ".ts"],
        fallback: {
            "buffer": false,
            "stream": require.resolve("stream-browserify"),
        }
    },
};
