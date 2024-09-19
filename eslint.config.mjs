import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        "files": ["**/*.ts"],
        "languageOptions": {
            "parser": parser,
            "ecmaVersion": "latest",
            "sourceType": "module",
            "parserOptions": {
                "project": "./tsconfig.json"
            },
            "globals": {
                ...globals.node,
                ...globals.es2021,
            }
        },
        "plugins": {
            "@typescript-eslint": plugin
        },
        "rules": {
            "no-undef": "off",
            "no-explicit-any": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "no-unused-vars": "off",
            "no-useless-return": "error",
            "no-unneeded-ternary": "error",
            "no-param-reassign": "error",
            "yoda": "error",
            "no-return-assign": "error",
            "no-multi-assign": "error",
            "no-empty-function": [
                "error",
                { "allow": ["constructors"] }
            ],
            "no-implicit-coercion": "error",
            "no-lonely-if": "error",
            "no-self-compare": "error",
            "no-shadow": "error",
            "no-template-curly-in-string": "error",
            "no-unused-expressions": "error",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-deprecated": "error",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    "format": [
                        "camelCase",
                        "UPPER_CASE"
                    ],
                    "selector": [
                        "function",
                        "variable",
                        "parameter",
                        "classProperty",
                        "classMethod"
                    ],
                    "leadingUnderscore": "allow"
                }
            ],
            "max-nested-callbacks": [
                "error",
                { "max": 4 }
            ],
            "no-multiple-empty-lines": [
                "error",
                { "max": 1 }
            ],
            "indent": [
                "error",
                4,
                { "SwitchCase": 1 }
            ],
            "quotes": [
                "error",
                "double"
            ],
            "semi": [
                "error",
                "always"
            ]
        }
    }
]