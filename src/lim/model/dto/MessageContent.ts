import {Long} from 'long';

export class MessageContent {
    messageKey: Long;
    appId?: number;
    messageId?: string;
    fromId?: string;
    toId?: string;
    messageRandom?: number;
    messageTime?: number;
    messageBody?: string;

    constructor(messageKey: Long) {
        this.messageKey = messageKey;
    }
}