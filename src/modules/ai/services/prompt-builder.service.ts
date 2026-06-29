import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  buildPrompt(type: string, inputData: any): string {
    return inputData.contentText || JSON.stringify(inputData);
  }
}
