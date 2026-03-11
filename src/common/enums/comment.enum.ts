/**
 * 评论状态枚举
 */
export enum CommentStatus {
  NORMAL = 'normal',  // 正常
  FLAGGED = 'flagged',  // 标记为可疑
  PENDING_REVIEW = 'pending_review',  // 待人工审核
  REJECTED = 'rejected',  // 已拒绝
  HIDDEN = 'hidden',  // 已隐藏
}

/**
 * 评论违规类型枚举
 */
export enum ViolationType {
  SPAM = 'spam',  // 垃圾信息
  ABUSE = 'abuse',  // 辱骂/骚扰
  ILLEGAL = 'illegal',  // 违法内容
  SENSITIVE = 'sensitive',  // 敏感词
  ADVERTISEMENT = 'advertisement',  // 广告
  OTHER = 'other',  // 其他
}
