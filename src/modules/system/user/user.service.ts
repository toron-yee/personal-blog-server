import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserRole } from '@/common/enums/user.enum';
import { RedisService } from '@/modules/common/redis/redis.service';
import { Response } from '@/common/utils/response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateUserDto, operator: User) {
    this.checkRolePermission(operator, dto.role);

    const existByEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existByEmail) throw new BadRequestException('该邮箱已被注册');

    const existByUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existByUsername) throw new BadRequestException('该用户名已被占用');

    const user = this.userRepo.create(dto);
    await this.userRepo.save(user);

    await this.clearUserCache();

    const { password, ...result } = user;
    return new Response('创建成功', result);
  }

  async findAll(query: QueryUserDto) {
    const { page, pageSize, orderBy, order, username, nickname, email, role } = query;
    const where: any = {};

    if (username) where.username = Like(`%${username}%`);
    if (nickname) where.nickname = Like(`%${nickname}%`);
    if (email) where.email = Like(`%${email}%`);
    if (role !== undefined) where.role = role;

    const [data, total] = await this.userRepo.findAndCount({
      where,
      select: ['id', 'email', 'username', 'nickname', 'avatar', 'website', 'intro', 'role', 'createdAt', 'updatedAt'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [orderBy]: order },
    });

    return new Response('查询成功', { data, total, page, pageSize });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'username', 'nickname', 'avatar', 'website', 'intro', 'role', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return new Response('查询成功', user);
  }

  async update(id: string, dto: UpdateUserDto, operator: User) {
    this.checkRolePermission(operator, dto.role);

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    if (dto.username && dto.username !== user.username) {
      const exist = await this.userRepo.findOne({ where: { username: dto.username } });
      if (exist) throw new BadRequestException('该用户名已被占用');
    }

    Object.assign(user, dto);
    await this.userRepo.save(user);

    await this.clearUserCache(id);

    const { password, ...result } = user;
    return new Response('更新成功', result);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    await this.userRepo.remove(user);
    await this.clearUserCache(id);
    return new Response('删除成功');
  }

  private checkRolePermission(operator: User, targetRole?: UserRole) {
    if (targetRole !== undefined && targetRole >= UserRole.ADMIN && operator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('仅超级管理员可以设置管理员及以上角色');
    }
  }

  private async clearUserCache(userId?: string) {
    await this.redisService.delByPrefix('cache:user-list:');
    if (userId) {
      await this.redisService.delByPrefix(`cache:user-detail:${userId}`);
      await this.redisService.delByPrefix(`cache:profile:${userId}`);
    }
  }

  /**
   * 获取用户公开资料
   */
  async getPublicProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'username', 'nickname', 'avatar', 'website', 'intro', 'createdAt'],
    });
    if (!user) throw new NotFoundException('用户不存在');

    // 获取用户统计信息
    const stats = await this.getUserStats(userId);

    return new Response('查询成功', {
      ...user,
      stats,
    });
  }

  /**
   * 获取当前用户的完整信息
   */
  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'nickname', 'avatar', 'website', 'intro', 'role', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('用户不存在');

    // 获取用户统计信息
    const stats = await this.getUserStats(userId);

    return new Response('查询成功', {
      ...user,
      stats,
    });
  }

  /**
   * 更新当前用户的个人资料
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    Object.assign(user, dto);
    await this.userRepo.save(user);

    await this.clearUserCache(userId);

    const { password, ...result } = user;
    return new Response('更新成功', result);
  }

  /**
   * 获取用户统计信息
   */
  private async getUserStats(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['topics', 'comments', 'topicLikes', 'commentLikes'],
    });

    if (!user) return null;

    return {
      topicCount: user.topics?.length || 0,
      commentCount: user.comments?.length || 0,
      topicLikeCount: user.topicLikes?.length || 0,
      commentLikeCount: user.commentLikes?.length || 0,
    };
  }
}
