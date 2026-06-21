import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@rupeeroute/domain';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      countryCode: user.countryCode as 'DE' | 'CH',
      preferredLanguage: user.preferredLanguage as 'en' | 'de',
      notificationEmail: user.notificationEmail,
      kycStatus: user.kycStatus,
    };
  }

  async updateProfile(
    userId: string,
    data: { preferredLanguage?: 'en' | 'de'; notificationEmail?: boolean },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredLanguage: data.preferredLanguage,
        notificationEmail: data.notificationEmail,
      },
    });
    return {
      id: user.id,
      email: user.email,
      countryCode: user.countryCode as 'DE' | 'CH',
      preferredLanguage: user.preferredLanguage as 'en' | 'de',
      notificationEmail: user.notificationEmail,
      kycStatus: user.kycStatus,
    };
  }

  async createPrivacyRequest(userId: string, type: 'export' | 'delete') {
    return this.prisma.privacyRequest.create({
      data: { userId, type, status: 'pending' },
    });
  }

  async listPrivacyRequests(userId: string) {
    const requests = await this.prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }));
  }
}
