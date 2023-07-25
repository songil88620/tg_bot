import { Module, forwardRef } from '@nestjs/common';
import { LimitService } from './limit.service';
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    forwardRef(() => TelegramModule),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => BotModule)
  ],
  providers: [LimitService],
  exports: [LimitService]

})
export class LimitModule { }
