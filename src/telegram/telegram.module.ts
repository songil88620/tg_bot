import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from 'src/user/user.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { SnipeModule } from 'src/snipe/snipe.module';
import { LimitModule } from 'src/limit/limit.module';
import { MirrorModule } from 'src/mirror/mirror.module';
import { TradeModule } from 'src/trade/trade.module';
import { LogModule } from 'src/log/log.module';
import { BridgeModule } from 'src/bridge/bridge.module';
import { TokenscannerModule } from 'src/tokenscanner/tokenscanner.module';
import { DeployerModule } from 'src/tokendeployer/deployer.module';
import { UnitradeModule } from 'src/unitrade/unitrade.module';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => SnipeModule),
    forwardRef(() => LimitModule),
    forwardRef(() => MirrorModule),
    forwardRef(() => TradeModule),
    forwardRef(() => LogModule),
    forwardRef(() => BridgeModule),
    forwardRef(() => TokenscannerModule),
    forwardRef(() => DeployerModule),
    forwardRef(() => UnitradeModule),
    forwardRef(() => BotModule)
  ],
  providers: [TelegramService],
  exports: [TelegramService]

})
export class TelegramModule { }
