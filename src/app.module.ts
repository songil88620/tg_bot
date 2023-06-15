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

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(MONGO_ROOT),
    UserModule,
    TelegramModule,
    SwapModule,
    BotModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
