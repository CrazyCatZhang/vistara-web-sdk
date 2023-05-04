import ConversationType from "../common/ConversationType";

export class MessageReadPack {
    fromId?: string;
    toId?: string;
    groupId?: string;
    conversationType?: number;
    messageSequence?: number;

    constructor(userId: string, messageData: any, conversationType: ConversationType) {
        this.fromId = userId;
        this.toId = messageData.fromId;
        this.conversationType = conversationType;
        if (conversationType === ConversationType.GroupMessage) {
            this.groupId = messageData.groupId;
        }
        this.messageSequence = messageData.messageSequence;
    }
}