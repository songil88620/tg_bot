import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebUserService } from './webuser.service';
import { WebUserEntity } from './webuser.entity';
import { WebUserController } from './webuser.controller';
import { UserModule } from 'src/user/user.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { SnipeModule } from 'src/snipe/snipe.module';
import { LimitModule } from 'src/limit/limit.module';
import { MirrorModule } from 'src/mirror/mirror.module';
import { LogModule } from 'src/log/log.module';
import { TradeModule } from 'src/trade/trade.module';
import { BridgeModule } from 'src/bridge/bridge.module';
import { TokenscannerModule } from 'src/tokenscanner/tokenscanner.module';
import { DeployerModule } from 'src/tokendeployer/deployer.module';
import { UnitradeModule } from 'src/unitrade/unitrade.module';
import { NotifyModule } from 'src/webnotify/notify.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebUserEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => TradeModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => SnipeModule),
    forwardRef(() => MirrorModule),
    forwardRef(() => LimitModule),
    forwardRef(() => LogModule),
    forwardRef(() => BridgeModule),
    forwardRef(() => TokenscannerModule),
    forwardRef(() => DeployerModule),
    forwardRef(() => UnitradeModule),
    forwardRef(() => NotifyModule)
  ],
  controllers: [WebUserController],
  providers: [WebUserService],
  exports: [WebUserService]
})
export class WebUserModule { }
