import Beans from '../common/utils';
import ConversationType from "../common/ConversationType";

export class MessagePack {
    appId: number;
    messageId: string;
    fromId?: string;
    toId?: string;
    groupId?: string;
    messageRandom?: number;
    messageTime?: number;
    messageBody?: string;
    conversationType?: number;

    constructor(appId: number, conversationType: number) {
        this.messageId = Beans.uuid();
        this.appId = appId;
        this.messageRandom = this.RangeInteger(0, 10000);
        this.messageTime = Date.parse(new Date().toString());
        this.conversationType = conversationType;
    }

    RangeInteger(min: number, max: number) {
        const range = max - min
        const value = Math.floor(Math.random() * range) + min
        return value
    }

    // 创建文本消息
    buildTextMessagePack(fromId: string, toId: string, text: string) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 1, content: text}
        this.messageBody = Beans.json(body);
    }

    // 创建图片消息
    buildImageMessagePack(fromId: string, toId: string, image: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 2, content: image}
        this.messageBody = Beans.json(body);
    }

    // 创建语音消息
    buildAudioMessagePack(fromId: string, toId: string, audio: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 3, content: audio}
        this.messageBody = Beans.json(body);
    }

    // 创建视频消息
    buildVideoMessagePack(fromId: string, toId: string, video: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 4, content: video}
        this.messageBody = Beans.json(body);
    }

    // 创建表情消息
    buildEmojiMessagePack(fromId: string, toId: string, emoji: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 5, content: emoji}
        this.messageBody = Beans.json(body);
    }

    // 创建文件消息
    buildFileMessagePack(fromId: string, toId: string, file: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 6, content: file}
        this.messageBody = Beans.json(body);
    }

    // 创建位置消息
    buildLocationMessagePack(fromId: string, toId: string, location: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: 7, content: location}
        this.messageBody = Beans.json(body);
    }

    // 创建自定义消息
    buildCustomerMessagePack(fromId: string, toId: string, type: number, obj: any) {
        this.fromId = fromId;
        if (this.conversationType === ConversationType.P2PMessage) {
            this.toId = toId;
        } else {
            this.groupId = toId;
        }
        let body = {type: type, content: obj}
        this.messageBody = Beans.json(body);
    }
}