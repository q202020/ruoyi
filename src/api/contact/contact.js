import request from '@/utils/request'

// 获取IM登录令牌
export function getIMToken() {
  return request({
    url: '/workbench/instance/users/chat/token',
    method: 'get'
  })
}

// 会话列表 
export function getSessionList() {
  return request({
    url: '/workbench/contact/list/waiting',
    method: 'get'
  })
}

// 会话接起
export function getChatUp(params) {
  return request({
    url: '/workbench/contact/accept/chat?contactId=' + params.contactId,
    method: 'get',
  })
}

// 会话详情
export function getChatdetail(params) {
  return request({
    url: '/workbench/contact/detail?contactId=' + params.contactId,
    method: 'get'
  })
}

// 客户或访客详情
export function getcustomerdetail(params) {
  return request({
    url: '/workbench/customer/detail',
    method: 'get',
    params
  })
}

// 修改客户信息
export function putcustomerInfo(data){
  return request({
    url:'/workbench/customer/update/template/info',
    method:'post',
    data
  })
}

// 修改会话信息
export function postsessionInfo(data){
  return request({
    url:'/workbench/contact/update/template/info',
    method:'post',
    data
  })
}

// 结束会话
export function endsessionInfo(params){
  return request({
    url:'/workbench/contact/network/end',
    method:'get',
    params
  })
}

// 转接会话
export function transferSession(params){
  return request({
    url:'/workbench/contact/transfer',
    method:'get',
    params
  })
}

// 工单列表
export function getworkOrderList(params) {
  return request({
    url: '/workbench/ticket/page',
    method: 'get',
    params
  })
}
