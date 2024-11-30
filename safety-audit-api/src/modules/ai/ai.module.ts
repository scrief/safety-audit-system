import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenAIService } from '../../services/openai.service';

@Module({
  controllers: [AIController],
  providers: [AIService, OpenAIService],
  exports: [AIService],
})
export class AIModule {} 