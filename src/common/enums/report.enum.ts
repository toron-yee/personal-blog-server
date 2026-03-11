/**
 * 举报类型枚举
 */
export enum ReportType {
  COMMENT = 'COMMENT',      // 举报评论
  TOPIC = 'TOPIC',          // 举报话题
  USER = 'USER',            // 举报用户
}

/**
 * 举报状态枚举
 */
export enum ReportStatus {
  PENDING = 'PENDING',           // 待审核
  PROCESSING = 'PROCESSING',     // 处理中
  RESOLVED = 'RESOLVED',         // 已处理
  REJECTED = 'REJECTED',         // 已驳回
}

/**
 * 举报原因枚举
 */
export enum ReportReason {
  SPAM = 'SPAM',                      // 垃圾信息
  ABUSE = 'ABUSE',                    // 辱骂/骚扰
  ILLEGAL = 'ILLEGAL',                // 违法内容
  SENSITIVE = 'SENSITIVE',            // 敏感内容
  ADVERTISEMENT = 'ADVERTISEMENT',    // 广告
  MISINFORMATION = 'MISINFORMATION',  // 虚假信息
  PLAGIARISM = 'PLAGIARISM',          // 抄袭
  OTHER = 'OTHER',                    // 其他
}
