import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

class UpdateProfileDto {
  @IsOptional()
  @IsIn(['en', 'de'])
  preferredLanguage?: 'en' | 'de';

  @IsOptional()
  @IsBoolean()
  notificationEmail?: boolean;
}

class PrivacyRequestDto {
  @IsIn(['export', 'delete'])
  type!: 'export' | 'delete';
}

@Controller('api/v1')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('privacy-requests')
  listPrivacy(@Req() req: AuthenticatedRequest) {
    return this.profileService.listPrivacyRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('privacy-requests')
  createPrivacy(@Req() req: AuthenticatedRequest, @Body() dto: PrivacyRequestDto) {
    return this.profileService.createPrivacyRequest(req.user.id, dto.type);
  }
}
