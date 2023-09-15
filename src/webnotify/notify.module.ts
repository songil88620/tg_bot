import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwapModule } from 'src/swap/swap.module';  
import { TradeModule } from 'src/trade/trade.module';
import { UserModule } from 'src/user/user.module';
import { PlatformModule } from 'src/platform/platform.module';
import { NotifySchema } from './notify.schema';
import { NotifyService } from './notify.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'notify', schema: NotifySchema }]), 
        forwardRef(() => SwapModule),
        forwardRef(() => TradeModule),
        forwardRef(() => UserModule),
        forwardRef(() => PlatformModule)
    ],
    controllers: [],
    providers: [NotifyService],
    exports: [NotifyService]
})
export class NotifyModule { }
