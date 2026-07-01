import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './user.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
