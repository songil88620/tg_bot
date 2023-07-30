import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PlatformDocument = Platform & Document;

interface Sniper {
    network: string,
    contract: string,
    autobuy: boolean,
    buyamount: string,
    gasprice: string,
    slippage: string,
    smartslip: boolean
}

@Schema()
export class Platform {  

    @Prop()
    id: string;

    @Prop()
    contracts: string[];  
   
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);

