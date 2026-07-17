import { RuleTester } from "eslint";
import * as parser from "@typescript-eslint/parser";
import rule from "../src/rules/no-failed-compilation";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

tester.run("no-failed-compilation", rule, {
  valid: [
    `function Simple() { return <div>hello</div>; }`,
    `function WithHook() { const [x] = useState(0); return <div>{x}</div>; }`,
    `function WithEffect() { useEffect(() => {}, []); return <div/>; }`,
    `const Arrow = () => <div>ok</div>;`,
  ].map((code) => ({
    code,
    filename: "test.jsx",
  })),

  invalid: [
    {
      code: `function Bad() { if (x) { useState(0); } return <div/>; }`,
      filename: "test.jsx",
      errors: [{ messageId: "compilationFailed" }],
    },
  ],
});

console.log("✅ All tests passed!");
