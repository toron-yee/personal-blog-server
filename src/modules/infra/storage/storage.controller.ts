import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { Response } from '@/common/utils/response';

@ApiTags('文件存储')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 上传文件
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件' })
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '文件',
        },
        folder: {
          type: 'string',
          description: '存储文件夹（如 avatars, topics）',
          default: 'general',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '上传成功' })
  @ApiResponse({ status: 400, description: '文件验证失败' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const url = await this.storageService.uploadFile(file, folder);

    return new Response('上传成功', {
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  /**
   * 删除文件
   */
  @Delete('delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除文件' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '文件URL',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteFile(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('文件URL不能为空');
    }

    await this.storageService.deleteFile(url);

    return new Response('删除成功');
  }
}
