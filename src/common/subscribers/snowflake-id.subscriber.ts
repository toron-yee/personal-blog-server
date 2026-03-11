import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { snowflakeIdGenerator } from '@/common/utils/snowflake-id.generator';

/**
 * 实体订阅者
 * 在实体插入前自动生成雪花 ID
 */
@EventSubscriber()
export class SnowflakeIdSubscriber implements EntitySubscriberInterface {
  /**
   * 在插入前生成雪花 ID
   */
  beforeInsert(event: InsertEvent<any>) {
    // 如果实体有 snowflakeId 字段且未设置，则自动生成
    if (event.entity && !event.entity.snowflakeId) {
      event.entity.snowflakeId = snowflakeIdGenerator.generate();
    }
  }
}
