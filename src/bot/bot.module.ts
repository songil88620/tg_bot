import { Module, forwardRef } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserModule } from 'src/user/user.module';
import { PlatformModule } from 'src/platform/platform.module';

@Module({
  imports: [
    forwardRef(()=>UserModule),
    forwardRef(()=>PlatformModule) 
  ],
  providers: [BotService],
  exports:[BotService]
})
export class BotModule { }
