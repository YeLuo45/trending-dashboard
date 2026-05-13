import type { TrendingData, TrendingProject } from '../types';

export function parseMarkdownTable(markdown: string): TrendingProject[] {
  const projects: TrendingProject[] = [];
  
  // Match markdown table rows (lines starting with |)
  const rows = markdown.split('\n').filter(line => line.startsWith('|') && !line.startsWith('|--'));
  
  for (const row of rows) {
    // Skip header separator and empty rows
    if (row.includes('---') || row.trim() === '|') continue;
    
    // Split by | and clean up
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    if (cells.length >= 7) {
      const rank = parseInt(cells[0]) || 0;
      
      // Extract name from format: `owner/repo`
      const nameMatch = cells[1].match(/`([^`]+)`/);
      const name = nameMatch ? nameMatch[1] : cells[1];
      
      // Extract link from [链接](url)
      const linkMatch = cells[2].match(/\[链接\]\(([^)]+)\)/);
      const link = linkMatch ? linkMatch[1] : '';
      
      // Description (may contain special chars)
      const description = cells[3];
      
      // Keywords (split by /)
      const keywords = cells[4].split('/').map(k => k.trim()).filter(k => k);
      
      // Total stars (remove commas)
      const totalStars = cells[5].replace(/,/g, '');
      
      // Growth (extract number)
      const growthMatch = cells[6].match(/([\d,]+)\s*⬆/);
      const growth = growthMatch ? growthMatch[1] : cells[6];
      const growthValue = parseInt(growth.replace(/,/g, '')) || 0;
      
      if (name && link) {
        projects.push({
          rank,
          name,
          link,
          description,
          keywords,
          totalStars,
          growth,
          growthValue,
        });
      }
    }
  }
  
  return projects;
}

export function parseWeeklyData(markdown: string): TrendingProject[] {
  // Find the weekly section
  const weeklyMatch = markdown.match(/### 一、本周增长最快 Top 10[\s\S]*?\| 排名 \|/);
  if (!weeklyMatch) return [];
  
  const startIdx = markdown.indexOf('| 排名 |', weeklyMatch.index!);
  const endIdx = markdown.indexOf('\n---\n', startIdx);
  const weeklySection = markdown.substring(startIdx, endIdx > 0 ? endIdx : undefined);
  
  return parseMarkdownTable(weeklySection);
}

export function parseMonthlyData(markdown: string): TrendingProject[] {
  // Find the monthly section
  const monthlyMatch = markdown.match(/### 二、本月最热 Top 10/);
  if (!monthlyMatch) return [];
  
  const startIdx = markdown.indexOf('| 排名 |', monthlyMatch.index!);
  const endIdx = markdown.indexOf('\n---\n', startIdx);
  const monthlySection = startIdx >= 0 ? markdown.substring(startIdx, endIdx > 0 ? endIdx : undefined) : '';
  
  return parseMarkdownTable(monthlySection);
}

export function parseAllTrendingData(markdown: string): TrendingData {
  const weekly = parseWeeklyData(markdown);
  const monthly = parseMonthlyData(markdown);
  
  // Extract last updated time
  const timeMatch = markdown.match(/数据时间：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
  const lastUpdated = timeMatch ? timeMatch[1] : new Date().toISOString().slice(0, 16).replace('T', ' ');
  
  return { weekly, monthly, lastUpdated };
}
