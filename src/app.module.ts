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

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(MONGO_ROOT),
    ScheduleModule.forRoot(),
    UserModule,
    PlatformModule,
    TelegramModule,
    SwapModule,
    SnipeModule,
    BotModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
