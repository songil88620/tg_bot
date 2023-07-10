import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from 'src/user/user.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { SnipeModule } from 'src/snipe/snipe.module';
import { LimitModule } from 'src/limit/limit.module';
import { MirrorModule } from 'src/mirror/mirror.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => SnipeModule),
    forwardRef(() => LimitModule),
    forwardRef(() => MirrorModule)
  ],
  providers: [TelegramService],
  exports: [TelegramService]

})
export class TelegramModule { }
