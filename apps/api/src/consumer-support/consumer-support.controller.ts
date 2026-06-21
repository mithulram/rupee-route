import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsumerSupportService } from './consumer-support.service';

class CreateTicketDto {
  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  transferId?: string;
}

@Controller('api/v1/support/tickets')
@UseGuards(JwtAuthGuard)
export class ConsumerSupportController {
  constructor(private readonly supportService: ConsumerSupportService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.supportService.listTickets(req.user.id);
  }

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(
      req.user.id,
      dto.subject,
      dto.description,
      dto.transferId,
    );
  }
}
