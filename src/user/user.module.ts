import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';
import { SwapModule } from 'src/swap/swap.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { WebUserModule } from 'src/webuser/webuser.module';
import { TradeModule } from 'src/trade/trade.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'user', schema: UserSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => SwapModule),
    forwardRef(() => WebUserModule),
    forwardRef(() => TradeModule)
  ],
  controllers: [],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule { }
