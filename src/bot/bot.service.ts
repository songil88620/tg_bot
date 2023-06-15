import { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';



@Injectable()
export class BotService implements OnModuleInit {


    constructor(
        private userService: UserService
    ) {

    }

    async onModuleInit() {

    }




}
