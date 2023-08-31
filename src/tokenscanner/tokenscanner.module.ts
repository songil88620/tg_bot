import { Module, forwardRef } from '@nestjs/common'; 
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { BotModule } from 'src/bot/bot.module';
import { TokenscannerService } from './tokenscanner.service';
import { TokenscannerSchema } from './tokenscanner.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'tokenscanner', schema: TokenscannerSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => BotModule)
  ],
  providers: [TokenscannerService],
  exports: [TokenscannerService]

})
export class TokenscannerModule { }
