import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [TelegramService],

})
export class TelegramModule { }
