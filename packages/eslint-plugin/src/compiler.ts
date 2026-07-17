import { PluginObj, transformFromAstSync } from "@babel/core";
import * as BabelParser from "@babel/parser";
import * as path from "path";

export type EventLocation = {
  start?: { line?: number; column?: number; index?: number };
  end?: { line?: number; column?: number; index?: number };
};

export type Detail = {
  kind?: string;
  loc?: EventLocation;
  message?: string;
};

export type Details = {
  reason?: string;
  description?: string;
  suggestions?: string[];
  loc?: EventLocation;
  details?: Array<Detail>;
};

export type LoggerEvent = {
  filename: string | null;
  kind?: string;
  fnLoc: EventLocation;
  fnName?: string;
  detail?: Details & {
    options: Details;
  };
};

const DEFAULT_COMPILER_OPTIONS = {
  noEmit: false,
  compilationMode: "infer",
  panicThreshold: "none",
  environment: {
    enableTreatRefLikeIdentifiersAsRefs: true,
  },
};

export interface CompilationResult {
  successfulCompilations: Array<LoggerEvent>;
  failedCompilations: Array<LoggerEvent>;
}

function runReactCompiler(
  text: string,
  file: string,
  language: "flow" | "typescript"
): CompilationResult {
  const successfulCompilations: Array<LoggerEvent> = [];
  const failedCompilations: Array<LoggerEvent> = [];

  const logger = {
    logEvent(filename: string | null, rawEvent: LoggerEvent) {
      const event = { ...rawEvent, filename };
      switch (event.kind) {
        case "CompileSuccess": {
          successfulCompilations.push(event);
          return;
        }
        case "CompileError":
        case "CompileDiagnostic":
        case "PipelineError":
          failedCompilations.push(event);
          return;
      }
    },
  };

  const BabelPluginReactCompiler: PluginObj | undefined =
    require("babel-plugin-react-compiler");

  const COMPILER_OPTIONS = {
    ...DEFAULT_COMPILER_OPTIONS,
    logger,
    noEmit: true,
  };

  const ast = BabelParser.parse(text, {
    sourceFilename: file,
    plugins: [language, "jsx"],
    sourceType: "module",
  });
  const result = transformFromAstSync(ast, text, {
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [[BabelPluginReactCompiler, COMPILER_OPTIONS]],
    sourceType: "module",
    configFile: false,
    babelrc: false,
  });

  if (result?.code == null) {
    throw new Error(`Expected babel-plugin-react-compiler to codegen successfully, got: ${result}`);
  }

  return {
    successfulCompilations,
    failedCompilations,
  };
}

function getLanguageFromFilename(filename: string): "flow" | "typescript" {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["js", "jsx", "mjs"].includes(ext ?? "") ? "flow" : "typescript";
}

export function checkReactCompiler(
  sourceCode: string,
  filename: string,
  babelPluginPath?: string
): CompilationResult {
  try {
    const language = getLanguageFromFilename(filename);
    return runReactCompiler(sourceCode, filename, language);
  } catch (error: any) {
    return { successfulCompilations: [], failedCompilations: [] };
  }
}
