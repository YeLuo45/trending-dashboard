import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

interface ReadmePreviewProps {
  /** Raw markdown source (already decoded from base64) */
  markdown: string;
  /** Repo owner (used to rewrite relative image / link URLs) */
  owner: string;
  /** Repo name (used to rewrite relative image / link URLs) */
  repo: string;
  /** Default branch on GitHub (used to rewrite relative image / link URLs) */
  defaultBranch?: string;
}

const RAW_BASE = 'https://raw.githubusercontent.com';
const BLOB_BASE = 'https://github.com';

/**
 * Build a sanitizer schema that allows image rendering,
 * relative images, and other common GitHub README features
 * but still blocks dangerous content (script, on*, etc.).
 */
const SAFE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    pre: [...(defaultSchema.attributes?.pre || []), ['className']],
    span: [...(defaultSchema.attributes?.span || []), ['className']],
    img: [
      ['src'],
      ['alt'],
      ['title'],
      ['width'],
      ['height'],
      ['loading'],
    ],
    a: [
      ['href'],
      ['title'],
      ['target'],
      ['rel'],
    ],
    th: [
      ['align'],
      ['style'],
    ],
    td: [
      ['align'],
      ['style'],
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'img',
    'details',
    'summary',
    'kbd',
    'mark',
    'sub',
    'sup',
    'del',
  ],
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https', 'data'],
    href: ['http', 'https', 'mailto', '#'],
  },
};

/**
 * Rewrite relative URLs (images and links) in markdown source to absolute GitHub URLs.
 * GitHub README conventions:
 *   - `./path` or `path` (relative) -> blob/{branch}/path on github.com
 *   - `./path/img.png` -> raw.githubusercontent.com/.../{branch}/path/img.png for images
 *   - `/owner/repo/...` -> use repo context
 */
function rewriteRelativeUrls(markdown: string, owner: string, repo: string, branch: string): string {
  // Image: ![alt](path)
  return markdown.replace(
    /(!\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g,
    (_m, prefix, url, suffix) => {
      const newUrl = resolveImageUrl(url, owner, repo, branch);
      return prefix + newUrl + suffix;
    }
  );
}

function resolveImageUrl(url: string, owner: string, repo: string, branch: string): string {
  // Already absolute
  if (/^(https?:|data:)/i.test(url)) return url;
  // Bare fragment
  if (url.startsWith('#')) return url;

  // Strip leading ./ and /
  let path = url.replace(/^\.?\//, '');

  // If it starts with the repo name (like "repo-name/path"), keep as-is
  // Otherwise, treat as relative to the repo root
  if (path === '' || path.startsWith('?')) return url;

  return `${RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Rewrite relative link hrefs in markdown source.
 * Done at markdown-source level (not after rendering) so we don't have to
 * walk the React tree and rewrite every <a href>.
 */
function rewriteRelativeLinks(markdown: string, owner: string, repo: string, branch: string): string {
  // Link: [text](path) but NOT preceded by ! (image) and NOT inside code fences
  return markdown.replace(
    /(?<!\!)\[([^\]]+)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g,
    (_m, text, url, title) => {
      // Skip absolute, mailto, anchors
      if (/^(https?:|mailto:|#)/i.test(url)) {
        return `[${text}](${url}${title})`;
      }
      // Relative link -> GitHub blob URL
      let path = url.replace(/^\.?\//, '');
      if (path === '') {
        return `[${text}](${url}${title})`;
      }
      // If path starts with the owner/repo prefix already, leave as-is
      if (path.startsWith(`${owner}/${repo}/`)) {
        return `[${text}](${BLOB_BASE}/${path}${title})`;
      }
      // If path starts with "wiki/" or "issues/" or "blob/" etc, route to github.com
      if (/^(blob|tree|wiki|issues|pulls|discussions|actions|releases|commits|blame|raw)\//.test(path)) {
        return `[${text}](${BLOB_BASE}/${owner}/${repo}/${path}${title})`;
      }
      // Default: treat as file in repo
      return `[${text}](${BLOB_BASE}/${owner}/${repo}/${branch}/${path}${title})`;
    }
  );
}

export function ReadmePreview({ markdown, owner, repo, defaultBranch = 'main' }: ReadmePreviewProps) {
  const cleaned = useMemo(() => {
    if (!markdown) return '';
    // 1. Strip HTML comments
    let m = markdown.replace(/<!--[\s\S]*?-->/g, '');
    // 2. Rewrite relative image / link URLs
    m = rewriteRelativeUrls(m, owner, repo, defaultBranch);
    m = rewriteRelativeLinks(m, owner, repo, defaultBranch);
    return m;
  }, [markdown, owner, repo, defaultBranch]);

  if (!cleaned.trim()) {
    return <div className="text-github-muted text-sm">暂无 README 内容</div>;
  }

  return (
    <div className="readme-body text-github-text text-[13.5px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, SAFE_SCHEMA],
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node, ...props }) => (
            <img
              {...props}
              loading="lazy"
              className="max-w-full h-auto rounded-md border border-github-border/30 my-2"
            />
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
