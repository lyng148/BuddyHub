import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /api/users/:userId/profile
  @Get(':userId/profile')
  getPublicProfile(
    @Param(
      'userId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('error'),
      }),
    )
    userId: string,
  ) {
    return this.usersService.getPublicProfile(userId);
  }

  // PUT /api/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  updateMyProfilePut(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMyProfile(user.sub, dto);
  }

  // PATCH /api/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfilePatch(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMyProfile(user.sub, dto);
  }
}
