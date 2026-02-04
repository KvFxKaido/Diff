/**
 * Scratchpad tools — allows Kimi to update the shared scratchpad.
 *
 * Tools:
 * - set_scratchpad: Replace entire content
 * - append_scratchpad: Add to existing content
 */

import { extractBareToolJsonObjects } from './tool-dispatch';

export interface ScratchpadToolCall {
  tool: 'set_scratchpad' | 'append_scratchpad';
  content: string;
}

/**
 * Protocol prompt for the orchestrator system prompt.
 */
export const SCRATCHPAD_TOOL_PROTOCOL = `
## Scratchpad Tools

You have access to a shared scratchpad — a persistent notepad that both you and the user can see and edit. Use it to consolidate ideas, requirements, decisions, and notes throughout the conversation.

The user can open the scratchpad anytime via the UI. You can update it with these tools:

### set_scratchpad
Replace the entire scratchpad content:
\`\`\`json
{"tool": "set_scratchpad", "content": "## Requirements\\n- Feature A\\n- Feature B\\n\\n## Decisions\\n- Use approach X"}
\`\`\`

### append_scratchpad
Add to the existing content (good for incremental updates):
\`\`\`json
{"tool": "append_scratchpad", "content": "## New Section\\n- Added item"}
\`\`\`

**When to use:**
- User says "add this to the scratchpad" or "note this down"
- Consolidating decisions from the conversation
- Building up requirements or specs iteratively
- Keeping track of open questions or TODOs

**Format tips:**
- Use markdown headers (##) to organize sections
- Use bullet points for lists
- Keep it scannable — this is a working doc, not prose
`;

/**
 * Detect a scratchpad tool call in text.
 */
export function detectScratchpadToolCall(text: string): ScratchpadToolCall | null {
  // Check fenced code blocks first
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g;
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const parsed = tryParseScratchpadTool(match[1].trim());
    if (parsed) return parsed;
  }

  // Bare JSON fallback
  for (const parsed of extractBareToolJsonObjects(text)) {
    if (isScratchpadTool(parsed)) {
      return {
        tool: parsed.tool,
        content: parsed.content,
      };
    }
  }

  return null;
}

function tryParseScratchpadTool(jsonStr: string): ScratchpadToolCall | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (isScratchpadTool(parsed)) {
      return {
        tool: parsed.tool,
        content: parsed.content,
      };
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

function isScratchpadTool(obj: unknown): obj is { tool: 'set_scratchpad' | 'append_scratchpad'; content: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'tool' in obj &&
    (obj.tool === 'set_scratchpad' || obj.tool === 'append_scratchpad') &&
    'content' in obj &&
    typeof (obj as { content: unknown }).content === 'string'
  );
}

/**
 * Execute a scratchpad tool call.
 * Returns text for the LLM to acknowledge the action.
 */
export function executeScratchpadToolCall(
  call: ScratchpadToolCall,
  currentContent: string,
  onReplace: (content: string) => void,
  onAppend: (content: string) => void,
): string {
  if (call.tool === 'set_scratchpad') {
    onReplace(call.content);
    return `[Scratchpad updated — replaced content (${call.content.length} chars)]`;
  }

  if (call.tool === 'append_scratchpad') {
    onAppend(call.content);
    const newLength = currentContent.trim()
      ? currentContent.length + call.content.length + 2
      : call.content.length;
    return `[Scratchpad updated — appended content (now ${newLength} chars)]`;
  }

  return '[Scratchpad tool error: unknown action]';
}

/**
 * Build the scratchpad context block for the system prompt.
 */
export function buildScratchpadContext(content: string): string {
  if (!content.trim()) {
    return '[SCRATCHPAD]\n(empty — user or assistant can add notes here)\n[/SCRATCHPAD]';
  }

  return `[SCRATCHPAD]
${content.trim()}
[/SCRATCHPAD]`;
}
