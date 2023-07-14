import { Controller, Get, Post, Body } from '@nestjs/common';
import { WebUserService } from './webuser.service';

@Controller('webuser')
export class WebUserController {

    constructor(private readonly service: WebUserService) { }

    @Get('/get')
    test()
    {
        return "ghost"
    }

    @Post('/get')
    findOne(@Body() c: any) {
        return this.service.findOne(c);
    }
    

    // call this if user open the panel after login.
    @Post('/create_new')
    async createNew(@Body() data: { id: string, webid: number }) {
        return await this.service.createNew(data)
    }

    @Post('/wallet/generate_all')
    async generateAll(@Body() data: { id: string, webid: number }) {
        return await this.service.generateAll(data);
    }

    @Post('/wallet/import_one')
    async importOne(@Body() data: { id: string, webid: number, widx: number, pk: string }) {
        return await this.service.importOne(data);
    }

    @Post('/wallet/import_some')
    async importSome(@Body() data: { id: string, webid: number, pk: string[] }) {
        return await this.service.importSome(data);
    }


    @Post('/wallet/view_one')
    async viewOne(@Body() data: { id: string, webid: number, widx: number }) {
        return await this.service.viewOne(data);
    }

    @Post('/wallet/delete_one')
    async deleteOne(@Body() data: { id: string, webid: number, widx: number }) {
        return await this.service.deleteOne(data);
    }

    @Post('/swapNow')
    async swapNow(@Body() data: { id: string, webid: number, widx: number, token: number, direction: boolean, contract: string, amount: number, gasprice: number, slippage: number }) {
        return await this.service.swapNow(data);
    }

    @Post('/snipeSet')
    async snipeSet(@Body() data: { id: string, webid: number, widx: number, tokenAddress: string, amount: string, gasprice: string, slippage: string, multi: boolean, autobuy: boolean }) {
        return await this.service.snipeSet(data);
    }

    @Post('/mirrorSetOne')
    async mirrorSetOne(@Body() data: { id: string, webid: number, widx: number, mirrorAddress: string, amount: string }) {
        return await this.service.mirrorSetOne(data);
    }

    @Post('/mirrorDeleteAll')
    async mirrorDeleteAll(@Body() data: { id: string, webid: number, widx: number, swap: {} }) {
        return await this.service.mirrorDeleteAll(data);
    }

    @Post('/limitSetOne')
    async limitSetOne(@Body() data: { id: string, webid: number, aidx: number, widx: number, limitAddress: string, amount: string, limitPrice: string }) {
        return await this.service.limitSetOne(data)
    }

    @Post('/limitDeleteAll')
    async limitDeleteAll(@Body() data: { id: string, webid: number }) {
        return await this.service.limitDeleteAll(data)
    }

    @Post('/getLogForOne')
    async getLogForOne(@Body() data: { id: string, webid: number }) {
        return await this.service.getLogForOne(data)
    }

    @Post('/getLogAll')
    async getLogAll(@Body() data: { id: string, webid: number }) {
        return await this.service.getLogAll(data)
    }

    @Post('/logTest')
    logTest(){
        this.service.logTest()
    }









}
