import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ActivityService } from '../activity/services/activity.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { AuditAction, EntityType, UserRole } from '../../shared/enums';
import { ActivityAction, ActivityEntityType, ActivitySource } from '../activity/enums/activity-action.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
    private activityService: ActivityService,
  ) {}

  async login(loginDto: LoginDto, ip: string): Promise<TokenResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isValid = await this.usersService.validatePassword(user, loginDto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id, ip);
    
    await this.auditLogService.log({
      action: AuditAction.LOGIN,
      entityType: EntityType.USER,
      entityId: user.id,
      userId: user.id,
      details: { ip },
    });

    // Activity log - неблокуюче
    this.activityService.logAsync({
      userId: user.id,
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      action: ActivityAction.LOGIN,
      entityType: ActivityEntityType.USER,
      entityId: user.id,
      context: { ip, source: ActivitySource.WEB },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto): Promise<TokenResponseDto> {
    const existing = await this.usersService.findByEmail(createUserDto.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      ...createUserDto,
      role: UserRole.MANAGER,
    });

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      entityType: EntityType.USER,
      entityId: user.id,
      userId: user.id,
      details: { email: user.email },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.usersService.changePassword(userId, newPassword);
  }

  async validateUser(userId: string): Promise<any> {
    return this.usersService.findById(userId);
  }
}
