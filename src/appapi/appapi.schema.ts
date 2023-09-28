import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AppUserDocument = AppUser & Document;

@Schema()
export class AppUser {

    @Prop()
    id: string;

    @Prop()
    email: string;

    @Prop()
    pass: string;

    @Prop()
    avatar: string;

    @Prop()
    authtoken: string;

    @Prop()
    created: string;
}

export const AppUserSchema = SchemaFactory.createForClass(AppUser);

