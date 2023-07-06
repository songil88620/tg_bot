import { Module, forwardRef } from '@nestjs/common';
import { SwapService } from './swap.service';
import { UserModule } from 'src/user/user.module'; 
import { TelegramModule } from 'src/telegram/telegram.module'; 
import { WebUserModule } from 'src/webuser/webuser.module';

@Module({
  imports: [   
    forwardRef(()=>TelegramModule),
    forwardRef(()=>UserModule),
    forwardRef(()=>WebUserModule)
  ],
  providers: [SwapService],
  exports:[SwapService]

})
export class SwapModule { }
