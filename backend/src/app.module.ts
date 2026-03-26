import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DealsModule } from './modules/deals/deals.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { TagsModule } from './modules/tags/tags.module';
import { StaffModule } from './modules/staff/staff.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AutomationModule } from './modules/automation/automation.module';
import { CallCenterModule } from './modules/call-center/call-center.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { ExportModule } from './modules/export/export.module';
import { LeadRoutingModule } from './modules/lead-routing/lead-routing.module';
import { FilesModule } from './modules/files/files.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
        dbName: configService.get<string>('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
    BootstrapModule,
    QueueModule,
    AuthModule,
    UsersModule,
    RolesModule,
    LeadsModule,
    CustomersModule,
    DealsModule,
    DepositsModule,
    TasksModule,
    NotesModule,
    TagsModule,
    StaffModule,
    NotificationsModule,
    DashboardModule,
    AuditLogModule,
    SettingsModule,
    RemindersModule,
    AutomationModule,
    CallCenterModule,
    CommunicationsModule,
    ExportModule,
    LeadRoutingModule,
    FilesModule,
    DocumentsModule,
  ],
})
export class AppModule {}
