import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { User } from './entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '创建用户（管理员）' })
  create(@CurrentUser() operator: User, @Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto, operator);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('user-list', 120)
  @ApiOperation({ summary: '分页查询用户列表（管理员）' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  /**
   * 获取用户公开资料
   */
  @Public()
  @Get('profile/:userId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('user-public-profile', 300)
  @ApiOperation({ summary: '获取用户公开资料' })
  getPublicProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.getPublicProfile(userId);
  }

  /**
   * 获取当前用户信息
   */
  @Get('me/info')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('user-current-info', 300)
  @ApiOperation({ summary: '获取当前用户信息' })
  getCurrentUser(@CurrentUser('id') userId: string) {
    return this.userService.getCurrentUser(userId);
  }

  /**
   * 更新当前用户个人资料
   */
  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新当前用户个人资料' })
  updateProfile(@CurrentUser('id') userId: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('user-detail', 300)
  @ApiOperation({ summary: '获取指定用户（管理员）' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '更新用户（管理员）' })
  update(@CurrentUser() operator: User, @Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto, operator);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '删除用户（超级管理员）' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
