import { Injectable } from '@nestjs/common';
import { ViolationType } from '@/common/enums/comment.enum';

interface ContentCheckResult {
  isViolation: boolean;
  violationType?: ViolationType;
  reason?: string;
  confidence?: number;  // 0-1 的置信度
}

/**
 * 内容审核服务
 * 分层实现：实时过滤 → 异步审核 → 人工审核
 */
@Injectable()
export class ContentModerationService {
  /**
   * 敏感词库（示例）
   * 实际应用中应该从数据库或配置中心加载
   */
  private readonly sensitiveWords = [
    '违法',
    '诈骗',
    '赌博',
    '色情',
    '暴力',
    '恐怖',
  ];

  /**
   * 广告关键词库（示例）
   */
  private readonly adKeywords = [
    '微信',
    '支付宝',
    '联系我',
    '加我',
    '私聊',
    '点击链接',
  ];

  /**
   * 第一层：实时过滤
   * 快速检查明显违规内容
   */
  async checkContentRealtime(content: string): Promise<ContentCheckResult> {
    // 检查长度
    if (content.length > 5000) {
      return {
        isViolation: true,
        violationType: ViolationType.SPAM,
        reason: '评论内容过长',
      };
    }

    // 检查敏感词
    for (const word of this.sensitiveWords) {
      if (content.includes(word)) {
        return {
          isViolation: true,
          violationType: ViolationType.SENSITIVE,
          reason: `包含敏感词: ${word}`,
        };
      }
    }

    // 检查广告关键词
    const adKeywordCount = this.adKeywords.filter((keyword) =>
      content.includes(keyword),
    ).length;

    if (adKeywordCount >= 2) {
      return {
        isViolation: true,
        violationType: ViolationType.ADVERTISEMENT,
        reason: '疑似广告内容',
      };
    }

    // 检查重复字符（垃圾信息特征）
    if (this.hasExcessiveRepetition(content)) {
      return {
        isViolation: true,
        violationType: ViolationType.SPAM,
        reason: '包含过多重复字符',
      };
    }

    // 检查URL（垃圾信息特征）
    if (this.hasUrl(content)) {
      return {
        isViolation: true,
        violationType: ViolationType.SPAM,
        reason: '包含URL链接',
      };
    }

    return { isViolation: false };
  }

  /**
   * 第二层：异步审核
   * 调用外部内容安全API（如阿里云、腾讯云）
   * 这里仅为示例框架
   */
  async checkContentAsync(_content: string): Promise<ContentCheckResult> {
    // TODO: 集成实际的内容安全API
    // 示例：
    // const result = await this.alibabaContentSafetyApi.check(_content);
    // if (result.violationType) {
    //   return {
    //     isViolation: true,
    //     violationType: this.mapViolationType(result.violationType),
    //     reason: result.reason,
    //     confidence: result.confidence,
    //   };
    // }

    return { isViolation: false };
  }

  /**
   * 检查是否有过多重复字符
   */
  private hasExcessiveRepetition(content: string): boolean {
    // 检查连续重复字符超过5个
    const pattern = /(.)\1{4,}/g;
    return pattern.test(content);
  }

  /**
   * 检查是否包含URL
   */
  private hasUrl(content: string): boolean {
    const urlPattern =
      /https?:\/\/|www\.|\.com|\.cn|\.net|\.org|\.io|\.co/i;
    return urlPattern.test(content);
  }

  /**
   * 检查是否为垃圾信息（基于特征）
   */
  isLikelySpam(content: string): boolean {
    // 内容过短
    if (content.trim().length < 2) {
      return true;
    }

    // 全是数字或特殊符号
    if (!/[a-zA-Z\u4e00-\u9fa5]/.test(content)) {
      return true;
    }

    // 重复率过高
    const uniqueChars = new Set(content).size;
    const repetitionRate = 1 - uniqueChars / content.length;
    if (repetitionRate > 0.7) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否为辱骂/骚扰内容
   * 可以集成更复杂的NLP模型
   */
  isLikelyAbuse(content: string): boolean {
    // 示例：检查是否包含过多感叹号或问号
    const exclamationCount = (content.match(/!/g) || []).length;
    const questionCount = (content.match(/\?/g) || []).length;

    if (exclamationCount + questionCount > content.length * 0.3) {
      return true;
    }

    return false;
  }
}
