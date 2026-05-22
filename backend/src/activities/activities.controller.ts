import { Controller, Get, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // GET /api/activities
  @Get()
  findAll(@Query() query: GetActivitiesQueryDto) {
    return this.activitiesService.findAll(query);
  }
}
