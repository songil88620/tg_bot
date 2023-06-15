import { Module, forwardRef } from '@nestjs/common'; 
import { PlatformService } from './platform.service';
import { MongooseModule } from '@nestjs/mongoose'; 
import { PlatformSchema } from './platform.schema';
import { SwapModule } from 'src/swap/swap.module';
import { TelegramModule } from 'src/telegram/telegram.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'platform', schema: PlatformSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => SwapModule)
  ],
  controllers: [],
  providers: [PlatformService],
  exports: [PlatformService]
})
export class PlatformModule { }
