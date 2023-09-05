import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwapModule } from 'src/swap/swap.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { UnitradeService } from './unitrade.service';
import { UnitradeSchema } from './unitrade.schema';
import { BotModule } from 'src/bot/bot.module'; 
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'unitrade', schema: UnitradeSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => SwapModule),
    forwardRef(() => BotModule),
    forwardRef(() => UserModule)
  ],
  controllers: [],
  providers: [UnitradeService],
  exports: [UnitradeService]
})
export class UnitradeModule { }
