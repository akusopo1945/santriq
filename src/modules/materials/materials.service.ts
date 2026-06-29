import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Material } from './entities/material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  async create(data: {
    title: string;
    description?: string;
    filePath: string;
    fileSize: number;
    uploaderId: string;
    classId: string;
    tags?: string;
    folderPath?: string;
  }): Promise<Material> {
    const material = this.materialsRepository.create({
      title: data.title,
      description: data.description || null,
      filePath: data.filePath,
      fileSize: data.fileSize,
      uploaderId: data.uploaderId,
      classId: data.classId,
      tags: data.tags || null,
      folderPath: data.folderPath || null,
    });
    return this.materialsRepository.save(material);
  }

  async findAllByClass(classId: string, query?: { search?: string; folderPath?: string }): Promise<Material[]> {
    const qb = this.materialsRepository.createQueryBuilder('material')
      .where('material.class_id = :classId', { classId });

    if (query?.folderPath) {
      qb.andWhere('material.folder_path = :folderPath', { folderPath: query.folderPath });
    }
    if (query?.search) {
      qb.andWhere('(LOWER(material.title) LIKE :search OR LOWER(material.description) LIKE :search OR LOWER(material.tags) LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`
      });
    }

    qb.orderBy('material.created_at', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialsRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }
    return material;
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    
    // Delete local file asynchronously
    if (fs.existsSync(material.filePath)) {
      try {
        await fs.promises.unlink(material.filePath);
      } catch (err) {
        // Log error and continue deleting DB record
        console.error(`Gagal menghapus file: ${material.filePath}`, err);
      }
    }
    
    await this.materialsRepository.remove(material);
  }
}
