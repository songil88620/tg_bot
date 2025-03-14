import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TradeDocument = Trade & Document; 
 
@Schema()
export class Trade {  

    @Prop()
    owner: string;

    @Prop()
    address: number;

    @Prop()
    pairIndex: number;

    @Prop()
    index: number;

    @Prop()
    leverage: number;

    @Prop()
    slippage: string;

    @Prop()
    stoploss: number;

    @Prop()
    profit: number;

    @Prop()
    size: number;

    @Prop()
    longshort: boolean;

    @Prop()
    startprice: number;

    @Prop()
    endprice: number;

    @Prop()
    end: boolean;

    @Prop()
    trader: string;

    @Prop()
    created: number;
       
}

export const TradeSchema = SchemaFactory.createForClass(Trade);

