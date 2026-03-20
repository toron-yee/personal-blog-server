import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAiProfileDto } from './dto/create-ai-profile.dto';
import { UpdateAiProfileDto } from './dto/update-ai-profile.dto';
import { AiProfile } from './entities/ai-profile.entity';
import { UserReaderService } from '@/modules/identity/user/user-reader.service';
import { Response } from '@/common/utils/response';

@Injectable()
export class AiProfileService {
  constructor(
    @InjectRepository(AiProfile)
    private readonly aiProfileRepo: Repository<AiProfile>,
    private readonly userReaderService: UserReaderService,
  ) {}

  async create(userId: string, createAiProfileDto: CreateAiProfileDto) {
    await this.userReaderService.findUserEntityByIdOrFail(userId);

    const existedProfile = await this.aiProfileRepo.findOne({ where: { userId } });
    if (existedProfile) {
      throw new BadRequestException('当前用户已创建 AI 分身资料');
    }

    const profile = this.aiProfileRepo.create({
      userId,
      ...this.normalizePayload(createAiProfileDto),
    });
    await this.aiProfileRepo.save(profile);

    return new Response('创建成功', profile);
  }

  async findMine(userId: string) {
    const profile = await this.findEntityByUserIdOrFail(userId);
    return new Response('查询成功', profile);
  }

  async updateMine(userId: string, updateAiProfileDto: UpdateAiProfileDto) {
    const profile = await this.findEntityByUserIdOrFail(userId);

    Object.assign(profile, this.normalizePayload(updateAiProfileDto));
    await this.aiProfileRepo.save(profile);

    return new Response('更新成功', profile);
  }

  async removeMine(userId: string) {
    const profile = await this.findEntityByUserIdOrFail(userId);
    await this.aiProfileRepo.remove(profile);
    return new Response('删除成功');
  }

  async findEntityByUserIdOrFail(userId: string) {
    const profile = await this.aiProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('当前用户尚未创建 AI 分身资料');
    }

    return profile;
  }

  private normalizePayload(
    dto: CreateAiProfileDto | UpdateAiProfileDto,
  ): Partial<AiProfile> {
    const normalized: Partial<AiProfile> = {};

    if (dto.name !== undefined) normalized.name = dto.name.trim();
    if (dto.gender !== undefined) normalized.gender = dto.gender.trim();
    if (dto.age !== undefined) normalized.age = dto.age;
    if (dto.personality !== undefined) normalized.personality = dto.personality.trim();
    if (dto.speakingStyle !== undefined) normalized.speakingStyle = dto.speakingStyle.trim();
    if (dto.hobbies !== undefined) normalized.hobbies = dto.hobbies.trim();
    if (dto.occupation !== undefined) normalized.occupation = dto.occupation.trim();
    if (dto.remarks !== undefined) normalized.remarks = dto.remarks.trim();

    return normalized;
  }
}
