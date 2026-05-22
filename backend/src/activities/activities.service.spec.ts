import { BadRequestException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService', () => {
  const activity = {
    findMany: jest.fn(),
  };
  const prisma = {
    activity,
  } as any;

  let service: ActivitiesService;

  const firstActivity = {
    id: 'activity-1',
    title: 'Lunch at the Union Cafeteria',
    purpose: 'Gặp gỡ bạn mới',
    location: 'Student Union Building, 2nd Floor',
    latitude: 21.005,
    longitude: 105.845,
    startTime: new Date('2026-05-24T12:00:00.000Z'),
    deadline: new Date('2026-05-23T12:00:00.000Z'),
    maxSlots: 6,
    description: 'Grabbing lunch and chatting about anything.',
    status: 'OPEN',
    category: { id: 'category-1', name: 'Ăn uống' },
    host: { id: 'user-1', name: 'Alex Chen', avatarUrl: null },
    _count: { participants: 3 },
  };

  const secondActivity = {
    ...firstActivity,
    id: 'activity-2',
    title: 'CS 301 Study Group',
    latitude: 21.001,
    longitude: 105.841,
    category: { id: 'category-2', name: 'Học nhóm' },
    _count: { participants: 5 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    activity.findMany.mockResolvedValue([firstActivity, secondActivity]);
    service = new ActivitiesService(prisma);
  });

  it('returns activity list items', async () => {
    await expect(service.findAll({})).resolves.toEqual([
      expect.objectContaining({
        id: 'activity-1',
        title: 'Lunch at the Union Cafeteria',
        categoryName: 'Ăn uống',
        currentParticipants: 3,
        maxSlots: 6,
        host: { id: 'user-1', name: 'Alex Chen', avatarUrl: null },
        distanceKm: null,
      }),
      expect.objectContaining({
        id: 'activity-2',
        categoryName: 'Học nhóm',
        currentParticipants: 5,
      }),
    ]);

    expect(activity.findMany).toHaveBeenCalledWith({
      where: {
        status: { notIn: ['CANCELLED', 'FINISHED'] },
      },
      include: expect.any(Object),
      orderBy: { startTime: 'asc' },
    });
  });

  it('filters by keyword and category aliases', async () => {
    await service.findAll({ keyword: 'cafeteria', category: 'Lunch' });

    expect(activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { name: 'Ăn uống' },
          OR: [
            { title: { contains: 'cafeteria', mode: 'insensitive' } },
            { location: { contains: 'cafeteria', mode: 'insensitive' } },
            { purpose: { contains: 'cafeteria', mode: 'insensitive' } },
            { description: { contains: 'cafeteria', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });

  it('sorts nearby activities first when user location is provided', async () => {
    const result = await service.findAll({
      latitude: '21.001',
      longitude: '105.841',
    });

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'activity-2',
        distanceKm: 0,
      }),
    );
  });

  it('adds today time range', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-22T04:00:00.000Z'));

    await service.findAll({ time: 'today' });

    const call = activity.findMany.mock.calls[0][0];
    expect(call.where.startTime.gte).toBeInstanceOf(Date);
    expect(call.where.startTime.lt).toBeInstanceOf(Date);
    expect(call.where.startTime.gte.getTime()).toBeLessThan(
      call.where.startTime.lt.getTime(),
    );

    jest.useRealTimers();
  });

  it('rejects keywords longer than 100 characters', async () => {
    await expect(
      service.findAll({ keyword: 'a'.repeat(101) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported categories', async () => {
    await expect(service.findAll({ category: 'Travel' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported time filters', async () => {
    await expect(service.findAll({ time: 'next_month' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
