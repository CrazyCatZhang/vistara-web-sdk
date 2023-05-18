import ConversationType from "../common/ConversationType";
import {MessagePack} from "../pack/MessagePack";

// 创建文本消息
let createTextMessage = function (appId: number, from: string, to: string, text: string, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildTextMessagePack(from, to, text);
    return messagePack;
}

// 创建图片消息
let createImageMessage = function (appId: number, from: string, to: string, image: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildImageMessagePack(from, to, image);
    return messagePack;
}

// 创建语音消息
let createAudioMessage = function (appId: number, from: string, to: string, audio: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildAudioMessagePack(from, to, audio);
    return messagePack;
}

// 创建视频消息
let createVideoMessage = function (appId: number, from: string, to: string, video: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildVideoMessagePack(from, to, video);
    return messagePack;
}

// 创建表情消息
let createEmojiMessage = function (appId: number, from: string, to: string, emoji: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildEmojiMessagePack(from, to, emoji);
    return messagePack;
}

// 创建文件消息
let createFileMessage = function (appId: number, from: string, to: string, file: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildFileMessagePack(from, to, file);
    return messagePack;
}

// 创建位置消息
let createLocationMessage = function (appId: number, from: string, to: string, location: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildLocationMessagePack(from, to, location);
    return messagePack;
}

// 创建自定义消息
let createCustomerMessage = function (appId: number, from: string, to: string, type: number, custom: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildCustomerMessagePack(from, to, type, custom);
    return messagePack;
}

//创建请求视频通话消息
let createVideoCallMessage = function (appId: number, from: string, to: string, type: number, msg: any, conversationType: ConversationType) {
    let messagePack = new MessagePack(appId, conversationType);
    messagePack.buildCustomerMessagePack(from, to, type, msg);
    return messagePack;
}

export {
    createTextMessage,
    createImageMessage,
    createAudioMessage,
    createVideoMessage,
    createEmojiMessage,
    createFileMessage,
    createLocationMessage,
    createCustomerMessage,
    createVideoCallMessage
}

