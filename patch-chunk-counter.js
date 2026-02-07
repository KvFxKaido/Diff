const fs = require('fs');
const path = '/workspace/app/src/lib/orchestrator.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add ChunkMetadata interface after StreamUsage
content = content.replace(
  /interface StreamUsage \{\s*inputTokens: number;\s*outputTokens: number;\s*totalTokens: number;\s*\}/,
  `interface StreamUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Chunk metadata for tracking streaming progress
export interface ChunkMetadata {
  chunkIndex: number;
}`
);

// 2. Update createChunkedEmitter signature
content = content.replace(
  /function createChunkedEmitter\(\s*emit: \(chunk: string\) => void,/,
  'function createChunkedEmitter(\n  emit: (chunk: string, meta?: ChunkMetadata) => void,'
);

// 3. Update createChunkedEmitter implementation - add chunkIndex counter and update emit call
content = content.replace(
  /(let buffer = '';\s*let flushTimer: ReturnType<typeof setTimeout> \| undefined;)/,
  `$1\n  let chunkIndex = 0;`
);

content = content.replace(
  /const doEmit = \(\) => \{\s*if \(buffer\) \{\s*emit\(buffer\);/,
  `const doEmit = () => {\n    if (buffer) {\n      chunkIndex++;\n      emit(buffer, { chunkIndex });`
);

// 4. Update all onToken function signatures to include metadata
content = content.replace(
  /onToken: \(token: string\) => void(?!, meta)/g,
  'onToken: (token: string, meta?: ChunkMetadata) => void'
);

// 5. Update demo mode in streamChat to use chunk counter
content = content.replace(
  /(const words = DEMO_WELCOME\.split\(' '\);\s*)for \(let i = 0; i < words\.length; i\+\+\) \{/,
  `$1let chunkIndex = 0;\n    for (let i = 0; i < words.length; i++) {\n      chunkIndex++;`
);

content = content.replace(
  /(await new Promise\(\(r\) => setTimeout\(r, 12\)\);\s*)onToken\(words\[i\] \+ \(i < words\.length - 1 \? ' ' : ''\)\);/,
  `$1onToken(words[i] + (i < words.length - 1 ? ' ' : ''), { chunkIndex });`
);

fs.writeFileSync(path, content);
console.log('Patch applied successfully!');
