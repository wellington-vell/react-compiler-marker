import noFailedCompilation from "./rules/no-failed-compilation";

const plugin = {
  meta: {
    name: "@react-compiler-marker/eslint-plugin",
    version: "0.1.0",
  },
  rules: {
    "no-failed-compilation": noFailedCompilation,
  },
};

export = plugin;
