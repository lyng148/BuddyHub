import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ACTIVITY_IMAGE_MAX_BYTES,
  type UploadableImageFile,
} from '../cloudinary/cloudinary.service';
import type { AuthenticatedRequest } from '../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // GET /api/activities
  @Get()
  findAll(@Query() query: GetActivitiesQueryDto) {
    return this.activitiesService.findAll(query);
  }

  // GET /api/activities/:id
  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('ID hoạt động không hợp lệ'),
      }),
    )
    id: string,
  ) {
    return this.activitiesService.findOne(id);
  }

  // POST /api/activities
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: ACTIVITY_IMAGE_MAX_BYTES },
    }),
  )
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateActivityDto,
    @UploadedFile() image?: UploadableImageFile,
  ) {
    return this.activitiesService.create(req.user.id, dto, image);
  }
}
