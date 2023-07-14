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

@Module({
  imports: [
    TypeOrmModule.forFeature([WebUserEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => SnipeModule),
    forwardRef(() => MirrorModule),
    forwardRef(() => LimitModule),
    forwardRef(() => LogModule)
  ],
  controllers: [WebUserController],
  providers: [WebUserService],
  exports: [WebUserService]
})
export class WebUserModule { }
