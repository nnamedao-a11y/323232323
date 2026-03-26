import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() data: any, @Request() req) {
    return this.tasksService.create(data, req.user.id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.tasksService.findAll(query);
  }

  @Get('my')
  async getMyTasks(@Request() req, @Query() query: any) {
    return this.tasksService.findAll({ ...query, assignedTo: req.user.id });
  }

  @Get('overdue')
  async getOverdue() {
    return this.tasksService.getOverdue();
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.tasksService.getStats(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }
}
