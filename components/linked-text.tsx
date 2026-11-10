import type { ReactNode } from "react";

const EXTERNAL_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function LinkedText({ text, className }: { text: string; className?: string }) {
  return <p className={className}>{linkNodes(text)}</p>;
}

function linkNodes(paragraph: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of paragraph.matchAll(EXTERNAL_LINK)) {
    const index = match.index ?? 0;
    if (index > last) {
      nodes.push(paragraph.slice(last, index));
    }
    const href = match[2] ?? "";
    nodes.push(
      <a
        key={href + index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-moss underline decoration-moss/40 underline-offset-2 hover:text-blaze"
      >
        {match[1]}
      </a>,
    );
    last = index + match[0].length;
  }
  if (last < paragraph.length) {
    nodes.push(paragraph.slice(last));
  }
  return nodes;
}
