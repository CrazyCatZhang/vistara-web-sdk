export class MessageReceiveAckPack {
    fromId?: string;
    toId?: string;
    messageKey?: number;
    messageSequence?: number;
    messageId?: string;

    constructor(fromId?: string, messageData?: any) {
        this.fromId = fromId;
        this.toId = messageData.fromId;
        this.messageKey = messageData.messageKey;
        this.messageId = messageData.messageId;
        this.messageSequence = messageData.messageSequence;
    }
}