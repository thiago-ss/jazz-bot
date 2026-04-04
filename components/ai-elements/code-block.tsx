"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { memo, useEffect, useMemo, useState } from "react";
import type { BundledLanguage } from "shiki";
import {
  createRawTokens,
  highlightCode,
  type TokenizedCode,
} from "./code-block-highlighter";
import { addKeysToTokens, LineSpan } from "./code-block-tokens";
import { CodeBlockContainer } from "./code-block-layout";
import { CodeBlockContext } from "./code-block-copy-button";

interface AsyncTokenState {
  code: string;
  language: BundledLanguage;
  result: TokenizedCode;
}

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

const CodeBlockBody = memo(
  ({
    tokenized,
    showLineNumbers,
    className,
  }: {
    tokenized: TokenizedCode;
    showLineNumbers: boolean;
    className?: string;
  }) => {
    const preStyle = useMemo(
      () => ({ backgroundColor: tokenized.bg, color: tokenized.fg }),
      [tokenized.bg, tokenized.fg],
    );

    const keyedLines = useMemo(
      () => addKeysToTokens(tokenized.tokens),
      [tokenized.tokens],
    );

    return (
      <pre
        className={cn(
          "dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)! m-0 p-4 text-sm",
          className,
        )}
        style={preStyle}
      >
        <code
          className={cn(
            "font-mono text-sm",
            showLineNumbers &&
              "[counter-increment:line_0] [counter-reset:line]",
          )}
        >
          {keyedLines.map((keyedLine) => (
            <LineSpan
              key={keyedLine.key}
              keyedLine={keyedLine}
              showLineNumbers={showLineNumbers}
            />
          ))}
        </code>
      </pre>
    );
  },
  (prevProps, nextProps) =>
    prevProps.tokenized === nextProps.tokenized &&
    prevProps.showLineNumbers === nextProps.showLineNumbers &&
    prevProps.className === nextProps.className,
);

CodeBlockBody.displayName = "CodeBlockBody";

export const CodeBlockContent = ({
  code,
  language,
  showLineNumbers = false,
}: {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
}) => {
  const safeCode = typeof code === "string" ? code : String(code ?? "");
  const rawTokens = useMemo(() => createRawTokens(safeCode), [safeCode]);
  const syncTokens = useMemo(
    () => highlightCode(safeCode, language) ?? rawTokens,
    [language, rawTokens, safeCode],
  );

  const [asyncTokens, setAsyncTokens] = useState<AsyncTokenState | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlightCode(safeCode, language, (result) => {
      if (!cancelled) setAsyncTokens({ code: safeCode, language, result });
    });
    return () => {
      cancelled = true;
    };
  }, [language, safeCode]);

  const tokenized =
    asyncTokens?.code === safeCode && asyncTokens.language === language
      ? asyncTokens.result
      : syncTokens;

  return (
    <div className="relative overflow-auto">
      <CodeBlockBody showLineNumbers={showLineNumbers} tokenized={tokenized} />
    </div>
  );
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const safeCode = typeof code === "string" ? code : String(code ?? "");
  const contextValue = useMemo(() => ({ code: safeCode }), [safeCode]);

  return (
    <CodeBlockContext.Provider value={contextValue}>
      <CodeBlockContainer className={className} language={language} {...props}>
        {children}
        <CodeBlockContent
          code={safeCode}
          language={language}
          showLineNumbers={showLineNumbers}
        />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};

// Re-exports for external consumers
export { highlightCode } from "./code-block-highlighter";
export * from "./code-block-layout";
export * from "./code-block-copy-button";
export * from "./code-block-language-selector";
