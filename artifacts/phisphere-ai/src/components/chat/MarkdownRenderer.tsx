import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="mt-6 mb-4 text-2xl font-display font-bold text-foreground border-b border-border pb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="mt-5 mb-3 text-xl font-display font-bold text-teal-300" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="mt-4 mb-2 text-lg font-display font-semibold text-teal-100/90 tracking-wide uppercase text-sm" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="mb-4 leading-relaxed text-slate-300 last:mb-0" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-300" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-slate-300" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="marker:text-teal-500/70 pl-1" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-semibold text-teal-50" {...props} />
        ),
        code: ({ node, inline, ...props }: any) => 
          inline ? (
            <code className="rounded-md bg-black/40 px-1.5 py-0.5 text-sm text-teal-200 border border-teal-500/20" style={{ fontFamily: 'var(--font-mono)' }} {...props} />
          ) : (
            <div className="my-4 overflow-hidden rounded-xl border border-border bg-[#050A15] shadow-inner">
              <div className="flex h-8 items-center border-b border-white/5 bg-white/5 px-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <pre className="overflow-x-auto p-4 text-sm text-teal-100" style={{ fontFamily: 'var(--font-mono)' }}>
                <code {...props} />
              </pre>
            </div>
          ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="my-4 border-l-4 border-teal-500 bg-teal-500/5 px-4 py-3 italic text-slate-300 rounded-r-lg" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
