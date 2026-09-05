"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
}

/** 通用 Markdown 渲染组件（用于健康管理师人工解读） */
export function Markdown({ content, className = "" }: Props) {
  return (
    <div className={`prose prose-sm prose-brand max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: (props) => (
            <h1 {...props} className="mt-4 mb-2 text-xl font-bold text-ink-900" />
          ),
          h2: (props) => (
            <h2 {...props} className="mt-4 mb-2 text-lg font-bold text-ink-900" />
          ),
          h3: (props) => (
            <h3 {...props} className="mt-3 mb-2 text-base font-bold text-ink-900" />
          ),
          p: (props) => (
            <p {...props} className="mb-2 leading-relaxed text-ink-700" />
          ),
          strong: (props) => (
            <strong {...props} className="font-semibold text-ink-900" />
          ),
          ul: (props) => (
            <ul {...props} className="mb-2 list-disc space-y-1 pl-5 text-ink-700" />
          ),
          ol: (props) => (
            <ol {...props} className="mb-2 list-decimal space-y-1 pl-5 text-ink-700" />
          ),
          li: (props) => <li {...props} className="leading-relaxed" />,
          blockquote: (props) => (
            <blockquote
              {...props}
              className="my-2 rounded-r-lg border-l-4 border-brand-300 bg-brand-50 px-4 py-2 text-ink-600"
            />
          ),
          code: (props) => (
            <code
              {...props}
              className="rounded bg-brand-50 px-1.5 py-0.5 text-sm text-brand-700"
            />
          ),
          hr: () => <hr className="my-4 border-brand-100" />,
          a: (props) => (
            <a {...props} className="text-brand-600 underline" target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
