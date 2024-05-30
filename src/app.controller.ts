import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TokenlistService } from './tokenlist/tokenlist.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private tokenList: TokenlistService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/tokendata')
  async getLogForOne(@Body() data: { contract: string }) {
    return this.tokenList.getTokenData(data.contract, 'eth')
  }


}
