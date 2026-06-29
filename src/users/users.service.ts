import { Injectable } from '@nestjs/common';
import { UsersRepository } from './user.repository';
import { CreateUserDto } from './create.users.dto';
import * as bcrypt from 'bcrypt';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: number) {
    return this.usersRepository.findById(id);
  }

  async create(user: CreateUserDto) {
    console.log('Creating user:', user);

    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);

    const _user: IUser = {
      full_name: user.full_name,
      email: user.email,
      password_hash: user.password,
      created_at: new Date(),
      is_deleted: false,
    };

    return this.usersRepository.create(_user);
  }

  async remove(id: number) {
    return this.usersRepository.delete(id);
  }
}
