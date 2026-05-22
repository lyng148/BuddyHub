import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        faculty: true,
        schoolYear: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        interests: {
          select: {
            interest: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('error');
    }

    const [hostedCount, joinedCount] = await Promise.all([
      this.prisma.activity.count({ where: { hostId: userId } }),
      this.prisma.activityParticipant.count({
        where: { userId, status: 'JOINED' },
      }),
    ]);

    return {
      message: 'OK',
      profile: {
        name: user.name,
        faculty: user.faculty,
        schoolYear: user.schoolYear,
        interests: user.interests.map((item) => item.interest.name),
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        hostedCount,
        joinedCount,
        isVerified: user.isVerified,
      },
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) {
      throw new BadRequestException('error');
    }

    const updateData: {
      name?: string;
      faculty?: string | null;
      schoolYear?: number | null;
      avatarUrl?: string | null;
      bio?: string | null;
      interests?: {
        deleteMany: Record<string, never>;
        create: { interest: { connect: { name: string } } }[];
      };
    } = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.faculty !== undefined) updateData.faculty = dto.faculty;
    if (dto.schoolYear !== undefined) updateData.schoolYear = dto.schoolYear;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) updateData.bio = dto.bio;

    if (dto.interests !== undefined) {
      const normalized = Array.from(
        new Set(
          dto.interests
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      );

      const existingTags = await this.prisma.interestTag.findMany({
        where: { name: { in: normalized } },
        select: { name: true },
      });

      if (existingTags.length !== normalized.length) {
        throw new BadRequestException('error');
      }

      updateData.interests = {
        deleteMany: {},
        create: normalized.map((name) => ({
          interest: {
            connect: { name },
          },
        })),
      };
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return this.getPublicProfile(userId);
  }
}
