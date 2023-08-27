import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_ROOT } from './constant';
import { UserModule } from './user/user.module';
import { SwapModule } from './swap/swap.module';
import { BotModule } from './bot/bot.module';
import { SnipeModule } from './snipe/snipe.module';
import { PlatformModule } from './platform/platform.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MirrorModule } from './mirror/mirror.module';
import { LimitModule } from './limit/limit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebUserEntity } from './webuser/webuser.entity';
import { WebUserModule } from './webuser/webuser.module';
import { WebUserController } from './webuser/webuser.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TradeModule } from './trade/trade.module';
import { BridgeModule } from './bridge/bridge.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(MONGO_ROOT),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type:'mysql',
      host:'217.182.207.127',
      port:3306,
      username:'root',
      password:'testuje1',
      database:'term',
      entities:[
        WebUserEntity
      ],
      synchronize:true
    }),
    UserModule,
    PlatformModule,
    TelegramModule,
    SwapModule,
    TradeModule,
    SnipeModule,
    MirrorModule,
    LimitModule,
    WebUserModule,
    BotModule,
    BridgeModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit:2
    })
  ],
  controllers: [AppController, WebUserController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
