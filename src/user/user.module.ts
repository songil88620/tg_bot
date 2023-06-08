import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service'; 
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'user', schema: UserSchema }]),
  ],
  controllers: [],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule { }
