import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { WebUserService } from './webuser.service';
import { PairsTrade } from 'src/abi/constants';

@Controller('webuser')
export class WebUserController {

    constructor(
        private readonly service: WebUserService
    ) { }

    @Post('/hi')
    hi() {
        console.log(">>here")
        return "hi"
    }

    @Post('/get')
    findOne(@Body() c: any) {
        return this.service.findOne(c);
    }

    @Get('/getpair')
    async getPair() {
        return PairsTrade;
    }

    // call this if user open the panel after login.
    @Post('/create_new')
    async createNew(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.createNew(data, csrf)
    }

    @Post('/wallet/generate_all')
    async generateAll(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.generateAll(data, csrf);
    }

    @Post('/wallet/import_one')
    async importOne(@Body() data: { id: string, webid: number, widx: number, pk: string }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.importOne(data, csrf);
    }

    @Post('/wallet/import_some')
    async importSome(@Body() data: { id: string, webid: number, pk: string[] }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.importSome(data, csrf);
    }

    @Post('/wallet/view_one')
    async viewOne(@Body() data: { id: string, webid: number, widx: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.viewOne(data, csrf);
    }

    @Post('/wallet/delete_one')
    async deleteOne(@Body() data: { id: string, webid: number, widx: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.deleteOne(data, csrf);
    }

    @Post('/referral')
    async updateReferral(@Body() data: { id: string, webid: number, referral: string }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.updateReferral(data, csrf);
    }

    @Post('/getrefferals')
    async getRefferals(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.getRefferals(data, csrf)
    }

    @Post('/swapNow')
    async swapNow(@Body() data: { id: string, webid: number, widx: number, token: number, direction: boolean, contract: string, amount: number, gasprice: number, slippage: number, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.swapNow(data, csrf);
    }

    @Post('/transferNow')
    async transferNow(@Body() data: { id: string, webid: number, widx: number, token: number, contract: string, amount: number, receiver: string, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.transferNow(data, csrf);
    }

    @Post('/snipeSet')
    async snipeSet(@Body() data: { id: string, webid: number, widx: number, tokenAddress: string, amount: string, gasprice: string, slippage: string, multi: boolean, autobuy: boolean, sellrate: number, autosell: boolean, blockwait: number, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.snipeSet(data, csrf);
    }

    @Post('/mirrorSetOne')
    async mirrorSetOne(@Body() data: { id: string, webid: number, widx: number, mirrorAddress: string, amount: string, gasprice: string, slippage: string, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.mirrorSetOne(data, csrf);
    }

    @Post('/mirrorDeleteAll')
    async mirrorDeleteAll(@Body() data: { id: string, webid: number, widx: number, swap: {} }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.mirrorDeleteAll(data, csrf);
    }

    @Post('/limitSetOne')
    async limitSetOne(@Body() data: { id: string, webid: number, aidx: number, widx: number, limitAddress: string, amount: string, limitPrice: string, gasprice: string, slippage: string, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.limitSetOne(data, csrf)
    }

    @Post('/limitDeleteAll')
    async limitDeleteAll(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.limitDeleteAll(data, csrf)
    }

    @Post('/getLogForOne')
    async getLogForOne(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.getLogForOne(data, csrf)
    }

    @Post('/getLogAll')
    async getLogAll(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.getLogAll(data, csrf)
    }

    @Post('/tradeNow')
    async tradeNow(@Body() data: { id: string, webid: number, widx: number, pairidx: number, longshort: boolean, leverage: number, profit: number, size: number, slippage: number, stoploss: number, private: boolean }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.tradeNow(data, csrf);
    }

    @Post('/closeTrade')
    async closeTrade(@Body() data: { id: string, webid: number, widx: number, pairIndex: number, index: number, pid: string }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.closeTrade(data, csrf)
    }

    @Post('/getTrade')
    async getTrade(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.getTradeForOne(data, csrf);
    }

    @Post('/getBridgeEstimate')
    async getBridgeEstimate(@Body() data: { id: string, webid: number, fromChain: string, toChain: string, amount: string, token: string, wid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.getBridgeEstimate(data, csrf);
    }

    @Post('/approveAndSend')
    async approveAndSend(@Body() data: { id: string, webid: number, fromChain: string, toChain: string, amount: string, token: string, wid: number, receiver: string }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.approveAndSend(data, csrf);
    }

    @Post('/autotradeset')
    async autotradeset(@Body() data: { id: string, webid: number, liqudity: number, balance: number, token: string, amount: number, sellat: number, auto: boolean, wallet: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.autotradeset(data, csrf);
    }

    @Post('/gettokenlist')
    async gettokenlist(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.gettokenlist(data, csrf);
    }

    @Post('/deploynewtoken')
    async deploynewtoken(@Body() data: { id: string, webid: number, name: string, supply: number, buytax: number, selltax: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.deploynewtoken(data, csrf);
    }

    @Get('/getpairtrade')
    async getpairtrade() {
        return await this.service.getPairList()
    }

    @Post('/getunitrade')
    async getunitrade(@Body() data: { id: string, webid: number }, @Headers() header: any) {
        const csrf = header['x-csrf-token'];
        return await this.service.gettradehistoryForWeb(data, csrf)
    }

    @Post('/logTest')
    logTest() {
        this.service.logTest()
    }


}
