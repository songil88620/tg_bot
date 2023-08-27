import { Module, forwardRef } from '@nestjs/common'; 
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { BotModule } from 'src/bot/bot.module';
import { BridgeService } from './bridge.service';

@Module({
  imports: [
    forwardRef(() => TelegramModule),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule), 
  ],
  providers: [BridgeService],
  exports: [BridgeService]

})
export class BridgeModule { }
