enum MessageCommand {

    //单聊消息 1103
    MSG_P2P = 0x44F,

    //单聊消息ACK 1046
    MSG_ACK = 0x416,

    //消息收到ack 1107
    MSG_RECEIVE_ACK = 0x453,

    //发送消息已读   1106
    MSG_READED = 0x452,

    //消息已读通知给同步端 1053
    MSG_READED_NOTIFY = 0x41D,

    //消息已读回执，给原消息发送方 1054
    MSG_READED_RECEIPT = 0x41E,

    //消息撤回 1050
    MSG_RECALL = 0x41A,

    //消息撤回通知 1052
    MSG_RECALL_NOTIFY = 0x41C,

    //消息撤回回报 1051
    MSG_RECALL_ACK = 0x41B

}

enum FriendshipEventCommand {

    //添加好友
    FRIEND_ADD = 0xBB8,

    //更新好友
    FRIEND_UPDATE = 0xBB9,

    //删除好友
    FRIEND_DELETE = 0xBBA,

    //好友申请
    FRIEND_REQUEST = 0xBBB,

    //好友申请已读
    FRIEND_REQUEST_READ = 0xBBC,

    //好友申请审批
    FRIEND_REQUEST_APPROVE = 0xBBD,

    //添加黑名单
    FRIEND_BLACK_ADD = 0xBC2,

    //移除黑名单
    FRIEND_BLACK_DELETE = 0xBC3,

    //新建好友分组
    FRIEND_GROUP_ADD = 0xBC4,

    //删除好友分组
    FRIEND_GROUP_DELETE = 0xBC5,

    //好友分组添加成员
    FRIEND_GROUP_MEMBER_ADD = 0xBC6,

    //好友分组移除成员
    FRIEND_GROUP_MEMBER_DELETE = 0xBC7,

    //删除所有好友
    FRIEND_ALL_DELETE = 0xBC8

}

enum GroupEventCommand {

    /**
     * 推送申请入群通知 2023
     */
    JOIN_GROUP = 0x7D0,

    /**
     * 推送添加群成员 2001，通知给所有管理员和本人
     */
    ADDED_MEMBER = 0x7D1,

    /**
     * 推送创建群组通知 2002，通知给所有人
     */
    CREATED_GROUP = 0x7D2,

    /**
     * 推送更新群组通知 2003，通知给所有人
     */
    UPDATED_GROUP = 0x7D3,

    /**
     * 推送退出群组通知 2004，通知给管理员和操作人
     */
    EXIT_GROUP = 0x7D4,

    /**
     * 推送修改群成员通知 2005，通知给管理员和被操作人
     */
    UPDATED_MEMBER = 0x7D5,

    /**
     * 推送删除群成员通知 2006，通知给所有群成员和被踢人
     */
    DELETED_MEMBER = 0x7D6,

    /**
     * 推送解散群通知 2007，通知所有人
     */
    DESTROY_GROUP = 0x7D7,

    /**
     * 推送转让群主 2008，通知所有人
     */
    TRANSFER_GROUP = 0x7D8,

    /**
     * 禁言群 2009，通知所有人
     */
    MUTE_GROUP = 0x7D9,


    /**
     * 禁言/解禁 群成员 2010，通知管理员和被操作人
     */
    SPEAK_GROUP_MEMBER = 0x7DA,

    /**
     * 审批群申请通知
     */
    GROUP_REQUEST_APPROVE = 0x7DB,

    /**
     * 群申请已读通知
     */
    GROUP_REQUEST_READ = 0x7DC,

    //群聊消息收发 2104
    MSG_GROUP = 0x838,

    //发送消息已读   2106
    MSG_GROUP_READED = 0x83A,

    //消息已读通知给同步端 2053
    MSG_GROUP_READED_NOTIFY = 0x805,

    //消息已读回执，给原消息发送方 2054
    MSG_GROUP_READED_RECEIPT = 0x806,

    //群聊消息ack 2047
    GROUP_MSG_ACK = 0x7FF

}

enum SystemCommand {

    //心跳 9999
    PING = 0x270F,

    /**
     * 登录 9000
     */
    LOGIN = 0x2328,

    //登录ack  9001
    LOGIN_ACK = 0x2329,

    //登出  9003
    LOGOUT = 0x232B,

    //下线通知 用于多端互斥  9002
    MUTUAL_LOGIN = 0x232A

}

enum UserEventCommand {

    //用户信息修改command 4000
    USER_MODIFY = 4000,

    //4001 用户在线状态修改
    USER_ONLINE_STATUS_CHANGE = 4001,

    //4004 用户在线状态通知报文
    USER_ONLINE_STATUS_CHANGE_NOTIFY = 4004,

    //4005 用户在线状态通知同步报文
    USER_ONLINE_STATUS_CHANGE_NOTIFY_SYNC = 4005,

    //4006 用户自己在线状态更改通知报文
    USER_CUSTOM_STATUS_CHANGE_NOTIFY = 4006

}

enum ConversationEventCommand {

    //删除会话
    CONVERSATION_DELETE = 5000,

    //更新会话
    CONVERSATION_UPDATE = 5001
}

export {
    MessageCommand,
    FriendshipEventCommand,
    GroupEventCommand,
    SystemCommand,
    UserEventCommand,
    ConversationEventCommand
}