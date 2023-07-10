import { Module, forwardRef } from '@nestjs/common';
import { SwapService } from './swap.service';
import { UserModule } from 'src/user/user.module'; 
import { TelegramModule } from 'src/telegram/telegram.module'; 
import { WebUserModule } from 'src/webuser/webuser.module';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [   
    forwardRef(()=>TelegramModule),
    forwardRef(()=>UserModule),
    forwardRef(()=>WebUserModule),
    forwardRef(()=>LogModule)
  ],
  providers: [SwapService],
  exports:[SwapService]

})
export class SwapModule { }
