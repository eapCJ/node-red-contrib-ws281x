// eslint.config.js
const globals = require('globals');
const js = require('@eslint/js');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
    js.configs.recommended,
    {
        plugins: {
            prettier: prettierPlugin,
        },
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },
    prettierConfig,
];
