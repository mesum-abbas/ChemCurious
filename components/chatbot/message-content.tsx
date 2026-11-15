import { Fragment } from "react"
import { parseMessage, type Block, type Inline } from "@/lib/chat/format"

// Renders bot text as React elements only (no dangerouslySetInnerHTML): HTML in a reply stays literal.

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "bold") {
          return (
            <strong key={i} className="font-semibold">
              <InlineNodes nodes={node.children} />
            </strong>
          )
        }
        if (node.type === "code") {
          return (
            <code key={i} className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]">
              {node.value}
            </code>
          )
        }
        return <Fragment key={i}>{node.value}</Fragment>
      })}
    </>
  )
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <InlineNodes nodes={line} />
                </Fragment>
              ))}
            </p>
          )
        }
        const items = block.items.map((item, j) => (
          <li key={j} className="pl-0.5">
            <InlineNodes nodes={item.content} />
            {item.children.length > 0 && (
              <div className="mt-1 space-y-1">
                <Blocks blocks={item.children} />
              </div>
            )}
          </li>
        ))
        return block.ordered ? (
          <ol key={i} start={block.start} className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-primary">
            {items}
          </ol>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-primary">
            {items}
          </ul>
        )
      })}
    </>
  )
}

export function MessageContent({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words [overflow-wrap:anywhere]">
      <Blocks blocks={parseMessage(text)} />
    </div>
  )
}
