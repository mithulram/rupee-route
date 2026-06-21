import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@rupeeroute/domain';

@Injectable()
export class ConsumerSupportService {
  constructor(private readonly prisma: PrismaClient) {}

  async listTickets(userId: string) {
    const tickets = await this.prisma.customerSupportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => this.serialize(t));
  }

  async createTicket(userId: string, subject: string, description: string, transferId?: string) {
    if (transferId) {
      const transfer = await this.prisma.transfer.findFirst({
        where: { id: transferId, userId },
      });
      if (!transfer) throw new NotFoundException('Transfer not found');
    }

    const ticket = await this.prisma.customerSupportTicket.create({
      data: { userId, subject, description, transferId },
    });
    return this.serialize(ticket);
  }

  private serialize(ticket: {
    id: string;
    subject: string;
    description: string;
    status: string;
    transferId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      transferId: ticket.transferId,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }
}
