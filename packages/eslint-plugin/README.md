# @react-compiler-marker/eslint-plugin

ESLint plugin that reports React components not optimized by the [React Compiler](https://react.dev/learn/react-compiler). Works with both **ESLint** (v9+) and **Oxlint** (via JS plugins).

## Installation

```bash
npm install --save-dev @react-compiler-marker/eslint-plugin
```

Requires `eslint@^9` or `oxlint` with JS plugins support.

## Usage

### ESLint (flat config)

```js
// eslint.config.mjs
import reactCompilerMarker from "@react-compiler-marker/eslint-plugin";

export default [
  {
    plugins: { "@react-compiler-marker": reactCompilerMarker },
    rules: {
      "@react-compiler-marker/no-failed-compilation": "error",
    },
  },
];
```

### Oxlint

```json
// .oxlintrc.json
{
  "jsPlugins": ["@react-compiler-marker/eslint-plugin"],
  "rules": {
    "@react-compiler-marker/no-failed-compilation": "error"
  }
}
```

## Rules

### `no-failed-compilation`

Reports components that the React Compiler cannot optimize.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `babelPluginPath` | `string` | `"babel-plugin-react-compiler"` | Custom path to `babel-plugin-react-compiler` |
| `reportSuccess` | `boolean` | `false` | Also report successfully compiled components |

**Example:**

```js
"@react-compiler-marker/no-failed-compilation": ["error", {
  "reportSuccess": true
}]
```

## How it works

The plugin parses each file with Babel, runs `babel-plugin-react-compiler` in lint-only mode, and reports every `CompileError`, `CompileDiagnostic`, or `PipelineError` event as a lint violation.

This is the same analysis engine used by the [React Compiler Marker](https://github.com/blazejkustra/react-compiler-marker) IDE extensions.
