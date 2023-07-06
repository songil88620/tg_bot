import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebUserService } from './webuser.service';
import { WebUserEntity } from './webuser.entity';
import { WebUserController } from './webuser.controller';
import { UserModule } from 'src/user/user.module';
import { SwapModule } from 'src/swap/swap.module';
import { PlatformModule } from 'src/platform/platform.module';
import { SnipeModule } from 'src/snipe/snipe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebUserEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => SwapModule),
    forwardRef(() => PlatformModule),
    forwardRef(() => SnipeModule)
  ],
  controllers: [WebUserController],
  providers: [WebUserService],
  exports: [WebUserService]
})
export class WebUserModule { }
