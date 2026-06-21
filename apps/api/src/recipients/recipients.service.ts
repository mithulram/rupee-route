import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@rupeeroute/domain';
import { normalizeIfsc, validateRecipientInput, type RecipientInput } from '@rupeeroute/domain';

@Injectable()
export class RecipientsService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, input: RecipientInput) {
    validateRecipientInput(input);

    const record = await this.prisma.recipient.create({
      data: {
        userId,
        displayName: input.displayName,
        type: input.type,
        accountHolder: input.accountHolder,
        ifsc: input.type === 'bank_account' ? normalizeIfsc(input.ifsc) : null,
        accountNumber: input.type === 'bank_account' ? input.accountNumber : null,
        upiId: input.type === 'upi' ? input.upiId : null,
        validated: true,
      },
    });

    return this.serialize(record);
  }

  async list(userId: string) {
    const records = await this.prisma.recipient.findMany({ where: { userId } });
    return records.map((r) => this.serialize(r));
  }

  async get(userId: string, id: string) {
    const record = await this.prisma.recipient.findFirst({ where: { id, userId } });
    if (!record) throw new NotFoundException('Recipient not found');
    return this.serialize(record);
  }

  private serialize(record: {
    id: string;
    displayName: string;
    type: string;
    accountHolder: string;
    ifsc: string | null;
    accountNumber: string | null;
    upiId: string | null;
    validated: boolean;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      displayName: record.displayName,
      type: record.type,
      accountHolder: record.accountHolder,
      ifsc: record.ifsc,
      accountNumber: record.accountNumber,
      upiId: record.upiId,
      validated: record.validated,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
