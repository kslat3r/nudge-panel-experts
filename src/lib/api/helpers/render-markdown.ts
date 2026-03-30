import { marked } from "marked";

function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export default renderMarkdown;
