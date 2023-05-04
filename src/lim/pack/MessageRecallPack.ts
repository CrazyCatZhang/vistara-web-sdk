import ConversationType from "../common/ConversationType";

export class MessageRecallPack {
    fromId?: string;
    toId?: string;
    messageKey?: number;
    messageTime?: number;
    conversationType?: number;
    messageSequence?: number;

    constructor(fromId?: string, messageData?: any, conversationType?: ConversationType) {
        this.fromId = fromId;
        this.toId = messageData.toId;
        this.messageKey = messageData.messageKey;
        this.messageTime = messageData.messageTime;
        this.messageSequence = messageData.messageSequence;
        this.conversationType = conversationType;
    }
}