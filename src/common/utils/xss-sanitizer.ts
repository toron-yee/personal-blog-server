/**
 * XSS 防护工具
 * 用于清理富文本内容中的恶意脚本
 */

export class XssSanitizer {
  /**
   * 清理 HTML 内容，移除危险的脚本和事件处理器
   */
  static sanitizeHtml(html: string): string {
    if (!html) return '';

    // 移除 script 标签及其内容
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 移除事件处理器属性
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // 移除 iframe 标签
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 移除 style 标签中的危险内容（但保留 style 标签）
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 移除 javascript: 协议
    cleaned = cleaned.replace(/javascript:/gi, '');

    // 移除 data: 协议中的脚本
    cleaned = cleaned.replace(/data:text\/html/gi, '');

    return cleaned;
  }

  /**
   * 清理 Markdown 内容
   * Markdown 本身相对安全，但仍需防护
   */
  static sanitizeMarkdown(markdown: string): string {
    if (!markdown) return '';

    // 移除 HTML 标签
    let cleaned = markdown.replace(/<[^>]*>/g, '');

    // 移除 javascript: 链接
    cleaned = cleaned.replace(/\[([^\]]*)\]\(javascript:[^)]*\)/gi, '[$1]()');

    return cleaned;
  }

  /**
   * 根据内容类型清理内容
   */
  static sanitize(content: string, contentType: 'html' | 'markdown' | 'plain' = 'plain'): string {
    switch (contentType) {
      case 'html':
        return this.sanitizeHtml(content);
      case 'markdown':
        return this.sanitizeMarkdown(content);
      case 'plain':
      default:
        return content;
    }
  }
}
