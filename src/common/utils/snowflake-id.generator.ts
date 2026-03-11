/**
 * 雪花 ID 生成器
 * 用于分布式系统中生成全局唯一的有序 ID
 *
 * 结构（64位）：
 * - 1位：符号位（0）
 * - 41位：时间戳（毫秒）
 * - 10位：数据中心ID + 机器ID
 * - 12位：序列号
 */
export class SnowflakeIdGenerator {
  private readonly epoch = 1609459200000; // 2021-01-01 00:00:00 UTC
  private readonly dataCenterId: number;
  private readonly machineId: number;
  private sequence = 0;
  private lastTimestamp = -1;

  constructor(dataCenterId: number = 1, machineId: number = 1) {
    if (dataCenterId < 0 || dataCenterId > 31) {
      throw new Error('dataCenterId must be between 0 and 31');
    }
    if (machineId < 0 || machineId > 31) {
      throw new Error('machineId must be between 0 and 31');
    }

    this.dataCenterId = dataCenterId;
    this.machineId = machineId;
  }

  /**
   * 生成雪花 ID
   */
  generate(): number {
    let timestamp = Date.now() - this.epoch;

    if (timestamp === this.lastTimestamp) {
      // 同一毫秒内，序列号递增
      this.sequence = (this.sequence + 1) & 0xfff; // 12位序列号

      if (this.sequence === 0) {
        // 序列号溢出，等待下一毫秒
        timestamp = this.waitNextMillis(timestamp);
      }
    } else {
      // 新的毫秒，重置序列号
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // 组合 ID
    // 时间戳左移22位 + 数据中心ID左移17位 + 机器ID左移12位 + 序列号
    const id =
      ((timestamp & 0x1ffffffffff) << 22) |
      ((this.dataCenterId & 0x1f) << 17) |
      ((this.machineId & 0x1f) << 12) |
      (this.sequence & 0xfff);

    return id;
  }

  /**
   * 等待下一毫秒
   */
  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = Date.now() - this.epoch;
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now() - this.epoch;
    }
    return timestamp;
  }

  /**
   * 解析雪花 ID
   */
  static parse(id: number) {
    const epoch = 1609459200000;
    const timestamp = (id >> 22) + epoch;
    const dataCenterId = (id >> 17) & 0x1f;
    const machineId = (id >> 12) & 0x1f;
    const sequence = id & 0xfff;

    return {
      timestamp: new Date(timestamp),
      dataCenterId,
      machineId,
      sequence,
    };
  }
}

// 全局单例
export const snowflakeIdGenerator = new SnowflakeIdGenerator(
  parseInt(process.env.DATA_CENTER_ID || '1'),
  parseInt(process.env.MACHINE_ID || '1'),
);
