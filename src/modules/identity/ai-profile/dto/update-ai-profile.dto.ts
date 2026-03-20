import { PartialType } from '@nestjs/swagger';
import { CreateAiProfileDto } from './create-ai-profile.dto';

export class UpdateAiProfileDto extends PartialType(CreateAiProfileDto) {}
