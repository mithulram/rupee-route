import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RequirePermission } from './admin-permissions.decorator';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { AdminService } from './admin.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import type { AdminPrincipal, RequestWithAdmin } from '../common/admin.types';

@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly adminService: AdminService,
  ) {}

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }, @Req() req: { ip?: string }) {
    return this.adminAuth.login(body.email, body.password, req.ip);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  me(@Req() req: RequestWithAdmin) {
    const admin = req.admin;
    if (!admin) throw new UnauthorizedException();
    return this.adminAuth.getMe(admin.id);
  }

  @Get('transfers')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'compliance', 'finance', 'administrator', 'auditor')
  listTransfers(
    @Query('state') state?: string,
    @Query('userId') userId?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listTransfers({ state, userId, q });
  }

  @Get('transfers/:id')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'compliance', 'finance', 'administrator', 'auditor')
  getTransfer(@Param('id') id: string) {
    return this.adminService.getTransfer(id);
  }

  @Get('users/:id')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'compliance', 'finance', 'administrator', 'auditor')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Get('audit-events')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('administrator', 'auditor', 'compliance', 'finance')
  listAuditEvents(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.listAuditEvents({ resourceType, resourceId, from, to });
  }

  @Get('audit-events/export')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('auditor', 'administrator')
  @RequirePermission('audit:export')
  @Header('Content-Type', 'text/csv')
  exportAuditEvents(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.exportAuditEvents({ resourceType, resourceId, from, to });
  }

  @Get('tickets')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'administrator')
  listTickets(@Query('status') status?: string, @Query('transferId') transferId?: string) {
    return this.adminService.listTickets({ status, transferId });
  }

  @Get('tickets/:id')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'administrator')
  getTicket(@Param('id') id: string) {
    return this.adminService.getTicket(id);
  }

  @Post('tickets')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'administrator')
  createTicket(
    @Req() req: RequestWithAdmin,
    @Body() body: { subject: string; description: string; transferId?: string; priority?: string },
  ) {
    return this.adminService.createTicket(req.admin as AdminPrincipal, body);
  }

  @Patch('tickets/:id')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('support', 'administrator')
  updateTicket(
    @Req() req: RequestWithAdmin,
    @Param('id') id: string,
    @Body() body: { status?: string; priority?: string; assigneeEmail?: string },
  ) {
    return this.adminService.updateTicket(req.admin as AdminPrincipal, id, body);
  }

  @Get('compliance/reviews')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('compliance', 'administrator')
  async listComplianceReviews() {
    await this.adminService.ensureComplianceQueueFromUsers();
    return this.adminService.listComplianceReviews();
  }

  @Post('compliance/reviews/:id/decide')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('compliance', 'administrator')
  @RequirePermission('compliance:decide')
  decideComplianceReview(
    @Req() req: RequestWithAdmin,
    @Param('id') id: string,
    @Body() body: { decision: 'approve' | 'decline' },
  ) {
    return this.adminService.decideComplianceReview(req.admin as AdminPrincipal, id, body.decision);
  }

  @Get('reconciliation/runs')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('reconciliation:view')
  listReconciliationRuns() {
    return this.adminService.listReconciliationRuns();
  }

  @Post('reconciliation/runs')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('reconciliation:view')
  triggerReconciliationRun(@Req() req: RequestWithAdmin) {
    return this.adminService.triggerReconciliationRun(req.admin as AdminPrincipal);
  }

  @Get('reconciliation/exceptions')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('reconciliation:view')
  listReconciliationExceptions() {
    return this.adminService.listReconciliationExceptions();
  }

  @Get('webhook-failures')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('finance', 'administrator')
  listWebhookFailures() {
    return this.adminService.listWebhookFailures();
  }

  @Post('webhook-failures/:id/retry')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('finance', 'administrator')
  retryWebhookFailure(@Req() req: RequestWithAdmin, @Param('id') id: string) {
    return this.adminService.retryWebhookFailure(req.admin as AdminPrincipal, id);
  }

  @Get('refund-proposals')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('reconciliation:view')
  listRefundProposals() {
    return this.adminService.listRefundProposals();
  }

  @Post('refund-proposals')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('refund:propose')
  createRefundProposal(
    @Req() req: RequestWithAdmin,
    @Body() body: { transferId: string; amount: string; reason: string },
  ) {
    return this.adminService.createRefundProposal(req.admin as AdminPrincipal, body);
  }

  @Post('refund-proposals/:id/approve')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('finance', 'administrator')
  @RequirePermission('refund:approve')
  approveRefundProposal(@Req() req: RequestWithAdmin, @Param('id') id: string) {
    return this.adminService.approveRefundProposal(req.admin as AdminPrincipal, id);
  }

  @Get('providers/status')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('administrator', 'finance')
  getProviderStatus() {
    return this.adminService.getProviderStatus();
  }

  @Get('feature-flags')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('administrator')
  @RequirePermission('flags:manage')
  listFeatureFlags() {
    return this.adminService.listFeatureFlags();
  }

  @Patch('feature-flags')
  @UseGuards(AdminJwtAuthGuard, RolesGuard, AdminPermissionsGuard)
  @Roles('administrator')
  @RequirePermission('flags:manage')
  updateFeatureFlag(@Req() req: RequestWithAdmin, @Body() body: { key: string; enabled: boolean }) {
    return this.adminService.updateFeatureFlag(req.admin as AdminPrincipal, body.key, body.enabled);
  }

  @Get('privacy-requests')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('compliance', 'administrator')
  listPrivacyRequests() {
    return this.adminService.listPrivacyRequests();
  }

  @Post('privacy-requests')
  @UseGuards(AdminJwtAuthGuard, RolesGuard)
  @Roles('compliance', 'administrator')
  createPrivacyRequest(
    @Req() req: RequestWithAdmin,
    @Body() body: { userId: string; type: 'export' | 'delete' },
  ) {
    return this.adminService.createPrivacyRequest(req.admin as AdminPrincipal, body);
  }
}
