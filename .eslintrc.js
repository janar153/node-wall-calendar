module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:socket-io/recommended",
        "prettier"
    ],
    "plugins": [
        "eslint-plugin-jsdoc",
        "eslint-plugin-prefer-arrow",
        "@typescript-eslint",
        "socket-io"
    ],
    "root": true,
    "rules": {
        "no-console": 0
    }
};
