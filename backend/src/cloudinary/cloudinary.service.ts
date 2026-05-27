import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export const ACTIVITY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ACTIVITY_IMAGE_FOLDER = 'buddyhub/activities';
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type UploadableImageFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
  originalname?: string;
};

export type UploadedCloudinaryImage = {
  secureUrl: string;
  publicId: string;
};

@Injectable()
export class CloudinaryService {
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly activityFolder: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.readConfig('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.readConfig('CLOUDINARY_API_KEY');
    this.apiSecret = this.readConfig('CLOUDINARY_API_SECRET');
    this.activityFolder =
      this.readConfig('CLOUDINARY_ACTIVITY_FOLDER') ?? ACTIVITY_IMAGE_FOLDER;

    if (this.hasCredentials()) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  async uploadActivityImage(
    file: UploadableImageFile,
  ): Promise<UploadedCloudinaryImage> {
    this.validateActivityImage(file);
    this.ensureConfigured();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.activityFolder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(
              new InternalServerErrorException(
                'Không thể upload ảnh hoạt động',
              ),
            );
            return;
          }

          resolve(uploadResult);
        },
      );

      Readable.from(file.buffer as Buffer).pipe(uploadStream);
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
    };
  }

  async deleteImage(publicId: string) {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }

  private validateActivityImage(file: UploadableImageFile) {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Vui lòng chọn ảnh hoạt động');
    }

    if (!file.mimetype || !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Ảnh chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF');
    }

    if (!file.size || file.size > ACTIVITY_IMAGE_MAX_BYTES) {
      throw new BadRequestException('Ảnh hoạt động tối đa 5MB');
    }
  }

  private ensureConfigured() {
    if (!this.hasCredentials()) {
      throw new InternalServerErrorException('Cloudinary chưa được cấu hình');
    }
  }

  private hasCredentials() {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  }

  private readConfig(key: string) {
    const value = this.configService.get<string>(key);
    return value?.trim() || undefined;
  }
}
