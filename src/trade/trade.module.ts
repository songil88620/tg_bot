import { Module, forwardRef } from '@nestjs/common';
import { TradeService } from './trade.service';
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { WebUserModule } from 'src/webuser/webuser.module';
import { LogModule } from 'src/log/log.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeSchema } from './trade.schema';
import { NotifyModule } from 'src/webnotify/notify.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'trade', schema: TradeSchema }]),
        forwardRef(() => TelegramModule),
        forwardRef(() => UserModule),
        forwardRef(() => WebUserModule),
        forwardRef(() => LogModule),
        forwardRef(() => NotifyModule)
    ],
    providers: [TradeService],
    exports: [TradeService]

})
export class TradeModule { }
