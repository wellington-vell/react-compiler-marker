import type { Rule } from "eslint";
import { checkReactCompiler, type LoggerEvent } from "../compiler";

interface ParsedLog {
  startLine: number;
  endLine: number;
  reason: string;
  description: string;
  fnName: string | undefined;
}

function parseLog(log: LoggerEvent): ParsedLog {
  const getLocValue = (
    property: "start" | "end",
    field: "line" | "column",
    defaultValue: number
  ) => {
    return (
      log.detail?.options?.details?.at(0)?.loc?.[property]?.[field] ??
      log.detail?.options?.loc?.[property]?.[field] ??
      log.detail?.loc?.[property]?.[field] ??
      defaultValue
    );
  };

  const startLine = getLocValue("start", "line", 1);
  const endLine = getLocValue("end", "line", 1);
  const reason = log?.detail?.options?.reason || log?.detail?.reason || "Unknown reason";
  const description = log?.detail?.options?.description || log?.detail?.description || "";

  return {
    startLine: Math.max(0, startLine - 1),
    endLine: Math.max(0, endLine - 1),
    reason,
    description,
    fnName: log.fnName,
  };
}

export type RuleOptions = {
  babelPluginPath?: string;
  reportSuccess?: boolean;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Report components that React Compiler cannot optimize",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          babelPluginPath: {
            type: "string",
            description: "Path to babel-plugin-react-compiler",
          },
          reportSuccess: {
            type: "boolean",
            description:
              "Also report successfully compiled components",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      compilationFailed:
        "React Compiler cannot optimize `{{fnName}}`: {{reason}}{{extra}}",
      compilationSuccess:
        "React Compiler optimized `{{fnName}}` successfully",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode.text;
    const filename = context.filename || context.physicalFilename || "unknown.js";
    const options: RuleOptions = context.options[0] || {};
    if (!/\.(jsx?|tsx?|mjs|cjs)$/.test(filename)) {
      return {};
    }

    return {
      Program() {
        const result = checkReactCompiler(
          sourceCode,
          filename,
          options.babelPluginPath
        );

        for (const fail of result.failedCompilations) {
          const { reason, description, startLine, fnName } = parseLog(fail);
          const extra = description ? ` — ${description}` : "";
          context.report({
            messageId: "compilationFailed",
            data: {
              fnName: fnName || "component",
              reason,
              extra,
            },
            loc: {
              line: startLine + 1,
              column: 0,
            },
          });
        }

        if (options.reportSuccess) {
          for (const success of result.successfulCompilations) {
            const line = (success.fnLoc?.start?.line ?? 1) - 1;
            context.report({
              messageId: "compilationSuccess",
              data: {
                fnName: success.fnName || "component",
              },
              loc: {
                line: line + 1,
                column: 0,
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
