import { IsString } from 'class-validator';

export class GenerateSummaryDto {
  @IsString()
  contentText: string;
}
