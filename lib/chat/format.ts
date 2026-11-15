// Tiny, safe formatter for chatbot replies. Produces a plain data tree that the UI renders with React
// elements — never HTML strings — so any markup in a reply stays literal text.
// Supported: paragraphs, line breaks, **bold**, `code`, "-"/"*"/"•" bullets, "1." / "1)" numbered lists
// (nested by indentation).

export type Inline =
  | { type: "text"; value: string }
  | { type: "bold"; children: Inline[] }
  | { type: "code"; value: string };

export interface ListItem {
  content: Inline[];
  children: Block[];
}

export type Block =
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "list"; ordered: boolean; start: number; items: ListItem[] };

const LIST_LINE = /^(\s*)([-*•]|\d{1,3}[.)])\s+(.*)$/;

export function parseInline(input: string): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ type: "text", value: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < input.length) {
    if (input[i] === "`") {
      const end = input.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "code", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (input.startsWith("**", i)) {
      const end = input.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ type: "bold", children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    buffer += input[i];
    i++;
  }
  flush();
  return out;
}

export function parseMessage(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: Inline[][] = [];
  // Stack of open lists by indentation depth
  let stack: Array<{ indent: number; list: Extract<Block, { type: "list" }> }> = [];

  const closeParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const closeLists = () => {
    stack = [];
  };

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.replace(/\s+$/, "");

    if (!line.trim()) {
      closeParagraph();
      closeLists();
      continue;
    }

    const m = LIST_LINE.exec(line);
    if (m) {
      closeParagraph();
      const indent = m[1]!.replace(/\t/g, "  ").length;
      const marker = m[2]!;
      const ordered = /\d/.test(marker);
      const item: ListItem = { content: parseInline(m[3]!), children: [] };

      // Pop lists that are deeper than this line
      while (stack.length && indent < stack[stack.length - 1]!.indent) stack.pop();
      const top = stack[stack.length - 1];

      if (top && indent > top.indent) {
        // Nested list under the previous item
        const parentItem = top.list.items[top.list.items.length - 1]!;
        const list: Extract<Block, { type: "list" }> = { type: "list", ordered, start: ordered ? parseInt(marker, 10) : 1, items: [item] };
        parentItem.children.push(list);
        stack.push({ indent, list });
      } else if (top && indent === top.indent && top.list.ordered === ordered) {
        top.list.items.push(item);
      } else {
        // New top-level (or sibling-type-changed) list
        if (top && indent === top.indent) stack.pop();
        const list: Extract<Block, { type: "list" }> = { type: "list", ordered, start: ordered ? parseInt(marker, 10) : 1, items: [item] };
        const parent = stack[stack.length - 1];
        if (parent) parent.list.items[parent.list.items.length - 1]!.children.push(list);
        else blocks.push(list);
        stack.push({ indent, list });
      }
      continue;
    }

    // Indented continuation of a list item
    const top = stack[stack.length - 1];
    if (top && /^\s+/.test(line)) {
      const lastItem = top.list.items[top.list.items.length - 1]!;
      lastItem.content.push({ type: "text", value: " " }, ...parseInline(line.trim()));
      continue;
    }

    closeLists();
    paragraph.push(parseInline(line.trim()));
  }

  closeParagraph();
  return blocks;
}

/** Plain-text version (used for copy, previews and tests). */
export function inlineToText(nodes: Inline[]): string {
  return nodes.map((n) => (n.type === "bold" ? inlineToText(n.children) : n.value)).join("");
}
