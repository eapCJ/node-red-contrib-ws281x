module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true,
        "mocha": true
    },
    "extends": [
        "eslint:recommended",
        "prettier"
    ],
    "plugins": [
        "prettier"
    ],
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "prettier/prettier": "error"
    }
}; 