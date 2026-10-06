// Tiny Markdown renderer (headings, paragraphs, lists, blockquotes, fenced code,
// bold, italic, inline code, links). Enough for blog posts — no dependencies.
(function () {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => {
      codes.push(c);
      return `\u0000${codes.length - 1}\u0000`;
    });
    s = esc(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]*|\/[^\s)]*)\)/g, (_, t, u) => {
        const ext = /^https?:/.test(u);
        return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
  }

  window.renderMarkdown = function (md) {
    const lines = md.replace(/\r/g, "").split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        html += `<pre${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(buf.join("\n"))}</code></pre>`;
        continue;
      }
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        const lvl = Math.min(h[1].length + 1, 4); // page title is h1
        html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
        i++;
        continue;
      }
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
        html += `<blockquote>${inline(buf.join(" "))}</blockquote>`;
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        html += "<ul>";
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ""))}</li>`;
        html += "</ul>";
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        html += "<ol>";
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*\d+\.\s+/, ""))}</li>`;
        html += "</ol>";
        continue;
      }
      if (!line.trim()) {
        i++;
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) buf.push(lines[i++]);
      html += `<p>${inline(buf.join(" "))}</p>`;
    }
    return html;
  };
})();
