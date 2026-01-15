import request from '@/utils/request'


// 会话消息列表
export function getcontactpage(params) {
    return request({
        url: '/workbench/contact/page',
        method: 'get',
        params:params
    })
}

// 会话消息详情
export function getcontactdetail(params) {
    return request({
        url: '/workbench/contact/detail?contactId=' + params.contactId,
        method: 'get'
    })
}

// 聊天会话消息详情
export function getconversationdetail(params) {
    return request({
        url: '/workbench/chat/conversation/detail?chatConversationId=' + params.chatConversationId,
        method: 'get'
    })
}

// 聊天消息记录
export function getmessagepage(params) {
    return request({
        url: '/workbench/chat/message/page',
        method: 'get',
        params:params
    })
}