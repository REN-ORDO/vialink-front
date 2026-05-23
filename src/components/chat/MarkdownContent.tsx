import { Fragment, type ReactNode } from 'react';

type Props = { text: string };

function renderInline(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\*(?!\s)([^*\n]+?)\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > cursor) {
      out.push(line.slice(cursor, match.index));
    }
    if (match[1] !== undefined) {
      out.push(
        <strong key={`b-${match.index}`} className="font-bold text-text-primary">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      out.push(
        <code
          key={`c-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-black/[0.06] text-[13.5px] font-semibold tabular"
        >
          {match[2]}
        </code>,
      );
    } else if (match[3] !== undefined) {
      out.push(
        <em key={`i-${match.index}`} className="italic">
          {match[3]}
        </em>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) out.push(line.slice(cursor));
  return out;
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i += 1;
      continue;
    }

    if (/^[-•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[-•]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'p', lines: paragraphLines });
  }

  return blocks;
}

export default function MarkdownContent({ text }: Props) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2.5">
      {blocks.map((b, idx) => {
        if (b.kind === 'p') {
          return (
            <p key={idx} className="leading-snug">
              {b.lines.map((l, i) => (
                <Fragment key={i}>
                  {renderInline(l)}
                  {i < b.lines.length - 1 && <br />}
                </Fragment>
              ))}
            </p>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul key={idx} className="space-y-1 pl-1">
              {b.items.map((item, i) => (
                <li key={i} className="flex gap-2 leading-snug">
                  <span className="text-text-secondary mt-1 shrink-0">·</span>
                  <span className="flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={idx} className="space-y-1 pl-1">
            {b.items.map((item, i) => (
              <li key={i} className="flex gap-2 leading-snug">
                <span className="text-brand font-bold tabular shrink-0 min-w-[14px]">
                  {i + 1}.
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
