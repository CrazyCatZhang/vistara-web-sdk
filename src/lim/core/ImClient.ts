import log from "../log/Logger";
import ByteBuffer from '../codec/ByteBuffer';
import {LoginPack} from '../pack/LoginPack';
import WebToolkit from '../common/WebToolkit';
import {ICloseEvent, w3cwebsocket} from 'websocket';
import {RequestBase} from '../model/RequestBase';
import {RequestParams} from '../model/RequestParams';
import HttpApi from './HttpApi';
import Beans from '../common/utils';
import {
    ConversationEventCommand,
    FriendshipEventCommand,
    GroupEventCommand,
    MessageCommand,
    SystemCommand,
    UserEventCommand
} from '../common/Command';
import {
    createAudioMessage, createCustomerMessage,
    createEmojiMessage, createFileMessage,
    createImageMessage, createLocationMessage,
    createTextMessage,
    createVideoMessage
} from '../utils/CreateMessage'
import ConversationType from "../common/ConversationType";

const loginTimeout = 10 * 1000 // 10 seconds
const heartbeatInterval = 10 * 1000 // seconds
let firstMonitorSocket: boolean = false;// 第一次监听socket

export enum State {
    INIT,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    CLOSEING,
    CLOSED,
}

enum TimeUnit {
    Second = 1000,
    Millisecond = 1,
}

export let sleep = async (second: number, Unit: TimeUnit = TimeUnit.Second): Promise<void> => {
    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve()
        }, second * Unit)
    })
}

export interface IListener {
    onLogin(userId: string): void; // 登录成功事件
    onSocketConnectEvent(url: string, data: any): void; // socket 连接事件
    onSocketErrorEvent(e: any): void;// 异常回调
    onSocketReConnectEvent(): void;// 重连事件
    onSocketReConnectSuccessEvent(): void;// 重连事件
    onSocketCloseEvent(): void;//连接关闭事件
    onP2PMessage(e: any): void;//收到单聊消息事件
    onTestMessage(e: any): void;//收到消息事件 测试用
    onGroupMessage(e: any): void;// 收到群聊消息时间
    onMessageAck(e: any): void;// 单聊消息发送成功ACK
    onMessageReceiveAck(e: any): void;// 消息接收ACK
    onMessageReadedNotify(e: any): void;// 消息已读通知发送给同步端
    onMessageReadedReceipt(e: any): void;// 消息已读回执
    onMessageRecallNotify(e: any): void;// 消息撤回通知
    onMessageRecallAck(e: any): void;// 消息撤回ACK
    onAddFriend(e: any): void;// 添加好友通知
    onUpdateFriend(e: any): void;// 更新好友通知
    onDeleteFriend(e: any): void;// 删除好友通知
    onFriendRequest(e: any): void;// 好友申请通知
    onReadFriendRequest(e: any): void;// 好友申请已读通知
    onApproveFriendRequest(e: any): void;// 审批好友申请通知
    onBlackFriend(e: any): void;// 拉黑好友通知
    onDeleteBlackFriend(e: any): void;// 删除拉黑好友通知
    onAddFriendGroup(e: any): void;// 添加好友分组通知
    onDeleteFriendGroup(e: any): void;// 删除好友分组通知
    onAddFriendGroupMember(e: any): void;// 添加好友分组成员通知
    onDeleteFriendGroupMember(e: any): void;// 删除好友分组成员通知
    onDeleteAllFriend(e: any): void;// 删除所有好友通知
    onJoinGroup(e: any): void;// 申请入群通知
    onAddGroupMember(e: any): void;// 添加群成员通知
    onCreateGroup(e: any): void;// 创建群组通知
    onUpdateGroup(e: any): void;// 更新群组通知
    onExitGroup(e: any): void;// 退出群组通知
    onUpdateGroupMember(e: any): void;// 修改群成员通知
    onDeleteGroupMember(e: any): void;// 删除群成员通知
    onDestroyGroup(e: any): void;// 解散群通知
    onTransferGroup(e: any): void;// 转让群通知
    onMuteGroup(e: any): void;// 禁言群通知
    onMuteGroupMember(e: any): void;// 禁言群成员通知
    onApproveGroupRequest(e: any): void;// 审批群申请通知
    onReadGroupRequest(e: any): void;// 已读群申请通知
    onGroupMessageReadedNotify(e: any): void;// 群聊消息已读通知
    onGroupMessageReadedReceipt(e: any): void;// 群聊消息已读回执
    onGroupMessageAck(e: any): void;// 群聊消息ACK
    onUserModify(e: any): void;// 用户信息变更通知
    onUserOnlineStatusChangeNotify(e: any): void;// 用户在线状态更改通知
    onUserOnlineStatusChangeNotifySync(e: any): void;// 用户在线状态更改同步通知
    onUserCustomStatusChangeNotify(e: any): void;// 用户自身在线状态更改通知
    onConversationDelete(e: any): void;// 删除会话通知
    onConversationUpdate(e: any): void;// 更新会话通知
    // onOfflineMessage(data):void; // 拉取到离线消息事件
}

export class ImClient {

    url: string = ""
    userId!: string
    version: number = 1
    clientType: number = 1
    imei!: string;
    listeners: IListener | any = null;
    appId!: number
    userSign!: string;
    imeiLength?: number
    state = State.INIT
    // lastOfflineMessageSequence: number = 0;
    // offlineMessageList: Array<any> = new Array<any>()
    httpUrl: string = "http://127.0.0.1:8000"

    private conn?: w3cwebsocket

    constructor() {

    }

    public getRequestBase(): RequestBase {
        return new RequestBase(this.appId, this.clientType, this.imei);
    }

    public isInit(): boolean {
        return this.state == State.CONNECTED;
    }

    public getRequestParams(): RequestParams {
        return new RequestParams(this.appId, this.userId, this.userSign);
    }

    public async init(appId: number, userId: string, userSign: string, listeners: any, callback: (sdk: ImClient) => void) {
        let self = this;
        self.appId = appId;
        self.listeners = listeners
        self.imei = WebToolkit.getDeviceInfo().system;
        self.imeiLength = getLen(self.imei);
        self.userId = userId;
        this.userSign = userSign
        this.imeiLength = self.imeiLength;
        if (Beans.isEmpty(this.url)) {
            log.info("获取im地址")
            let api = new HttpApi(this.httpUrl);
            let resp = await api.call("/user/login", {}, {
                clientType: this.clientType,
                appId: this.appId,
                userId: this.userId
            })
            // console.log(resp)
            if (resp.isFailed()) {
                log.info("登录失败：获取im地址失败")
                return;
            }
            let ip = resp.data.ip;
            let port = resp.data.port;
            this.url = "ws://" + ip + ":" + port + "/ws";
        }

        let req = new LoginPack(self.appId, self.userId, 1);
        let {success, err, conn} = await limLogin(self.url, req, self);
        if (success) {
            if (!firstMonitorSocket) {
                firstMonitorSocket = true;
            }
            //登录成功以后操作
            conn.onerror = (error) => {
                log.info("websocket error: ", error)
                // 加入socket 连接事件
                if (typeof imClient.listeners.onSocketErrorEvent === 'function') {
                    imClient.listeners.onSocketErrorEvent(error);
                }
                //异步方法，自动重连
                this.errorHandler(error, req)
            }

            conn.onclose = (e: ICloseEvent) => {
                log.info("event[onclose] fired")
                if (self.state == State.CLOSEING) {
                    this.onclose("logout")
                    return
                }
                // socket断开事件 连接事件
                if (typeof imClient.listeners.onSocketCloseEvent === 'function') {
                    imClient.listeners.onSocketCloseEvent();
                }
                // 异步方法 自动重连
                this.errorHandler(new Error(e.reason), req)
            }

            conn.onmessage = (evt) => {
                let bytebuf = new ByteBuffer(evt.data);
                let byteBuffer = bytebuf.int32().int32().unpack();

                let command = byteBuffer[0];//解析command
                let bodyLen = byteBuffer[1];//解析bodylen
                let unpack = bytebuf.vstring(null, bodyLen).unpack();//解析出字符串
                let msgBody = unpack[2];
                console.log("sdk收到服务端数据：" + msgBody)

                if (command === MessageCommand.MSG_P2P) {
                    //单聊消息收发
                    if (typeof imClient.listeners.onP2PMessage === 'function') {
                        imClient.listeners.onP2PMessage(msgBody);
                    }
                } else if (command === MessageCommand.MSG_ACK) {
                    //单聊消息发送成功ACK
                    if (typeof imClient.listeners.onMessageAck === 'function') {
                        imClient.listeners.onMessageAck(msgBody);
                    }
                } else if (command === MessageCommand.MSG_RECEIVE_ACK) {
                    // 消息接收成功ACK
                    if (typeof imClient.listeners.onMessageReceiveAck === 'function') {
                        imClient.listeners.onMessageReceiveAck(msgBody)
                    }
                } else if (command === MessageCommand.MSG_READED_NOTIFY) {
                    // 消息已读通知给同步端
                    if (typeof imClient.listeners.onMessageReadedNotify === 'function') {
                        imClient.listeners.onMessageReadedNotify(msgBody)
                    }
                } else if (command === MessageCommand.MSG_READED_RECEIPT) {
                    // 消息已读回执
                    if (typeof imClient.listeners.onMessageReadedReceipt === 'function') {
                        imClient.listeners.onMessageReadedReceipt(msgBody)
                    }
                } else if (command === MessageCommand.MSG_RECALL_NOTIFY) {
                    // 消息撤回通知
                    if (typeof imClient.listeners.onMessageRecallNotify === 'function') {
                        imClient.listeners.onMessageRecallNotify(msgBody)
                    }
                } else if (command === MessageCommand.MSG_RECALL_ACK) {
                    // 消息撤回ACK
                    if (typeof imClient.listeners.onMessageRecallAck === 'function') {
                        imClient.listeners.onMessageRecallAck(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_ADD) {
                    // 添加好友通知
                    if (typeof imClient.listeners.onAddFriend === 'function') {
                        imClient.listeners.onAddFriend(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_UPDATE) {
                    // 更新好友通知
                    if (typeof imClient.listeners.onUpdateFriend === 'function') {
                        imClient.listeners.onUpdateFriend(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_DELETE) {
                    // 删除好友通知
                    if (typeof imClient.listeners.onDeleteFriend === 'function') {
                        imClient.listeners.onDeleteFriend(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_REQUEST) {
                    // 好友申请通知
                    if (typeof imClient.listeners.onFriendRequest === 'function') {
                        imClient.listeners.onFriendRequest(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_REQUEST_READ) {
                    // 好友申请已读通知
                    if (typeof imClient.listeners.onReadFriendRequest === 'function') {
                        imClient.listeners.onReadFriendRequest(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_REQUEST_APPROVE) {
                    if (typeof imClient.listeners.onApproveFriendRequest === 'function') {
                        imClient.listeners.onApproveFriendRequest(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_BLACK_ADD) {
                    // 添加黑名单通知
                    if (typeof imClient.listeners.onBlackFriend === 'function') {
                        imClient.listeners.onBlackFriend(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_BLACK_DELETE) {
                    // 删除黑名单通知
                    if (typeof imClient.listeners.onDeleteBlackFriend === 'function') {
                        imClient.listeners.onDeleteBlackFriend(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_GROUP_ADD) {
                    // 添加好友分组通知
                    if (typeof imClient.listeners.onAddFriendGroup === 'function') {
                        imClient.listeners.onAddFriendGroup(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_GROUP_DELETE) {
                    // 删除好友分组通知
                    if (typeof imClient.listeners.onDeleteFriendGroup === 'function') {
                        imClient.listeners.onDeleteFriendGroup(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_GROUP_MEMBER_ADD) {
                    // 添加好友分组成员通知
                    if (typeof imClient.listeners.onAddFriendGroupMember === 'function') {
                        imClient.listeners.onAddFriendGroupMember(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_GROUP_MEMBER_DELETE) {
                    // 删除好友分组成员通知
                    if (typeof imClient.listeners.onDeleteFriendGroupMember === 'function') {
                        imClient.listeners.onDeleteFriendGroupMember(msgBody)
                    }
                } else if (command === FriendshipEventCommand.FRIEND_ALL_DELETE) {
                    // 删除所有好友通知
                    if (typeof imClient.listeners.onDeleteAllFriend === 'function') {
                        imClient.listeners.onDeleteAllFriend(msgBody)
                    }
                } else if (command === GroupEventCommand.JOIN_GROUP) {
                    // 推送申请入群通知
                    if (typeof imClient.listeners.onJoinGroup === 'function') {
                        imClient.listeners.onJoinGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.ADDED_MEMBER) {
                    // 推送添加群成员通知
                    if (typeof imClient.listeners.onAddGroupMember === 'function') {
                        imClient.listeners.onAddGroupMember(msgBody)
                    }
                } else if (command === GroupEventCommand.CREATED_GROUP) {
                    // 推送创建群组通知
                    if (typeof imClient.listeners.onCreateGroup === 'function') {
                        imClient.listeners.onCreateGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.UPDATED_GROUP) {
                    // 推送更新群组通知
                    if (typeof imClient.listeners.onUpdateGroup === 'function') {
                        imClient.listeners.onUpdateGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.EXIT_GROUP) {
                    // 推送退出群组通知
                    if (typeof imClient.listeners.onExitGroup === 'function') {
                        imClient.listeners.onExitGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.UPDATED_MEMBER) {
                    // 推送修改群成员通知
                    if (typeof imClient.listeners.onUpdateGroupMember === 'function') {
                        imClient.listeners.onUpdateGroupMember(msgBody)
                    }
                } else if (command === GroupEventCommand.DELETED_MEMBER) {
                    // 推送删除群成员通知
                    if (typeof imClient.listeners.onDeleteGroupMember === 'function') {
                        imClient.listeners.onDeleteGroupMember(msgBody)
                    }
                } else if (command === GroupEventCommand.DESTROY_GROUP) {
                    // 推送解散群通知
                    if (typeof imClient.listeners.onDestroyGroup === 'function') {
                        imClient.listeners.onDestroyGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.TRANSFER_GROUP) {
                    // 推送转让群主通知
                    if (typeof imClient.listeners.onTransferGroup === 'function') {
                        imClient.listeners.onTransferGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.MUTE_GROUP) {
                    // 推送禁言群通知
                    if (typeof imClient.listeners.onMuteGroup === 'function') {
                        imClient.listeners.onMuteGroup(msgBody)
                    }
                } else if (command === GroupEventCommand.SPEAK_GROUP_MEMBER) {
                    // 推送禁言群成员通知
                    if (typeof imClient.listeners.onMuteGroupMember === 'function') {
                        imClient.listeners.onMuteGroupMember(msgBody)
                    }
                } else if (command === GroupEventCommand.GROUP_REQUEST_APPROVE) {
                    // 推送审批群申请通知
                    if (typeof imClient.listeners.onApproveGroupRequest === 'function') {
                        imClient.listeners.onApproveGroupRequest(msgBody)
                    }
                } else if (command === GroupEventCommand.GROUP_REQUEST_READ) {
                    // 推送群申请已读通知
                    if (typeof imClient.listeners.onReadGroupRequest === 'function') {
                        imClient.listeners.onReadGroupRequest(msgBody)
                    }
                } else if (command === GroupEventCommand.MSG_GROUP) {
                    // 群聊消息收发
                    if (typeof imClient.listeners.onGroupMessage === 'function') {
                        imClient.listeners.onGroupMessage(msgBody)
                    }
                } else if (command === GroupEventCommand.MSG_GROUP_READED_NOTIFY) {
                    // 群聊消息已读通知
                    if (typeof imClient.listeners.onGroupMessageReadedNotify === 'function') {
                        imClient.listeners.onGroupMessageReadedNotify(msgBody)
                    }
                } else if (command === GroupEventCommand.MSG_GROUP_READED_RECEIPT) {
                    // 群聊消息已读回执
                    if (typeof imClient.listeners.onGroupMessageReadedReceipt === 'function') {
                        imClient.listeners.onGroupMessageReadedReceipt(msgBody)
                    }
                } else if (command === GroupEventCommand.GROUP_MSG_ACK) {
                    // 群聊消息ACK
                    if (typeof imClient.listeners.onGroupMessageAck === 'function') {
                        imClient.listeners.onGroupMessageAck(msgBody)
                    }
                } else if (command === UserEventCommand.USER_MODIFY) {
                    // 用户信息变更通知
                    if (typeof imClient.listeners.onUserModify === 'function') {
                        imClient.listeners.onUserModify(msgBody)
                    }
                } else if (command === UserEventCommand.USER_ONLINE_STATUS_CHANGE_NOTIFY) {
                    // 用户在线状态更改通知
                    if (typeof imClient.listeners.onUserOnlineStatusChangeNotify === 'function') {
                        imClient.listeners.onUserOnlineStatusChangeNotify(msgBody)
                    }
                } else if (command === UserEventCommand.USER_ONLINE_STATUS_CHANGE_NOTIFY_SYNC) {
                    // 用户在线状态通知同步报文
                    if (typeof imClient.listeners.onUserOnlineStatusChangeNotifySync === 'function') {
                        imClient.listeners.onUserOnlineStatusChangeNotifySync(msgBody)
                    }
                } else if (command === UserEventCommand.USER_CUSTOM_STATUS_CHANGE_NOTIFY) {
                    // 用户自身状态更改通知报文
                    if (typeof imClient.listeners.onUserCustomStatusChangeNotify === 'function') {
                        imClient.listeners.onUserCustomStatusChangeNotify(msgBody)
                    }
                } else if (command === ConversationEventCommand.CONVERSATION_DELETE) {
                    // 删除会话通知
                    if (typeof imClient.listeners.onConversationDelete === 'function') {
                        imClient.listeners.onConversationDelete(msgBody)
                    }
                } else if (command === ConversationEventCommand.CONVERSATION_UPDATE) {
                    // 沟通信会话通知
                    if (typeof imClient.listeners.onConversationUpdate === 'function') {
                        imClient.listeners.onConversationUpdate(msgBody)
                    }
                }
            }
            this.conn = conn;
            this.state = State.CONNECTED
            //拉取离线消息
            // this.loadOfflineMessage();
            //心跳包
            this.heartbeatLoop(this.conn);

            if (typeof imClient.listeners.onLogin === 'function') {
                imClient.listeners.onLogin(this.userId);
            }
            callback(self);

        } else {
            log.error(err?.message)
        }

    }

    public buildMessagePack(command: number, messagePack: any) {
        let jsonData = JSON.stringify(messagePack);
        let bodyLen = getLen(jsonData);

        let pack = new ByteBuffer(null, 0);
        pack.int32(command).int32(this.version).int32(this.clientType)
            .int32(0x0)
            .int32(this.appId)
            .int32(this.imeiLength)
            .int32(bodyLen)
            .vstring(this.imei, this.imeiLength)
            .vstring(jsonData, bodyLen);
        return pack;
    }

    // 4. 自动重连
    private async errorHandler(error: Error, req: LoginPack) {
        // 如果是主动断开连接，就没有必要自动重连
        // 比如收到被踢，或者主动调用logout()方法
        if (this.state == State.CLOSED || this.state == State.CLOSEING) {
            return
        }
        this.state = State.RECONNECTING
        if (typeof imClient.listeners.onSocketReConnectEvent === 'function') {
            imClient.listeners.onSocketReConnectEvent();
        }
        // 重连10次
        for (let index = 0; index < 10; index++) {
            await sleep(3)
            try {
                log.info("try to relogin")
                // let { success, err } = await this.login()
                let {success, err, conn} = await limLogin(this.url, req, this);
                if (success) {
                    if (typeof imClient.listeners.onSocketReConnectSuccessEvent === 'function') {
                        imClient.listeners.onSocketReConnectSuccessEvent();
                    }
                    return
                }
                log.info(err)
            } catch (error) {
                log.info(error)
            }
        }
        this.onclose("reconnect timeout")
    }

    // 表示连接中止
    private onclose(reason: string) {
        if (this.state == State.CLOSED) {
            return
        }
        this.state = State.CLOSED

        log.info("connection closed due to " + reason)
        this.conn = undefined
        this.userId = ""

        // 加入socket 关闭事件
        if (typeof imClient.listeners.onSocketErrorEvent === 'function') {
            imClient.listeners.onSocketCloseEvent();
        }
    }

    public getSingleUserInfo(uid: string): Promise<any> {
        return new Promise((resolve, _) => {
            let api = new HttpApi(this.httpUrl);
            let resp = api.call("/user/data/getSingleUserInfo", this.getRequestParams(), {userId: uid})
            resolve(resp);
        })
    }

    public async syncGetUserInfo(userId: string[]) {
        let api = new HttpApi(this.httpUrl);
        return await api.call("/user/getUserInfo", this.getRequestParams(), {userIds: userId});
    }

    public getUserInfo(userId: string[]): Promise<any> {
        return new Promise((resolve, _) => {
            let api = new HttpApi(this.httpUrl);
            let resp = api.call("/user/data/getUserInfo", this.getRequestParams(), {userIds: userId})
            resolve(resp);
        })
    }

    public getAllFriend(): Promise<any> {
        return new Promise((resolve, _) => {
            let api = new HttpApi(this.httpUrl);
            let resp = api.call("/friendship/getAllFriendShip", this.getRequestParams(), {fromId: this.userId})
            resolve(resp);
        })
    }

    // 2、心跳
    private heartbeatLoop(conn) {
        let start = Date.now()
        let loop = () => {
            if (this.state != State.CONNECTED) {
                log.error("heartbeatLoop exited")
                return
            }
            if (Date.now() - start >= heartbeatInterval) {
                log.info(`>>> send ping ;`)
                start = Date.now()
                let pingPack = imClient.buildMessagePack(SystemCommand.PING, {});
                conn.send(pingPack.pack(false));
            }
            setTimeout(loop, 500)
        }
        setTimeout(loop, 500)
    }

    // 发送单聊文本消息
    public sendP2PTextMessage(to: string, text: string) {
        let pack = createTextMessage(this.appId, this.userId, to, text, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊图片消息
    public sendP2PImageMessage(to: string, image: any) {
        let pack = createImageMessage(this.appId, this.userId, to, image, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊语音消息
    public sendP2PAudioMessage(to: string, audio: any) {
        let pack = createAudioMessage(this.appId, this.userId, to, audio, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊视频消息
    public sendP2PVideoMessage(to: string, video: any) {
        let pack = createVideoMessage(this.appId, this.userId, to, video, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊表情消息
    public sendP2PEmojiMessage(to: string, emoji: any) {
        let pack = createEmojiMessage(this.appId, this.userId, to, emoji, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊文件消息
    public sendP2PFileMessage(to: string, file: any) {
        let pack = createFileMessage(this.appId, this.userId, to, file, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊位置消息
    public sendP2PLocationMessage(to: string, location: any) {
        let pack = createLocationMessage(this.appId, this.userId, to, location, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送单聊自定义消息
    public sendP2PCustomerMessage(to: string, type: number, custom: any) {
        let pack = createCustomerMessage(this.appId, this.userId, to, type, custom, ConversationType.P2PMessage)
        let p2pPack = imClient.buildMessagePack(MessageCommand.MSG_P2P, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }


    // 发送群聊文本消息
    public sendGroupTextMessage(to: string, text: string) {
        let pack = createTextMessage(this.appId, this.userId, to, text, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊图片消息
    public sendGroupImageMessage(to: string, image: any) {
        let pack = createImageMessage(this.appId, this.userId, to, image, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊语音消息
    public sendGroupAudioMessage(to: string, audio: any) {
        let pack = createAudioMessage(this.appId, this.userId, to, audio, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊视频消息
    public sendGroupVideoMessage(to: string, video: any) {
        let pack = createVideoMessage(this.appId, this.userId, to, video, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊表情消息
    public sendGroupEmojiMessage(to: string, emoji: any) {
        let pack = createEmojiMessage(this.appId, this.userId, to, emoji, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊文件消息
    public sendGroupFileMessage(to: string, file: any) {
        let pack = createFileMessage(this.appId, this.userId, to, file, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊位置消息
    public sendGroupLocationMessage(to: string, location: any) {
        let pack = createLocationMessage(this.appId, this.userId, to, location, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }

    // 发送群聊自定义消息
    public sendGroupCustomerMessage(to: string, type: number, custom: any) {
        let pack = createCustomerMessage(this.appId, this.userId, to, type, custom, ConversationType.GroupMessage)
        let p2pPack = imClient.buildMessagePack(GroupEventCommand.MSG_GROUP, pack);
        if (this.conn) {
            this.conn.send(p2pPack.pack(false));
        }
    }


    public getUserId() {
        return this.userId;
    }

    // private async loadOfflineMessage() {
    //     log.info("loadOfflineMessage start")
    //     let api = new HttpApi(this.httpUrl);
    //     let resp = await api.call("/message/syncOfflineMessage",this.getRequestParams(),{clientType : this.clientType,appId : this.appId,lastSequence:this.lastOfflineMessageSequence,maxLimit:100})
    //     if(resp.isSucceed()){
    //         this.lastOfflineMessageSequence = resp.data.maxSequence;
    //         let offmessages = resp.data.dataList;
    //         this.offlineMessageList.push(offmessages)
    //         if(offmessages.length > 0 && typeof imClient.listeners.onOfflineMessage === 'function'){
    //             imClient.listeners.onOfflineMessage(offmessages);
    //         }
    //         console.log(resp.data.completed)
    //         if(!resp.data.completed){
    //             this.loadOfflineMessage();
    //         }
    //     }else{
    //         log.error("loadOfflineMessage - error")
    //     }
    // }

}

export let limLogin = async (url: string, req: LoginPack, imClient: ImClient): Promise<{
    success: boolean,
    err?: Error,
    conn: w3cwebsocket
}> => {
    return new Promise((resolve, _) => {
        let conn = new w3cwebsocket(url)
        conn.binaryType = "arraybuffer"
        log.info("limLogin");
        // 设置一个登陆超时器
        let tr = setTimeout(() => {
            clearTimeout(tr)
            resolve({success: false, err: new Error("timeout"), conn: conn});
        }, loginTimeout);

        conn.onopen = () => {
            if (conn.readyState == w3cwebsocket.OPEN) {

                // 加入socket 连接事件
                if (typeof imClient.listeners.onSocketConnectEvent === 'function') {
                    imClient.listeners.onSocketConnectEvent(url, req);
                }
                log.info(`开启连接`);
                //登录数据包
                let data = {
                    "userId": req.userId
                }
                let loginPack = imClient.buildMessagePack(SystemCommand.LOGIN, data);
                conn.send(loginPack.pack(false));
            }
        }
        conn.onerror = (error: Error) => {
            clearTimeout(tr)
            log.error(error)
            resolve({success: false, err: error, conn: conn});
        }

        conn.onmessage = (evt) => {
            if (typeof evt.data === 'string') {
                log.info("Received: '" + evt.data + "'");
                return
            }
            clearTimeout(tr)

            let bytebuf = new ByteBuffer(evt.data);

            let byteBuffer = bytebuf.int32().int32().unpack();

            let command = byteBuffer[0];
            let bodyLen = byteBuffer[1];
            if (command == SystemCommand.LOGIN_ACK) {
                resolve({success: true, conn: conn});
            }
        }
    })

}

export let getLen = (str) => {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        //单字节加1
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        } else {
            len += 3;
        }
    }
    return len;
}


export const imClient = new ImClient();


