import request from '@/utils/request';


// 工单/客户/信息 模版列表 根据传入formGroup 10-工单 20-客户 30-会话
export function getTemplateDetail(params) {
  return request({
    url: '/workbench/form/template/page',
    method: 'get',
    params: params
  });
}

// 模版新增
export function posttemplateInfo(data){
  return request({
    url:'/workbench/form/template/insert',
    method:'post',
    data:data
  })
}

// 模版上下线
export function puttemplateInfo(data){
  return request({
    url:'/workbench/form/template/status/update',
    method:'post',
    data:data
  })
}

// 模版删除
export function deltemplateInfo(params){
  return request({
    url:'/workbench/form/template/delete',
    method:'get',
    params:params
  })
}

// 模版详情
export function gettemplateInfo(params){
  return request({
    url:'/workbench/form/template/detail',
    method:'get',
    params:params
  })
}

  
/** 
 * 自定义字段
 * 
*/

// 自定义字段列表 10-工单 20-客户 30-会话
export function getfieldList(params) {
  return request({
    url: '/workbench/form/field/list',
    method: 'get',
    params: params
  });
}

//自定义字段新增
export function postfieldInfo(data){
  return request({
    url:'/workbench/form/field/insert',
    method:'post',
    data:data
  })
}

// 自定义字段删除
export function delfieldInfo(params){
  return request({
    url:'/workbench/form/field/delete',
    method:'get',
    params:params
  })
}

// 自定义字段详情
export function getfieldInfo(params){
  return request({
    url:'/workbench/form/field/detail',
    method:'get',
    params:params
  })
}

// 自定义字段编辑
export function putfieldInfo(data){
  return request({
    url:'/workbench/form/field/edit',
    method:'post',
    data:data
  })
}
