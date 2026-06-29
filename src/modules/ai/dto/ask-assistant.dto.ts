import { IsString } from 'class-validator';

export class AskAssistantDto {
  @IsString()
  question: string;
}
