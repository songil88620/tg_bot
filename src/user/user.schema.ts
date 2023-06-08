import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User {

    @Prop()
    id: number;

    @Prop()
    username: string;

    @Prop()
    wallet: {
        address: string;
        key: string;
    }[]

    @Prop()
    detail: string;

    @Prop()
    other: string[]
}

export const UserSchema = SchemaFactory.createForClass(User);

