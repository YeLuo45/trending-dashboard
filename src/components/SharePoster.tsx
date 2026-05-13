import { useRef, useCallback } from 'react';
import type { FavoriteItem, TrendingProject } from '../types';

interface SharePosterProps {
  projects: FavoriteItem[] | TrendingProject[];
  title?: string;
  onClose: () => void;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const CARD_HEIGHT = 90;
const PADDING = 40;
const HEADER_HEIGHT = 80;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function SharePoster({ projects, title, onClose }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `trending-share-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          alert('海报已复制到剪贴板！');
        }).catch(() => {
          alert('复制失败，请手动下载图片');
        });
      }
    });
  }, []);

  // Draw the poster
  const drawPoster = useCallback((ctx: CanvasRenderingContext2D) => {
    const items = projects.slice(0, 5); // Max 5 projects on poster

    // Background - dark gradient simulation
    const bgGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0d1117');
    bgGradient.addColorStop(1, '#161b22');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Accent line at top
    const purple = '#a371f7';
    const rgb = hexToRgb(purple);
    if (rgb) {
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 4);
    }

    // Header section
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('📈 GitHub Trending', PADDING, 60);

    if (title) {
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#8b949e';
      ctx.fillText(title, PADDING, 90);
    }

    // Date
    const now = new Date();
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.textAlign = 'right';
    ctx.fillText(now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }), CANVAS_WIDTH - PADDING, 60);
    ctx.textAlign = 'left';

    // Projects section
    const startY = HEADER_HEIGHT + 20;
    const cardGap = 12;

    // Card background color
    const cardBg = '#1c2128';

    items.forEach((project, i) => {
      const cardY = startY + i * (CARD_HEIGHT + cardGap);

      // Card background
      ctx.fillStyle = cardBg;
      drawRoundedRect(ctx, PADDING, cardY, CANVAS_WIDTH - PADDING * 2, CARD_HEIGHT, 8);
      ctx.fill();

      // Rank circle
      const rankColors = ['#f59e0b', '#9ca3af', '#f97316', '#6b7280', '#6b7280'];
      const rankColor = rankColors[i] || '#6b7280';
      ctx.fillStyle = rankColor;
      ctx.beginPath();
      ctx.arc(PADDING + 24, cardY + CARD_HEIGHT / 2, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), PADDING + 24, cardY + CARD_HEIGHT / 2 + 6);
      ctx.textAlign = 'left';

      // Project name
      const name = 'name' in project ? (project as { name: string }).name : (project as { projectName: string }).projectName;
      ctx.fillStyle = purple;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const displayName = name.length > 35 ? name.slice(0, 32) + '...' : name;
      ctx.fillText(displayName, PADDING + 60, cardY + 32);

      // Description
      const desc = 'description' in project ? (project as { description: string }).description : '';
      ctx.fillStyle = '#8b949e';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const displayDesc = desc.length > 70 ? desc.slice(0, 67) + '...' : desc;
      ctx.fillText(displayDesc, PADDING + 60, cardY + 58);

      // Stars/growth badge
      const stars = 'totalStars' in project ? (project as { totalStars: string }).totalStars : '';
      if (stars) {
        const badgeText = `★ ${stars}`;
        const badgeWidth = ctx.measureText(badgeText).width + 16;
        const badgeX = CANVAS_WIDTH - PADDING - badgeWidth;
        const badgeY = cardY + CARD_HEIGHT / 2 - 12;

        ctx.fillStyle = 'rgba(163, 113, 247, 0.2)';
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 24, 6);
        ctx.fill();

        ctx.fillStyle = purple;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(badgeText, CANVAS_WIDTH - PADDING - 8, cardY + CARD_HEIGHT / 2 + 5);
        ctx.textAlign = 'left';
      }
    });

    // Footer watermark
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by Trending Dashboard', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    ctx.textAlign = 'left';

  }, [projects, title]);

  // Draw when canvas is ready
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawPoster(ctx);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[700px] max-w-[90vw] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-lg font-semibold text-github-text">🖼️ 分享海报</h2>
          <button onClick={onClose} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
        </div>

        {/* Canvas Preview */}
        <div className="p-4 flex justify-center bg-github-dark/50">
          <div className="relative shadow-2xl shadow-github-purple/20 rounded overflow-hidden">
            {/* eslint-disable-next-line react/forbid-component-props */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full h-auto"
              style={{ maxHeight: '400px', width: 'auto' }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pb-2">
          <p className="text-github-muted text-xs mb-3 text-center">
            海报包含排名前 {Math.min(projects.length, 5)} 的项目，可用于分享到社交平台
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-github-border flex gap-3 justify-center">
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-github-purple text-white rounded hover:bg-github-purple/80 transition-colors text-sm flex items-center gap-2"
          >
            📥 下载图片
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="px-6 py-2 bg-github-card border border-github-border text-github-text rounded hover:border-github-purple/50 transition-colors text-sm flex items-center gap-2"
          >
            📋 复制到剪贴板
          </button>
        </div>
      </div>
    </div>
  );
}
