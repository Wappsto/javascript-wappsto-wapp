module.exports = {
plugins: [
["@babel/plugin-proposal-decorators", { "legacy": true }],
['@babel/plugin-proposal-class-properties', { 'loose': false }],
],
    presets: [
	['@babel/preset-env', {targets: {node: 'current'}}],
	'@babel/preset-typescript',

    ],
};
