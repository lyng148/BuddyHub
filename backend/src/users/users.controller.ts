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
  UnauthorizedException,
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

  // GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyUser(@CurrentUser() user: AuthUser) {
    return {
      message: 'OK',
      id: user?.sub ?? null,
      email: user?.email ?? null,
    }
  }

  // GET /api/users/me/dashboard
  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  getMyDashboard(@CurrentUser() user: AuthUser) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }

    return this.usersService.getMyDashboard(userId)
  }
  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  updateMyProfilePut(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    return this.usersService.updateMyProfile(userId, dto);
  }

  // PATCH /api/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfilePatch(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const userId = user?.sub ?? (user as any)?.id
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
    }
    return this.usersService.updateMyProfile(userId, dto);
  }
}
