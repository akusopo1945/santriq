import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    await this.ensureSettingsExist();
  }

  private async ensureSettingsExist(): Promise<SystemSetting> {
    let settings = await this.settingsRepository.findOne({ where: { id: 'default' } });
    if (!settings) {
      settings = this.settingsRepository.create({
        id: 'default',
        institutionName: 'SantriQ',
        logoUrl: '',
        address: '',
        phone: '',
      });
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async getSettings(): Promise<SystemSetting> {
    return this.ensureSettingsExist();
  }

  async updateSettings(data: {
    institutionName?: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  }): Promise<SystemSetting> {
    const settings = await this.ensureSettingsExist();
    if (data.institutionName !== undefined) settings.institutionName = data.institutionName;
    if (data.logoUrl !== undefined) settings.logoUrl = data.logoUrl;
    if (data.address !== undefined) settings.address = data.address;
    if (data.phone !== undefined) settings.phone = data.phone;
    return this.settingsRepository.save(settings);
  }
}
