import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from 'src/user/user.module';
import { SwapModule } from 'src/swap/swap.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule)
  ],
  providers: [TelegramService],
  exports:[TelegramService]

})
export class TelegramModule { }
