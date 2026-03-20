import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('分类管理')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 创建分类（管理员）
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建分类', description: '仅管理员可操作' })
  @ApiResponse({ status: 201, description: '分类创建成功' })
  @ApiResponse({ status: 400, description: '分类名称已存在' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * 获取所有分类
   */
  @Public()
  @Get()
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('category-list', 300)
  @ApiOperation({ summary: '获取所有分类' })
  @ApiResponse({ status: 200, description: '返回所有分类列表' })
  findAll() {
    return this.categoryService.findAll();
  }

  /**
   * 获取启用的分类
   */
  @Public()
  @Get('active/list')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('category-active', 300)
  @ApiOperation({ summary: '获取启用的分类' })
  @ApiResponse({ status: 200, description: '返回启用的分类列表' })
  findActive() {
    return this.categoryService.findActive();
  }

  /**
   * 获取分类详情
   */
  @Public()
  @Get(':id')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('category-detail', 300)
  @ApiOperation({ summary: '获取分类详情' })
  @ApiResponse({ status: 200, description: '返回分类详情' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  /**
   * 获取分类下的话题数量
   */
  @Public()
  @Get(':id/topic-count')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('category-topic-count', 300)
  @ApiOperation({ summary: '获取分类下的话题数量' })
  @ApiResponse({ status: 200, description: '返回话题数量' })
  getTopicCount(@Param('id') id: string) {
    return this.categoryService.getTopicCount(id);
  }

  /**
   * 更新分类（管理员）
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新分类', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '分类更新成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**
   * 启用分类（管理员）
   */
  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用分类', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '分类已启用' })
  enable(@Param('id') id: string) {
    return this.categoryService.enable(id);
  }

  /**
   * 禁用分类（管理员）
   */
  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '禁用分类', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '分类已禁用' })
  disable(@Param('id') id: string) {
    return this.categoryService.disable(id);
  }

  /**
   * 删除分类（管理员）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除分类', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '分类已删除' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
