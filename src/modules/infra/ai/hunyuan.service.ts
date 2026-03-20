import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';

export interface HunyuanMessage {
  Role: 'system' | 'user' | 'assistant';
  Content: string;
}

@Injectable()
export class HunyuanService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async chat(messages: HunyuanMessage[]) {
    const secretId = this.configService.get<string>('HUNYUAN_SECRET_ID');
    const secretKey = this.configService.get<string>('HUNYUAN_SECRET_KEY');

    if (!secretId || !secretKey) {
      throw new ServiceUnavailableException('AI 服务未配置混元密钥');
    }

    const tencentcloud = this.loadSdk();
    const Client = tencentcloud?.hunyuan?.v20230901?.Client;

    if (!Client) {
      throw new ServiceUnavailableException('AI 服务依赖加载失败，请检查混元 SDK 安装');
    }

    const model = this.configService.get<string>('HUNYUAN_MODEL', 'hunyuan-turbo');
    const region = this.configService.get<string>('HUNYUAN_REGION', 'ap-guangzhou');
    const temperature = this.parseTemperature(
      this.configService.get<string>('HUNYUAN_TEMPERATURE', '0.8'),
    );
    const startedAt = Date.now();

    try {
      this.logger.log('Calling Hunyuan model', HunyuanService.name, {
        model,
        region,
        messageCount: messages.length,
      });

      const client = new Client({
        credential: { secretId, secretKey },
        region,
      });

      const response = await client.ChatCompletions({
        Model: model,
        Messages: messages,
        Stream: false,
        Temperature: temperature,
      });

      const content = this.extractReplyContent(response);
      if (!content) {
        throw new ServiceUnavailableException('AI 服务返回内容为空');
      }

      this.logger.log('Hunyuan model completed', HunyuanService.name, {
        model,
        region,
        messageCount: messages.length,
        durationMs: Date.now() - startedAt,
      });

      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `混元调用失败: ${error instanceof Error ? error.message : 'unknown error'}`,
        HunyuanService.name,
        error instanceof Error ? error.stack : undefined,
        {
          model,
          region,
          messageCount: messages.length,
          durationMs: Date.now() - startedAt,
        },
      );
      throw new ServiceUnavailableException('AI 回复生成失败，请稍后再试');
    }
  }

  private loadSdk() {
    try {
      return require('tencentcloud-sdk-nodejs-hunyuan');
    } catch (error) {
      this.logger.error(
        `混元 SDK 未安装: ${error instanceof Error ? error.message : 'unknown error'}`,
        HunyuanService.name,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'AI 服务依赖未安装，请先安装 tencentcloud-sdk-nodejs-hunyuan',
      );
    }
  }

  private extractReplyContent(response: any) {
    const content = response?.Choices?.[0]?.Message?.Content;

    if (typeof content === 'string') {
      return content.trim();
    }

    this.logger.warn('Hunyuan returned empty content', HunyuanService.name, {
      response,
    });
    return '';
  }

  private parseTemperature(rawValue: string) {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0.8;
  }
}
