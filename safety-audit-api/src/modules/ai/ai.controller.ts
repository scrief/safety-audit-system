import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  async generateRecommendation(@Body() body: { prompt: string; model: string; maxTokens: number }) {
    try {
      console.log('AI generation request received:', {
        promptLength: body.prompt?.length,
        model: body.model,
        maxTokens: body.maxTokens
      });
      
      if (!body.prompt) {
        throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
      }

      const recommendation = await this.aiService.generateRecommendation(
        body.prompt,
        body.model || 'gpt-3.5-turbo',
        body.maxTokens || 150
      );

      console.log('Generated recommendation:', {
        length: recommendation.length,
        preview: recommendation.substring(0, 100)
      });

      return {
        success: true,
        data: {
          recommendation: recommendation.trim()
        }
      };
    } catch (error: any) {
      console.error('Error in AI controller:', {
        name: error?.name,
        message: error?.message,
        status: error?.status
      });

      throw new HttpException(
        error?.message || 'Failed to generate recommendation',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 