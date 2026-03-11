import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * 创建标签
   */
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;

    // 检查标签名称是否已存在
    const existing = await this.tagRepository.findOne({
      where: { name, isDeleted: false },
    });

    if (existing) {
      throw new BadRequestException('标签名称已存在');
    }

    const tag = this.tagRepository.create({
      ...createTagDto,
      usageCount: 0,
    });

    return this.tagRepository.save(tag);
  }

  /**
   * 获取所有标签（未删除）
   */
  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { isDeleted: false },
      relations: ['topics'],
      order: { usageCount: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取启用的标签
   */
  async findActive(): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { isDeleted: false, isActive: true },
      relations: ['topics'],
      order: { usageCount: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 获取标签
   */
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['topics'],
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return tag;
  }

  /**
   * 根据名称获取标签
   */
  async findByName(name: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { name, isDeleted: false },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return tag;
  }

  /**
   * 根据名称列表获取标签
   */
  async findByNames(names: string[]): Promise<Tag[]> {
    if (!names || names.length === 0) {
      return [];
    }

    return this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.name IN (:...names)', { names })
      .andWhere('tag.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();
  }

  /**
   * 更新标签
   */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    // 如果更新名称，检查是否重复
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existing = await this.tagRepository.findOne({
        where: { name: updateTagDto.name, isDeleted: false },
      });

      if (existing) {
        throw new BadRequestException('标签名称已存在');
      }
    }

    Object.assign(tag, updateTagDto);
    return this.tagRepository.save(tag);
  }

  /**
   * 软删除标签
   */
  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    tag.isDeleted = true;
    await this.tagRepository.save(tag);
  }

  /**
   * 启用标签
   */
  async enable(id: string): Promise<Tag> {
    const tag = await this.findOne(id);
    tag.isActive = true;
    return this.tagRepository.save(tag);
  }

  /**
   * 禁用标签
   */
  async disable(id: string): Promise<Tag> {
    const tag = await this.findOne(id);
    tag.isActive = false;
    return this.tagRepository.save(tag);
  }

  /**
   * 增加标签使用次数
   */
  async incrementUsage(id: string, count: number = 1): Promise<void> {
    await this.tagRepository.increment({ id }, 'usageCount', count);
  }

  /**
   * 减少标签使用次数
   */
  async decrementUsage(id: string, count: number = 1): Promise<void> {
    const tag = await this.findOne(id);
    const newCount = Math.max(0, tag.usageCount - count);
    tag.usageCount = newCount;
    await this.tagRepository.save(tag);
  }

  /**
   * 批量增加标签使用次数
   */
  async incrementUsageBatch(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    await this.tagRepository
      .createQueryBuilder()
      .update(Tag)
      .set({ usageCount: () => 'usageCount + 1' })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  /**
   * 批量减少标签使用次数
   */
  async decrementUsageBatch(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    await this.tagRepository
      .createQueryBuilder()
      .update(Tag)
      .set({ usageCount: () => 'GREATEST(usageCount - 1, 0)' })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  /**
   * 获取热门标签
   */
  async getHotTags(limit: number = 10): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { isDeleted: false, isActive: true },
      relations: ['topics'],
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取标签下的话题数量
   */
  async getTopicCount(id: string): Promise<number> {
    const tag = await this.findOne(id);
    return tag.topics?.filter((t) => !t.isDeleted).length || 0;
  }
}
