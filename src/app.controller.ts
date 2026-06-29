import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('seed-demo')
  async seedDemo() {
    await this.appService.seedDemo();
    return { success: true, message: 'Demo data seeded successfully' };
  }
}
