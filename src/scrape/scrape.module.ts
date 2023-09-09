import { Module, forwardRef } from '@nestjs/common'; 
import { UserModule } from 'src/user/user.module'; 
import { ScrapeService } from './scrape.service';
import { BotModule } from 'src/bot/bot.module';
import { SwapModule } from 'src/swap/swap.module';

@Module({
  imports: [
    forwardRef(() => UserModule),  
    forwardRef(() => BotModule),
    forwardRef(() => SwapModule)
  ],
  providers: [ScrapeService],
  exports: [ScrapeService]

})
export class ScrapeModule { }
