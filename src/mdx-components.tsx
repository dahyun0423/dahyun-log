import type { MDXComponents } from "mdx/types";

// MDX 본문 요소에 디자인 토큰 스타일 입히기 (h1 = 글 제목은 페이지에서 따로 그림)
const components: MDXComponents = {
  h2: (props) => <h2 className="mt-12 mb-3 text-t3 font-bold" {...props} />,
  h3: (props) => <h3 className="mt-8 mb-2 text-t4 font-bold" {...props} />,
  p: (props) => <p className="my-4 text-t5 text-fg-secondary" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-1.5 pl-5 text-t5 text-fg-secondary" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1.5 pl-5 text-t5 text-fg-secondary" {...props} />,
  strong: (props) => <strong className="font-bold text-fg" {...props} />,
  a: (props) => <a className="font-semibold text-primary underline-offset-4 hover:underline" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-6 rounded-lg bg-surface-subtle px-5 py-1 [&_p]:text-fg" {...props} />
  ),
  code: (props) => (
    <code className="rounded-sm bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.9em] text-fg" {...props} />
  ),
  pre: (props) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg bg-[var(--grey-900)] p-4 text-t7 text-[var(--grey-100)] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-line-subtle" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
