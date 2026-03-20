import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * 创建分类
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name } = createCategoryDto;

    // 检查分类名称是否已存在
    const existing = await this.categoryRepository.findOne({
      where: { name, isDeleted: false },
    });

    if (existing) {
      throw new BadRequestException('分类名称已存在');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * 获取所有分类（未删除）
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isDeleted: false },
      relations: ['topics'],
      order: { sort: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取启用的分类
   */
  async findActive(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isDeleted: false, isActive: true },
      relations: ['topics'],
      order: { sort: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 获取分类
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['topics'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  /**
   * 根据名称获取分类
   */
  async findByName(name: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { name, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  /**
   * 更新分类
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // 如果更新名称，检查是否重复
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name, isDeleted: false },
      });

      if (existing) {
        throw new BadRequestException('分类名称已存在');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * 软删除分类
   */
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    category.isDeleted = true;
    await this.categoryRepository.save(category);
  }

  /**
   * 启用分类
   */
  async enable(id: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = true;
    return this.categoryRepository.save(category);
  }

  /**
   * 禁用分类
   */
  async disable(id: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = false;
    return this.categoryRepository.save(category);
  }

  /**
   * 获取分类下的话题数量
   */
  async getTopicCount(id: string): Promise<number> {
    const category = await this.findOne(id);
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.topics', 'topics')
      .where('category.id = :id', { id })
      .andWhere('topics.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();
  }
}
