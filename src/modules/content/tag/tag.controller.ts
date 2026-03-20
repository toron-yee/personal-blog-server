import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('标签管理')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * 创建标签（管理员）
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建标签', description: '仅管理员可操作' })
  @ApiResponse({ status: 201, description: '标签创建成功' })
  @ApiResponse({ status: 400, description: '标签名称已存在' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  /**
   * 获取所有标签
   */
  @Public()
  @Get()
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('tag-list', 300)
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '返回所有标签列表' })
  findAll() {
    return this.tagService.findAll();
  }

  /**
   * 获取启用的标签
   */
  @Public()
  @Get('active/list')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('tag-active', 300)
  @ApiOperation({ summary: '获取启用的标签' })
  @ApiResponse({ status: 200, description: '返回启用的标签列表' })
  findActive() {
    return this.tagService.findActive();
  }

  /**
   * 获取热门标签
   */
  @Public()
  @Get('hot/list')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('tag-hot', 300)
  @ApiOperation({ summary: '获取热门标签' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量，默认10' })
  @ApiResponse({ status: 200, description: '返回热门标签列表' })
  getHotTags(@Query('limit') limit: string = '10') {
    return this.tagService.getHotTags(parseInt(limit, 10));
  }

  /**
   * 获取标签详情
   */
  @Public()
  @Get(':id')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('tag-detail', 300)
  @ApiOperation({ summary: '获取标签详情' })
  @ApiResponse({ status: 200, description: '返回标签详情' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }

  /**
   * 获取标签下的话题数量
   */
  @Public()
  @Get(':id/topic-count')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('tag-topic-count', 300)
  @ApiOperation({ summary: '获取标签下的话题数量' })
  @ApiResponse({ status: 200, description: '返回话题数量' })
  getTopicCount(@Param('id') id: string) {
    return this.tagService.getTopicCount(id);
  }

  /**
   * 更新标签（管理员）
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新标签', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '标签更新成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(id, updateTagDto);
  }

  /**
   * 启用标签（管理员）
   */
  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用标签', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '标签已启用' })
  enable(@Param('id') id: string) {
    return this.tagService.enable(id);
  }

  /**
   * 禁用标签（管理员）
   */
  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '禁用标签', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '标签已禁用' })
  disable(@Param('id') id: string) {
    return this.tagService.disable(id);
  }

  /**
   * 删除标签（管理员）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除标签', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '标签已删除' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  remove(@Param('id') id: string) {
    return this.tagService.remove(id);
  }
}
