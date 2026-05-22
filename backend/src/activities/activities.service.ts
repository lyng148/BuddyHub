import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';

const MAX_KEYWORD_LENGTH = 100;
const EARTH_RADIUS_KM = 6371;

const CATEGORY_ALIASES = new Map<string, string>([
  ['ăn uống', 'Ăn uống'],
  ['ăn uống / cà phê', 'Ăn uống'],
  ['ăn uống/cà phê', 'Ăn uống'],
  ['lunch', 'Ăn uống'],
  ['food', 'Ăn uống'],
  ['học nhóm', 'Học nhóm'],
  ['study', 'Học nhóm'],
  ['board games', 'Board Games'],
  ['board game', 'Board Games'],
  ['boardgame', 'Board Games'],
  ['thể thao', 'Thể thao'],
  ['thể thao / fitness', 'Thể thao'],
  ['thể thao/fitness', 'Thể thao'],
  ['sports', 'Thể thao'],
  ['sport', 'Thể thao'],
  ['giao lưu', 'Giao lưu'],
  ['giao lưu / tụ tập', 'Giao lưu'],
  ['giao lưu/tụ tập', 'Giao lưu'],
  ['giao lưu・tự học', 'Giao lưu'],
  ['giao lưu / tự học', 'Giao lưu'],
  ['giao lưu/tự học', 'Giao lưu'],
  ['social', 'Giao lưu'],
  ['khác', 'Khác'],
  ['other', 'Khác'],
]);

const ALL_CATEGORY_VALUES = new Set(['all', 'tất cả']);
const ALL_TIME_VALUES = new Set(['all', 'all_time', 'tất cả thời gian']);
const VALID_TIME_FILTERS = new Set(['today', 'tomorrow', 'this_week']);

interface UserLocation {
  latitude: number;
  longitude: number;
}

type ActivityListItem = Prisma.ActivityGetPayload<{
  include: {
    category: true;
    host: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        participants: true;
      };
    };
  };
}>;

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetActivitiesQueryDto) {
    try {
      const keyword = this.getKeyword(query);
      const categoryName = this.getCategoryName(query);
      const timeRange = this.getTimeRange(query);
      const userLocation = this.getUserLocation(query);

      const where: Prisma.ActivityWhereInput = {
        status: { notIn: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] },
      };

      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
          { purpose: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      if (categoryName) {
        where.category = { name: categoryName };
      }

      if (timeRange) {
        where.startTime = {
          gte: timeRange.from,
          lt: timeRange.to,
        };
      }

      const activities = await this.prisma.activity.findMany({
        where,
        include: {
          category: true,
          host: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              participants: { where: { status: 'JOINED' } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      return this.mapActivities(activities, userLocation);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({ message: 'error' });
    }
  }

  private mapActivities(
    activities: ActivityListItem[],
    userLocation?: UserLocation,
  ) {
    const mappedActivities = activities.map((activity) => {
      const distanceKm =
        userLocation &&
        activity.latitude !== null &&
        activity.longitude !== null
          ? this.calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              activity.latitude,
              activity.longitude,
            )
          : null;

      return {
        id: activity.id,
        title: activity.title,
        category: {
          id: activity.category.id,
          name: activity.category.name,
        },
        categoryName: activity.category.name,
        purpose: activity.purpose,
        location: activity.location,
        latitude: activity.latitude,
        longitude: activity.longitude,
        startTime: activity.startTime,
        deadline: activity.deadline,
        maxSlots: activity.maxSlots,
        currentParticipants: activity._count.participants,
        description: activity.description,
        status: activity.status,
        host: activity.host,
        distanceKm,
      };
    });

    if (!userLocation) {
      return mappedActivities;
    }

    return mappedActivities.sort((first, second) => {
      if (first.distanceKm === null && second.distanceKm === null) return 0;
      if (first.distanceKm === null) return 1;
      if (second.distanceKm === null) return -1;
      return first.distanceKm - second.distanceKm;
    });
  }

  private getKeyword(query: GetActivitiesQueryDto) {
    const keyword = this.getOptionalString(query, ['keyword']);
    if (!keyword) return undefined;

    if (keyword.length > MAX_KEYWORD_LENGTH) {
      throw this.error();
    }

    return keyword;
  }

  private getCategoryName(query: GetActivitiesQueryDto) {
    const rawCategory = this.getOptionalString(query, [
      'category',
      'type',
      'activityType',
    ]);
    if (!rawCategory) return undefined;

    const normalized = this.normalize(rawCategory);
    if (ALL_CATEGORY_VALUES.has(normalized)) return undefined;

    const categoryName = CATEGORY_ALIASES.get(normalized);
    if (!categoryName) {
      throw this.error();
    }

    return categoryName;
  }

  private getTimeRange(query: GetActivitiesQueryDto) {
    const rawTime = this.getOptionalString(query, ['time', 'activityTime']);
    if (!rawTime) return undefined;

    const normalized = this.normalize(rawTime);
    if (ALL_TIME_VALUES.has(normalized)) return undefined;
    if (!VALID_TIME_FILTERS.has(normalized)) {
      throw this.error();
    }

    const today = this.startOfDay(new Date());
    if (normalized === 'today') {
      return { from: today, to: this.addDays(today, 1) };
    }

    if (normalized === 'tomorrow') {
      const tomorrow = this.addDays(today, 1);
      return { from: tomorrow, to: this.addDays(tomorrow, 1) };
    }

    return { from: today, to: this.startOfNextWeek(today) };
  }

  private getUserLocation(query: GetActivitiesQueryDto) {
    const latitudeValue = this.findFirstValue(query, [
      'latitude',
      'lat',
      'currentLatitude',
      'currentLat',
    ]);
    const longitudeValue = this.findFirstValue(query, [
      'longitude',
      'lng',
      'currentLongitude',
      'currentLng',
    ]);

    if (latitudeValue === undefined && longitudeValue === undefined) {
      return undefined;
    }

    if (latitudeValue === undefined || longitudeValue === undefined) {
      throw this.error();
    }

    const latitude = this.parseNumber(latitudeValue);
    const longitude = this.parseNumber(longitudeValue);

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw this.error();
    }

    return { latitude, longitude };
  }

  private getOptionalString(
    query: GetActivitiesQueryDto,
    keys: Array<keyof GetActivitiesQueryDto>,
  ) {
    const value = this.findFirstValue(query, keys);
    if (value === undefined) return undefined;

    if (typeof value !== 'string') {
      throw this.error();
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  private findFirstValue(
    query: GetActivitiesQueryDto,
    keys: Array<keyof GetActivitiesQueryDto>,
  ) {
    for (const key of keys) {
      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
  }

  private parseNumber(value: unknown) {
    const numberValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.trim())
          : Number.NaN;

    if (!Number.isFinite(numberValue)) {
      throw this.error();
    }

    return numberValue;
  }

  private calculateDistanceKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
  ) {
    const latitudeDelta = this.toRadians(toLatitude - fromLatitude);
    const longitudeDelta = this.toRadians(toLongitude - fromLongitude);
    const firstLatitude = this.toRadians(fromLatitude);
    const secondLatitude = this.toRadians(toLatitude);

    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;

    const distance =
      2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return Math.round(distance * 100) / 100;
  }

  private toRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
  }

  private startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private addDays(value: Date, days: number) {
    const nextDate = new Date(value);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private startOfNextWeek(today: Date) {
    const daysUntilNextMonday = 8 - (today.getDay() || 7);
    return this.addDays(today, daysUntilNextMonday);
  }

  private normalize(value: string) {
    return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private error() {
    return new BadRequestException({ message: 'error' });
  }
}
