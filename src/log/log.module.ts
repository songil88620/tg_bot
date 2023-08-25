import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwapModule } from 'src/swap/swap.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { LogSchema } from './log.schema';
import { LogService } from './log.service';
import { TradeModule } from 'src/trade/trade.module';
import { UserModule } from 'src/user/user.module';


@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'log', schema: LogSchema }]),
        forwardRef(() => TelegramModule),
        forwardRef(() => SwapModule),
        forwardRef(()=>TradeModule),
        forwardRef(()=> UserModule),
    ],
    controllers: [],
    providers: [LogService],
    exports: [LogService]
})
export class LogModule { }
