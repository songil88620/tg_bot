import { Module, forwardRef } from '@nestjs/common'; 
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SwapModule } from 'src/swap/swap.module'; 
import { BotModule } from 'src/bot/bot.module'; 
import { MongooseModule } from '@nestjs/mongoose';
import { TokenlistSchema } from './tokenlist.schema';
import { TokenlistService } from './tokenlist.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'tokenlist', schema: TokenlistSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule), 
    forwardRef(() => BotModule)
  ],
  providers: [TokenlistService],
  exports: [TokenlistService]
})
export class TokenlistModule { }
