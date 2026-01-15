<template>
  <div class="app-container" :class="$style.containerWrapper">
    <div :class="$style.container">
      <!-- 顶部搜索和添加 -->
      <div :class="$style.header">
        <!-- <div :class="$style.search" ref="search" />
        <div :class="$style.add" ref="add" /> -->
      </div>

      <div :class="$style.content">
        <!-- 左侧导航 -->
        <div :class="$style.left">
          <div :class="$style['avatar-icon']" ref="avatar" />
          <div
            :class="{
              [$style['chat-icon']]: true,
              [$style.active]: model === 'chat',
            }"
            @click="model = 'chat'"
          >
            <i
              :class="{
                [$style.iconfont]: true,
                iconfont: true,
                'icon-im': true,
              }"
            />
            <div :class="$style['icon-label']">会话</div>
          </div>
          <!-- <div :class="{
            [$style['contact-icon']]: true,
            [$style.active]: model === 'collect',
          }" @click="model = 'collect'">
            <i :class="{ [$style.iconfont]: true, iconfont: true, 'icon-daohang-shoucang': true }" />
            <div :class="$style['icon-label']">收藏</div>
          </div> -->
          <!-- <div :class="{
            [$style['contact-icon']]: true,
            [$style.active]: model === 'contact',
          }" @click="model = 'contact'">
            <i :class="{ [$style.iconfont]: true, iconfont: true, 'icon-tongxunlu-weixuanzhong': true }" />
            <div :class="$style['icon-label']">通讯录</div>
          </div>
          <div :class="$style['logout-icon']"></div> -->
        </div>

        <!-- 会话页面 -->
        <div :class="$style.right" v-show="model === 'chat'">
          <!-- 自定义会话列表 -->
          <div :class="$style['right-list']">
            <div
              style="
                display: flex;
                justify-content: space-evenly;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              "
            >
              <div
                :class="{
                  [$style.tab]: true,
                  [$style.activeTwo]: activeTab === 'service',
                }"
                @click="activeTab = 'service'"
              >
                服务中 {{ serviceCount }}
              </div>
              <div
                :class="{
                  [$style.tab]: true,
                  [$style.activeTwo]: activeTab === 'queue',
                }"
                @click="activeTab = 'queue'"
              >
                队列中 {{ queueCount }}
              </div>
              <div
                :class="{
                  [$style.tab]: true,
                  [$style.activeTwo]: activeTab === 'finished',
                }"
                @click="activeTab = 'finished'"
              >
                已结束 {{ finishedCount }}
              </div>
            </div>

            <!-- 会话列表 -->
            <div
              v-for="item in filteredArrList"
              :key="item.contactId"
              class="conversation-item"
              @click="selectConversation(item)"
            >
              <el-badge
                class="item"
                :value="item.unreadCount"
                :show-zero="false"
              >
                <div
                  style="
                    width: 50px;
                    height: 50px;
                    background-color: aqua;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  "
                >
                  <!-- 队列中显示倒计时 -->
                  <div v-if="!item.isTakeUp && item.countdown > 0">
                    {{ formatCountdown(item.countdown) }}
                  </div>
                </div>
              </el-badge>

              <div
                style="
                  display: flex;
                  flex-direction: column;
                  margin-left: 8px;
                  flex: 1;
                "
              >
                <div style="">{{ item.nickName }}</div>
                <div
                  style="
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                    display: flex;
                    justify-content: space-between;
                  "
                >
                  <div>
                    <div v-if="!item.isTakeUp">{{ item.channelName }}</div>
                    <div v-else>{{ item.chatMessageList[0].msgContent }}</div>
                  </div>
                  <div>{{ parseTime(new Date(), "{h}:{i}") }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 聊天区域（保留 UIKit 聊天组件） -->
          <div
            v-show="selectedConversation"
            :class="$style['right-content']"
            ref="chat"
          />

          <!-- 无选中会话时显示欢迎图片或初始化选项 -->
          <div v-if="!selectedConversation" :class="$style['chat-welcome']">
            <div :class="$style['welcome-content']">
              <img
                :src="welcomeImage"
                alt="欢迎使用"
                :class="$style['welcome-image']"
              />
              <div :class="$style['welcome-title']">欢迎使用客服系统</div>
            </div>
          </div>
        </div>

        <!-- 通讯录 -->
        <div :class="$style.right" v-show="model === 'contact'">
          <div :class="$style['right-list']" ref="contactList" />
          <div :class="$style['right-content']" ref="contactInfo" />
        </div>

        <!-- 收藏 -->
        <div :class="$style.collect" v-show="model === 'collect'">
          <div :class="$style.collectRight" ref="collect"></div>
        </div>
      </div>
    </div>
    <div style="overflow-y: auto;">
      <el-tabs
        tab-position="top"
        style="flex: 1; height: 810px"
        type="border-card"
        @tab-click="handleClick"
      >
        <div v-if="selectedConversation">
          <el-tab-pane label="会话">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
              "
            >
              <div style="font-weight: 500">会话信息</div>
              <el-button type="primary" @click="saveSessionInfo"
                >保存会话信息</el-button
              >
            </div>
            <div style="height: 810px">
              <div style="margin-top: 10px">
                <div>会话ID: {{ receiveInfo.contactId }}</div>
                <div style="margin-top: 8px">
                  访客ID: {{ receiveInfo.customerId }}
                </div>
                <div style="margin-top: 8px">
                  渠道名称: {{ receiveInfo.channelName }}
                </div>
              </div>
              <div style="margin-top: 10px">
                <div style="color: #0792f6">字段</div>
                <el-form
                  label-position="left"
                  ref="fieldsFormRef"
                  style="max-width: 600px"
                  :model="fieldsForm"
                  :rules="rules"
                  label-width="auto"
                >
                  <!-- 动态生成的字段 -->
                  <template v-if="templateFields.length > 0">
                    <el-form-item
                      v-for="field in templateFields"
                      :key="field.formFieldId"
                      :label="getFieldLabel(field)"
                      :prop="field.fieldName"
                      :required="field.isRequired === 1"
                    >
                      <!-- 单行文本 -->
                      <el-input
                        v-if="field.editorType === 'TEXT'"
                        v-model="fieldsForm[field.fieldName]"
                        :placeholder="`请输入${field.displayName}`"
                        :maxlength="field.maxLength || undefined"
                      />

                      <!-- 多行文本 -->
                      <el-input
                        v-else-if="field.editorType === 'TEXTAREA'"
                        v-model="fieldsForm[field.fieldName]"
                        type="textarea"
                        :rows="3"
                        :placeholder="`请输入${field.displayName}`"
                        :maxlength="field.maxLength || undefined"
                      />

                      <!-- 数字 -->
                      <el-input-number
                        v-else-if="field.editorType === 'NUMBER'"
                        v-model="fieldsForm[field.fieldName]"
                        style="width: 100%"
                      />

                      <!-- 日期 -->
                      <el-date-picker
                        v-else-if="field.editorType === 'DATE'"
                        v-model="fieldsForm[field.fieldName]"
                        type="date"
                        :placeholder="`选择${field.displayName}`"
                        style="width: 100%"
                      />

                      <!-- 单选按钮 -->
                      <el-radio-group
                        v-else-if="field.editorType === 'RADIO'"
                        v-model="fieldsForm[field.fieldName]"
                      >
                        <el-radio
                          v-for="option in getSelectOptions(field)"
                          :key="option.value"
                          :label="option.value"
                        >
                          {{ option.label }}
                        </el-radio>
                      </el-radio-group>

                      <!-- 多选框 -->
                      <el-checkbox-group
                        v-else-if="field.editorType === 'CHECKBOX'"
                        v-model="fieldsForm[field.fieldName]"
                      >
                        <el-checkbox
                          v-for="option in getSelectOptions(field)"
                          :key="option.value"
                          :label="option.value"
                        >
                          {{ option.label }}
                        </el-checkbox>
                      </el-checkbox-group>

                      <!-- 下拉框 -->
                      <el-select
                        v-else-if="field.editorType === 'SELECT'"
                        v-model="fieldsForm[field.fieldName]"
                        :placeholder="`请选择${field.displayName}`"
                        style="width: 100%"
                        :multiple="getSelectMode(field) === 'multiple'"
                        :clearable="true"
                      >
                        <el-option
                          v-for="option in getSelectOptions(field)"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>

                      <!-- 默认文本框 -->
                      <el-input
                        v-else
                        v-model="fieldsForm[field.fieldName]"
                        :placeholder="`请输入${field.displayName}`"
                      />
                    </el-form-item>
                  </template>

                  <!-- 无字段时的提示 -->
                  <div
                    v-else
                    style="text-align: center; color: #999; padding: 20px"
                  >
                    暂无字段配置
                  </div>
                </el-form>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="客户">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
              "
            >
              <div style="font-weight: 500">客户信息</div>
              <el-button type="primary" @click="saveCustomerInfo"
                >保存客户信息</el-button
              >
            </div>
            <div
              style="
                margin-top: 10px;
                max-height: 380px;
                overflow: auto;
                padding: 15px;
              "
            >
              <div style="color: #0792f6; margin-bottom: 10px">客户信息</div>
              <el-form
                label-position="left"
                ref="customerFormRef"
                style="max-width: 600px"
                :model="customerFieldsForm"
                :rules="customerRules"
                label-width="auto"
              >
                <!-- 动态生成的客户字段 -->
                <template v-if="customerTemplateFields.length > 0">
                  <el-form-item
                    v-for="field in customerTemplateFields"
                    :key="field.formFieldId"
                    :label="getFieldLabel(field)"
                    :prop="field.fieldName"
                    :required="field.isRequired === 1"
                  >
                    <!-- 单行文本 -->
                    <el-input
                      v-if="field.editorType === 'TEXT'"
                      v-model="customerFieldsForm[field.fieldName]"
                      :placeholder="`请输入${field.displayName}`"
                      :maxlength="field.maxLength || undefined"
                    />

                    <!-- 多行文本 -->
                    <el-input
                      v-else-if="field.editorType === 'TEXTAREA'"
                      v-model="customerFieldsForm[field.fieldName]"
                      type="textarea"
                      :rows="3"
                      :placeholder="`请输入${field.displayName}`"
                      :maxlength="field.maxLength || undefined"
                    />

                    <!-- 数字 -->
                    <el-input-number
                      v-else-if="field.editorType === 'NUMBER'"
                      v-model="customerFieldsForm[field.fieldName]"
                      style="width: 100%"
                    />

                    <!-- 日期 -->
                    <el-date-picker
                      v-else-if="field.editorType === 'DATE'"
                      v-model="customerFieldsForm[field.fieldName]"
                      type="date"
                      :placeholder="`选择${field.displayName}`"
                      style="width: 100%"
                    />

                    <!-- 单选按钮 -->
                    <el-radio-group
                      v-else-if="field.editorType === 'RADIO'"
                      v-model="customerFieldsForm[field.fieldName]"
                    >
                      <el-radio
                        v-for="option in getSelectOptions(field)"
                        :key="option.value"
                        :label="option.value"
                      >
                        {{ option.label }}
                      </el-radio>
                    </el-radio-group>

                    <!-- 多选框 -->
                    <el-checkbox-group
                      v-else-if="field.editorType === 'CHECKBOX'"
                      v-model="customerFieldsForm[field.fieldName]"
                    >
                      <el-checkbox
                        v-for="option in getSelectOptions(field)"
                        :key="option.value"
                        :label="option.value"
                      >
                        {{ option.label }}
                      </el-checkbox>
                    </el-checkbox-group>

                    <!-- 下拉框 -->
                    <el-select
                      v-else-if="field.editorType === 'SELECT'"
                      v-model="customerFieldsForm[field.fieldName]"
                      :placeholder="`请选择${field.displayName}`"
                      style="width: 100%"
                      :multiple="getSelectMode(field) === 'multiple'"
                      :clearable="true"
                    >
                      <el-option
                        v-for="option in getSelectOptions(field)"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>

                    <!-- 默认文本框 -->
                    <el-input
                      v-else
                      v-model="customerFieldsForm[field.fieldName]"
                      :placeholder="`请输入${field.displayName}`"
                    />
                  </el-form-item>
                </template>

                <!-- 无字段时的提示 -->
                <div
                  v-else
                  style="text-align: center; color: #999; padding: 20px"
                >
                  暂无客户字段配置
                </div>
              </el-form>
            </div>
            <div style="max-height: 380px">
              <div style="font-weight: 500">服务记录</div>
              <div style="border-bottom: 1px solid #eee; padding-bottom: 10px">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  "
                >
                  <div style="padding: 2px">2025年08月06日 13:25:09</div>
                  <div><el-button link type="primary">详情</el-button></div>
                </div>
                <div style="margin-top: 4px">渠道名称: 测试渠道</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="工单">
            <el-form
              label-position="left"
              :model="workOrderFrom"
              label-width="auto"
              style="max-width: 600px"
              ref="workOrderFromRef"
              :rules="workOrderFromRules"
            >
              <el-form-item label="工单模版" prop="workOrderTemplate">
                <el-select
                  v-model="workOrderFrom.workOrderTemplate"
                  placeholder="请选择模版"
                >
                  <el-option
                    v-for="item in workOrderList"
                    :key="item.formTemplateId"
                    :label="item.templateName"
                    :value="item.formTemplateId"
                  />
                  <!-- <el-option label="Zone one" value="shanghai" /> -->
                </el-select>
              </el-form-item>
              <el-form-item label="标题">
                <el-input v-model="workOrderFrom.titleName" />
              </el-form-item>
              <el-form-item label="离职备注" prop="resignationNote">
                <el-input
                  v-model="workOrderFrom.resignationNote"
                  type="textarea"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </div>
        <div v-else>暂无会话</div>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { compile } from "jsx-web-compiler";
import {
  ChatContainer,
  AddContainer,
  SearchContainer,
  ContactListContainer,
  ContactInfoContainer,
  MyAvatarContainer,
  ChatCollectionList,
} from "@xkit-yx/im-kit-ui";
import "@xkit-yx/im-kit-ui/es/style/css";
import "../message/iconfont.css";
import { fetchIMToken } from "@/utils/im";
import {
  endsessionInfo,
  getChatdetail,
  getChatUp,
  getcustomerdetail,
  getSessionList,
  postsessionInfo,
  putcustomerInfo,
  transferSession,
} from "@/api/contact/contact";
import {
  gettemplateInfo,
  getfieldInfo,
  getTemplateDetail,
} from "@/api/contact/templatepage";

let globalCountdownTimer = null;

export default {
  name: "IMApp",
  data() {
    return {
      showChat: true,
      model: "chat",
      activeTab: "service",
      arrList: [],
      sessionTimer: null, // 接口轮询定时器
      countdownTimer: null, // 头像倒计时
      initOptions: JSON.parse(sessionStorage.getItem("initOptions")),
      fieldsForm: {}, // 自定义表单
      templateFields: [], // 模板字段详情列表
      customerFieldsForm: {}, // 客户自定义表单
      customerTemplateFields: [], // 客户模板字段详情列表
      customerRules: {}, // 客户表单验证规则
      receiveInfo: {}, // 会客信息
      customerDetailData: {}, // 客户详情数据
      workOrderFrom: {
        workOrderTemplate: "",
        titleName: "",
        resignationNote: "",
      },
      workOrderList: [], // 工单列表
      selectedConversation: null, // 当前选中的会话
      initializing: false, // 按钮加载状态
      welcomeImage:
        "https://yx-web-nosdn.netease.im/common/2946c48f29d747305e68b1ddf27f3472/无成员可添加@3x.png", // 欢迎图片路径
      rules: {},
      workOrderFromRules: {
        workOrderTemplate: [
          {
            required: true,
            message: "请选择模版",
            trigger: "change",
          },
        ],
        resignationNote: [
          {
            required: true,
            message: "请输入离职备注",
            trigger: "blur",
          },
        ],
      },
    };
  },
  computed: {
    filteredArrList() {
      if (this.activeTab === "service") {
        // 服务中
        return this.arrList.filter((item) => item.isTakeUp);
      } else if (this.activeTab === "queue") {
        // 队列中
        return this.arrList.filter((item) => !item.isTakeUp);
      } else if (this.activeTab === "finished") {
        // 已结束，假设接口有字段 status 或类似
        return this.arrList.filter((item) => item.status === "finished");
      }
      return this.arrList;
    },
    serviceCount() {
      return this.arrList.filter((item) => item.isTakeUp).length;
    },
    queueCount() {
      return this.arrList.filter((item) => !item.isTakeUp).length;
    },
    finishedCount() {
      return this.arrList.filter((item) => item.status === "finished").length;
    },
  },
  async mounted() {
    await fetchIMToken();
    this.init();
    this.startSessionPolling();
    this.startCountdown();
    console.log(this.$uikit);
    console.log(this.$uikit.getStateContext());

    // 设置全局错误处理，拦截云信SDK的错误
    this.setupGlobalErrorHandler();
  },
  beforeUnmount() {
    this.stopSessionPolling(); // 清理定时器
    // 清理全局倒计时定时器
    if (globalCountdownTimer) {
      clearInterval(globalCountdownTimer);
      globalCountdownTimer = null;
    }
  },
  methods: {
    // 解析下拉框选项
    getSelectOptions(field) {
      try {
        if (!field.attributes) {
          console.warn(`字段 ${field.fieldName} 的 attributes 为空`);
          return [];
        }

        const attributes = JSON.parse(field.attributes);
        const dataSource = attributes.DataSource || [];

        console.log(`字段 ${field.fieldName} 的选项:`, dataSource);
        return dataSource;
      } catch (error) {
        console.error(`解析字段 ${field.fieldName} 的选项失败:`, error);
        return [];
      }
    },

    // 获取下拉框模式（单选或多选）
    getSelectMode(field) {
      try {
        if (!field.attributes) {
          return "single";
        }

        const attributes = JSON.parse(field.attributes);
        const mode = attributes.Mode || "single";

        console.log(`字段 ${field.fieldName} 的模式:`, mode);
        return mode;
      } catch (error) {
        console.error(`解析字段 ${field.fieldName} 的模式失败:`, error);
        return "single";
      }
    },

    // 结束会话
    endMsg() {
      endsessionInfo({
        contactId: this.selectedConversation.contactId,
        skillGroupId: this.selectedConversation.skillGroupId,
      })
        .then((res) => {
          this.$modal.msgSuccess("结束成功");
          console.log(res, "结束会话");
        })
        .catch((err) => {
          console.log(err);
        });
    },
    // 转接会话
    transferMsg() {
      transferSession({
        contactId: this.selectedConversation.contactId,
        skillGroupId: this.selectedConversation.skillGroupId,
      })
        .then((res) => {
          this.$modal.msgSuccess("转接成功");
          console.log(res, "转接会话");
        })
        .catch((err) => {
          console.log(err);
        });
    },
    init() {
      // 顶部功能区 头部搜索不要
      // this.$uikit.render(SearchContainer, { onClickChat: () => (this.model = "chat") }, this.$refs.search);
      // this.$uikit.render(AddContainer, { onClickChat: () => (this.model = "chat") }, this.$refs.add);

      // 头像不要
      // this.$uikit.render(MyAvatarContainer, null, this.$refs.avatar);

      // 聊天窗口
      this.$uikit.render(
        ChatContainer,
        {
          teamSettingActions: [],
          p2pSettingActions: [],
          renderHeader: (options) => {
            // console.log("==========renderHeader===========", options);
            return compile(
              `<div  style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               padding: '10px 16px',
               backgroundColor: '#f8f9fa',
               borderRadius: '8px',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)'}}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>${options.name}</span>
            <div>
              <button
              onClick={context.endMsg}
              style={{
               backgroundColor: '#e74c3c',
               color: '#fff',
               border: 'none',
               padding: '6px 12px',
               borderRadius: '6px',
               cursor: 'pointer',
               fontSize: '14px',
               fontWeight: '500',
               ransition: 'background-color 0.2s',
               marginRight: '10px',
            }}>
               结束会话
             </button>
              <button
              onClick={context.transferMsg}
              style={{
               backgroundColor: '#3498db',
               color: '#fff',
               border: 'none',
               padding: '6px 12px',
               borderRadius: '6px',
               cursor: 'pointer',
               fontSize: '14px',
               fontWeight: '500',
               ransition: 'background-color 0.2s',
            }}>
               转接会话
             </button>
            </div>
            </div>`,
              { endMsg: this.endMsg, transferMsg: this.transferMsg }
            );
          },
        },
        this.$refs.chat
      );

      // 收藏区
      // this.$uikit.render(ChatCollectionList, null, this.$refs.collect);

      // 通讯录
      // this.$uikit.render(ContactListContainer, null, this.$refs.contactList);
      // this.$uikit.render(ContactInfoContainer, {
      //   afterSendMsgClick: () => (this.model = "chat"),
      //   onGroupItemClick: () => (this.model = "chat"),
      // }, this.$refs.contactInfo);
      this.getWaiting();
    },
    // 十分钟格式化
    formatCountdown(seconds) {
      const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    },
    // 头像倒计时
    startCountdown() {
      if (!globalCountdownTimer) {
        globalCountdownTimer = setInterval(() => {
          this.arrList.forEach((item) => {
            if (!item.isTakeUp && item.countdown > 0) {
              item.countdown -= 1;
              localStorage.setItem(
                `countdown_${item.contactId}`,
                item.countdown
              );
            }
          });
        }, 1000);
      }
    },
    // 启动轮询
    startSessionPolling() {
      this.sessionTimer = setInterval(() => {
        this.getWaiting();
      }, 10000); // 10秒轮询一次
    },
    // 停止轮询
    stopSessionPolling() {
      if (this.sessionTimer) {
        clearInterval(this.sessionTimer);
        this.sessionTimer = null;
      }
    },
    // 清空选中的会话
    clearSelectedConversation() {
      this.selectedConversation = null;
      this.receiveInfo = {};
      this.customerDetailData = {};
      this.fieldsForm = {};
      this.customerFieldsForm = {};
      this.templateFields = [];
      this.customerTemplateFields = [];

      // 清空聊天窗口 - 需要调用UIKit的方法来清空聊天界面
      try {
        const { store } = this.$uikit.getStateContext();
        if (store && store.uiStore) {
          // 清空当前选中的对话
          store.uiStore.selectConversation("");
        }
      } catch (error) {
        console.warn("清空聊天窗口失败:", error);
      }

      console.log("已清空选中的会话和相关数据");
    },
    //获取会话列表
    async getWaiting() {
      try {
        const res = await getSessionList();
        if (!res.result || res.result.length === 0) {
          this.arrList = [];
          // 清空当前选中的会话和相关信息
          this.clearSelectedConversation();
          console.warn("获取会话列表失败或返回空结果");
          return;
        }

        const nim = this.$uikit.providerProps.nim;
        if (!nim) {
          console.error("NIM 实例未初始化");
          return;
        }

        // 倒计时处理和会话ID生成
        this.arrList = res.result.map((item) => {
          const countdown = !item.isTakeUp
            ? Number(localStorage.getItem(`countdown_${item.contactId}`)) ||
              10 * 60
            : 0;

          const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(
            item.chatInfo.chatTeamId
          );

          return {
            ...item,
            countdown,
            conversationId,
          };
        });

        // 提取会话ID列表
        const conversationIds = this.arrList.map((item) => item.conversationId);

        let unreadCountsObj = {};

        // 尝试逐个获取每个会话的未读数
        for (const conversationId of conversationIds) {
          try {
            // 获取单个会话信息
            const conversation =
              await nim.V2NIMLocalConversationService.getConversation(
                conversationId
              );
            if (conversation && conversation.unreadCount !== undefined) {
              unreadCountsObj[conversationId] = conversation.unreadCount;
            } else {
              const count =
                await nim.V2NIMLocalConversationService.getUnreadCountByIds([
                  conversationId,
                ]);
              unreadCountsObj[conversationId] =
                typeof count === "number" ? count : 0;
            }
          } catch (error) {
            console.warn(`获取会话 ${conversationId} 信息失败:`, error);
            unreadCountsObj[conversationId] = 0;
          }
        }
        console.log("各群未读消息数统计:", unreadCountsObj);
        console.log(`共查询了 ${conversationIds.length} 个群的未读数`);

        // 合并未读数信息
        this.arrList = this.arrList.map((item) => {
          const unreadCount = unreadCountsObj[item.conversationId] ?? 0;

          // 调试用
          if (unreadCount > 0) {
            console.log(
              `群 ${item.chatInfo.chatTeamId} 有 ${unreadCount} 条未读消息`
            );
          }
          return {
            ...item,
            unreadCount,
          };
        });

        // 统计总未读数
        const totalUnreadCount = this.arrList.reduce(
          (total, item) => total + item.unreadCount,
          0
        );
        console.log(`处理后的会话列表:`, this.arrList);
        console.log(
          `总计 ${this.arrList.length} 个群，共 ${totalUnreadCount} 条未读消息`
        );

        // 检查当前选中的会话是否还在新的列表中
        if (this.selectedConversation) {
          const stillExists = this.arrList.some(
            (item) => item.contactId === this.selectedConversation.contactId
          );

          if (!stillExists) {
            console.log("当前选中的会话已不存在，清空选中状态");
            this.clearSelectedConversation();
          }
        }
      } catch (error) {
        console.error("获取会话列表时发生错误:", error);
      }
    },
    // 进入会话
    async selectConversation(item) {
      const { store } = this.$uikit.getStateContext();
      const conversationId = `${this.initOptions.account}|2|${item.chatInfo.chatTeamId}`;
      console.log("进入群聊会话:", item.chatInfo.chatTeamId);

      // 设置选中的会话
      this.selectedConversation = item;

      // 更新接待状态
      if (!item.isTakeUp) {
        item.isTakeUp = true;
        item.countdown = 0;
        localStorage.removeItem(`countdown_${item.contactId}`);
        getChatUp({ contactId: item.contactId }).then((res) => {
          console.log("状态修改成功");
        });
      }

      try {
        // 检查会话是否已存在
        const existingConversation =
          store.localConversationStore.conversations.get(conversationId);

        if (existingConversation) {
          console.log("会话已存在，直接选中");
          store.uiStore.selectConversation(conversationId);
        } else {
          console.log("会话不存在，创建新会话");

          // 创建会话
          await store.localConversationStore.insertConversationActive(
            2,
            item.chatInfo.chatTeamId
          );
          console.log("会话创建成功");

          // 延迟获取历史消息（避免权限错误影响界面）
          setTimeout(() => {
            this.loadHistoryMessages(item, store);
          }, 1000);
        }
      } catch (error) {
        console.error("进入群聊失败:", error);
        // 即使出错也尝试创建会话，确保用户能进入群聊
        try {
          await store.localConversationStore.insertConversationActive(
            2,
            item.chatInfo.chatTeamId
          );
          console.log("强制创建会话成功");
        } catch (retryError) {
          console.error("强制创建会话也失败:", retryError);
        }
      }

      this.activeTab = "service";
      this.getReceiveInfo(item);
    },
    // 侧边会话信息
    getReceiveInfo(data) {
      getChatdetail({ contactId: data.contactId })
        .then((res) => {
          console.log(res.result, "会话详情数据11111");
          this.receiveInfo = res.result;
          this.getCustomForm(res.result);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    async handleClick(tab, event) {
      // console.log(tab.props.label, event)
      if (tab.props.label == "客户") {
        const customerRes = await getcustomerdetail({
          customerId: this.receiveInfo.customerId,
        });
        console.log(this.receiveInfo, 'this.receiveInfo');
        
        console.log(customerRes, "客户详情数据");
        // 保存客户详情数据用于表单填充
        this.customerDetailData = customerRes.result;

        const res = await gettemplateInfo({
          formTemplateId: customerRes.result.formTemplateId,
        });
        console.log(res, "客户模板数据");

        await this.loadCustomerFieldDetails(res.result.fieldIds);
      } else if (tab.props.label == "工单") {
        console.log("工单");
        const res = await getTemplateDetail({
          formGroup: "10",
        });
        console.log(res, "asdas");

        this.workOrderList = res.result.dataList;
      }
    },
    // 获取会话/客户信息模版
    async getCustomForm(data) {
      try {
        const res = await gettemplateInfo({
          formTemplateId: data.formTemplateId,
        });
        if (res && res.result) {
          console.log(res, "模板信息");
          this.fieldsForm = res.result;

          // 获取字段详细信息
          if (res.result.fieldIds && res.result.fieldIds.length > 0) {
            await this.loadFieldDetails(res.result.fieldIds);
          }
        }
      } catch (error) {
        console.error("获取自定义表单失败:", error);
      }
    },

    // 加载字段详细信息
    async loadFieldDetails(fieldIds) {
      try {
        // 并行获取所有字段的详细信息
        const fieldPromises = fieldIds.map((fieldId) =>
          getfieldInfo({ formFieldId: fieldId })
        );

        const fieldResponses = await Promise.all(fieldPromises);

        // 构建字段详情列表，保持原有顺序
        const detailedFields = [];
        fieldResponses.forEach((response, index) => {
          if (response && response.result) {
            detailedFields.push(response.result);
          }
        });

        // 更新字段列表
        this.templateFields = detailedFields;

        // 初始化表单数据
        this.initializeFormData(detailedFields);

        console.log("字段详情加载完成:", detailedFields);
      } catch (error) {
        console.error("获取字段详情失败:", error);
      }
    },

    // 加载客户字段详细信息
    async loadCustomerFieldDetails(fieldIds) {
      try {
        // 并行获取所有字段的详细信息
        const fieldPromises = fieldIds.map((fieldId) =>
          getfieldInfo({ formFieldId: fieldId })
        );

        const fieldResponses = await Promise.all(fieldPromises);

        // 构建客户字段详情列表，保持原有顺序
        const detailedFields = [];
        fieldResponses.forEach((response, index) => {
          if (response && response.result) {
            detailedFields.push(response.result);
          }
        });

        // 更新客户字段列表
        this.customerTemplateFields = detailedFields;

        // 初始化客户表单数据
        this.initializeCustomerFormData(detailedFields);

        console.log("客户字段详情加载完成:", detailedFields);
      } catch (error) {
        console.error("获取客户字段详情失败:", error);
      }
    },

    // 获取字段标签
    getFieldLabel(field) {
      let label = field.displayName;
      // if (field.isSystem === 1) {
      //   label += " (系统)";
      // }
      return label;
    },

    // 初始化表单数据
    initializeFormData(fields) {
      // 清空现有表单数据
      this.fieldsForm = {};

      // 动态生成验证规则
      const dynamicRules = {};

      // 解析已保存的contactContext数据
      let savedData = {};
      if (this.receiveInfo && this.receiveInfo.contactContext) {
        try {
          savedData = JSON.parse(this.receiveInfo.contactContext);
          console.log("解析到的已保存会话数据:", savedData);
        } catch (error) {
          console.warn("解析contactContext失败:", error);
          savedData = {};
        }
      }

      // 为每个字段初始化默认值和验证规则
      fields.forEach((field) => {
        // 初始化字段值 - 优先使用已保存的数据
        const savedValue = savedData[field.fieldName];

        if (savedValue !== undefined && savedValue !== null) {
          // 使用已保存的值
          this.fieldsForm[field.fieldName] = savedValue;
        } else {
          // 使用默认值
          if (field.editorType === "CHECKBOX") {
            this.fieldsForm[field.fieldName] = [];
          } else if (field.editorType === "RADIO") {
            this.fieldsForm[field.fieldName] = "";
          } else if (field.editorType === "NUMBER") {
            this.fieldsForm[field.fieldName] = null;
          } else if (field.editorType === "SELECT") {
            // 下拉框初始化
            const selectMode = this.getSelectMode(field);
            this.fieldsForm[field.fieldName] =
              selectMode === "multiple" ? [] : "";
          } else {
            this.fieldsForm[field.fieldName] = "";
          }
        }

        // 生成验证规则
        if (field.isRequired === 1) {
          dynamicRules[field.fieldName] = [
            {
              required: true,
              message: `${field.displayName}不能为空`,
              trigger: ["SELECT", "RADIO", "CHECKBOX"].includes(
                field.editorType
              )
                ? "change"
                : "blur",
            },
          ];

          // 添加长度验证
          if (field.minLength && field.minLength > 0) {
            dynamicRules[field.fieldName].push({
              min: field.minLength,
              message: `${field.displayName}至少需要${field.minLength}个字符`,
              trigger: "blur",
            });
          }

          if (field.maxLength && field.maxLength > 0) {
            dynamicRules[field.fieldName].push({
              max: field.maxLength,
              message: `${field.displayName}不能超过${field.maxLength}个字符`,
              trigger: "blur",
            });
          }
        }
      });

      // 更新验证规则
      this.rules = { ...this.rules, ...dynamicRules };
      console.log(this.fieldsForm, "会话表单数据(含已保存数据)");
      console.log(this.rules, "验证规则");
    },

    // 初始化客户表单数据
    initializeCustomerFormData(fields) {
      // 清空现有客户表单数据
      this.customerFieldsForm = {};

      // 动态生成客户验证规则
      const dynamicCustomerRules = {};

      // 解析已保存的customerContext数据
      let savedCustomerData = {};
      if (this.customerDetailData && this.customerDetailData.customerContext) {
        try {
          savedCustomerData = JSON.parse(
            this.customerDetailData.customerContext
          );
          console.log("解析到的已保存客户数据:", savedCustomerData);
        } catch (error) {
          console.warn("解析customerContext失败:", error);
          savedCustomerData = {};
        }
      }

      // 为每个字段初始化默认值和验证规则
      fields.forEach((field) => {
        // 初始化字段值 - 优先使用已保存的数据
        const savedValue = savedCustomerData[field.fieldName];

        if (savedValue !== undefined && savedValue !== null) {
          // 使用已保存的值
          this.customerFieldsForm[field.fieldName] = savedValue;
        } else {
          // 使用默认值
          if (field.editorType === "CHECKBOX") {
            this.customerFieldsForm[field.fieldName] = [];
          } else if (field.editorType === "RADIO") {
            this.customerFieldsForm[field.fieldName] = "";
          } else if (field.editorType === "NUMBER") {
            this.customerFieldsForm[field.fieldName] = null;
          } else if (field.editorType === "SELECT") {
            // 下拉框初始化
            const selectMode = this.getSelectMode(field);
            this.customerFieldsForm[field.fieldName] =
              selectMode === "multiple" ? [] : "";
          } else {
            this.customerFieldsForm[field.fieldName] = "";
          }
        }

        // 生成验证规则
        if (field.isRequired === 1) {
          dynamicCustomerRules[field.fieldName] = [
            {
              required: true,
              message: `${field.displayName}不能为空`,
              trigger: ["SELECT", "RADIO", "CHECKBOX"].includes(
                field.editorType
              )
                ? "change"
                : "blur",
            },
          ];

          // 添加长度验证
          if (field.minLength && field.minLength > 0) {
            dynamicCustomerRules[field.fieldName].push({
              min: field.minLength,
              message: `${field.displayName}至少需要${field.minLength}个字符`,
              trigger: "blur",
            });
          }

          if (field.maxLength && field.maxLength > 0) {
            dynamicCustomerRules[field.fieldName].push({
              max: field.maxLength,
              message: `${field.displayName}不能超过${field.maxLength}个字符`,
              trigger: "blur",
            });
          }
        }
      });

      // 更新客户验证规则
      this.customerRules = { ...dynamicCustomerRules };
      console.log(this.customerFieldsForm, "客户表单数据(含已保存数据)");
      console.log(this.customerRules, "客户验证规则");
    },

    // 保存会话信息
    async saveSessionInfo() {
      try {
        // 检查是否有选中的会话
        if (!this.selectedConversation) {
          // @ts-ignore
          this.$modal.msgWarning("请先选择一个会话");
          return;
        }

        // 验证会话表单
        if (this.$refs.fieldsFormRef && this.templateFields.length > 0) {
          try {
            const sessionValid = await this.$refs.fieldsFormRef.validate();
            if (!sessionValid) {
              // @ts-ignore
              this.$modal.msgError("请完善会话信息必填项");
              return;
            }
          } catch (error) {
            console.error("会话表单验证失败:", error);
            // @ts-ignore
            this.$modal.msgError("请完善会话信息必填项");
            return;
          }
        }

        if (this.templateFields.length === 0) {
          // @ts-ignore
          this.$modal.msgWarning("没有需要保存的会话信息");
          return;
        }

        // 准备会话信息保存数据
        const sessionData = {
          contactId: this.selectedConversation.contactId,
          formTemplateId: this.receiveInfo.formTemplateId,
          contactContext: JSON.stringify(this.fieldsForm),
        };

        // 调用会话信息保存接口
        const res = await postsessionInfo(sessionData);
        if (res.status == 0) {
          // @ts-ignore
          this.$modal.msgError(res.message);
        } else {
          console.log("保存成功 - 会话数据:", sessionData);
          // @ts-ignore
          this.$modal.msgSuccess("会话信息保存成功");
        }
      } catch (error) {
        console.error("保存会话信息失败:", error);
        // @ts-ignore
        this.$modal.msgError("保存会话信息失败");
      }
    },

    // 保存客户信息的方法
    async saveCustomerInfo() {
      try {
        // 检查是否有选中的会话
        if (!this.selectedConversation) {
          // @ts-ignore
          this.$modal.msgWarning("请先选择一个会话");
          return;
        }

        // 验证客户表单
        if (
          this.$refs.customerFormRef &&
          this.customerTemplateFields.length > 0
        ) {
          try {
            // @ts-ignore
            const customerValid = await this.$refs.customerFormRef.validate();
            if (!customerValid) {
              // @ts-ignore
              this.$modal.msgError("请完善客户信息必填项");
              return;
            }
          } catch (error) {
            console.error("客户表单验证失败:", error);
            // @ts-ignore
            this.$modal.msgError("请完善客户信息必填项");
            return;
          }
        }

        if (this.customerTemplateFields.length === 0) {
          // @ts-ignore
          this.$modal.msgWarning("没有需要保存的客户信息");
          return;
        }

        // 准备客户信息保存数据
        const customerData = {
          customerId: this.receiveInfo.customerId,
          formTemplateId: this.customerDetailData.formTemplateId,
          customerContext: JSON.stringify(this.customerFieldsForm),
        };

        // 调用客户信息保存接口
        const res = await putcustomerInfo(customerData);
        if (res.status == 0) {
          // @ts-ignore
          this.$modal.msgError(res.message);
        } else {
          console.log("保存成功 - 会话数据:", res);
          // @ts-ignore
          this.$modal.msgSuccess("客户信息保存成功");
        }
        console.log("保存成功 - 客户数据:", customerData);
      } catch (error) {
        console.error("保存客户信息失败:", error);
        // @ts-ignore
        this.$modal.msgError("保存客户信息失败");
      }
    },
    // 加载历史消息
    async loadHistoryMessages(item, store) {
      try {
        console.log("开始获取历史消息");
        const historyMessages = await this.fetchGroupHistoryMessages(
          item,
          store
        );

        if (historyMessages && historyMessages.length > 0) {
          console.log("成功获取历史消息:", historyMessages.length, "条");
        } else {
          console.log("未获取到历史消息");
        }
      } catch (error) {
        console.warn("获取历史消息失败:", error);

        // 如果是权限问题，显示友好提示
        if (this.isTeamMemberNotExistError(error)) {
          setTimeout(() => {
            const groupName = item.nickName || "群聊";
            console.log(
              `已进入群聊"${groupName}"，但管理员账号未加入该群聊，无法查看历史消息。\n\n可以正常收发新消息。如需查看历史消息，请联系群主添加管理员账号。`
            );
          }, 500);
        }
      }
    },

    // 设置全局错误处理
    setupGlobalErrorHandler() {
      try {
        const { store } = this.$uikit.getStateContext();

        // 监听云信SDK的错误事件
        if (store && store.msgStore) {
          const originalGetHistoryMsgActive =
            store.msgStore.getHistoryMsgActive;

          if (originalGetHistoryMsgActive) {
            store.msgStore.getHistoryMsgActive = async function (params) {
              try {
                return await originalGetHistoryMsgActive.call(this, params);
              } catch (error) {
                // 检查是否为群成员不存在错误
                if (
                  error &&
                  (error.code === 109404 ||
                    error.code === "109404" ||
                    (error.message &&
                      error.message.includes("team member not exist")))
                ) {
                  console.log(
                    "全局拦截：群成员不存在错误，返回空结果避免错误提示"
                  );
                  return [];
                }
                throw error;
              }
            };
            console.log("已设置全局错误处理，拦截群成员不存在错误");
          }
        }
      } catch (error) {
        console.warn("设置全局错误处理失败:", error);
      }
    },

    // 检查是否为群聊不存在错误
    isGroupChatNotExistError(error) {
      console.log("检查是否为群聊不存在错误");
      const errorMessage = error.message || error.toString() || "";
      const errorCode = error.code || error.errorCode || "";
      console.log("检查错误类型:", { errorMessage, errorCode, error });
      return (
        errorMessage.includes("群聊不存在") ||
        errorMessage.includes("team not exist") ||
        errorMessage.includes("conversation not found") ||
        errorMessage.includes("该群聊不存在") ||
        errorMessage.includes("该群聊已不存在") ||
        errorMessage.includes("群聊已不存在") ||
        errorMessage.includes("team does not exist") ||
        errorMessage.includes("team not found") ||
        errorCode === "404" ||
        errorCode === "TEAM_NOT_EXIST" ||
        errorCode === "CONVERSATION_NOT_FOUND"
      );
    },

    // 检查是否为群成员不存在错误（管理端未加入群聊）
    isTeamMemberNotExistError(error) {
      console.log("检查是否为群成员不存在错误（管理端未加入群聊）");
      const errorMessage = error.message || error.toString() || "";
      const errorCode = error.code || error.errorCode || "";
      console.log("检查群成员错误类型:", { errorMessage, errorCode, error });
      return (
        errorMessage.includes("team member not exist") ||
        errorMessage.includes("群成员不存在") ||
        errorCode === "109404" ||
        errorCode === 109404
      );
    },

    // 使用云信SDK获取群聊历史消息
    async fetchGroupHistoryMessages(item, store) {
      try {
        console.log("开始获取群聊历史消息:", item.chatInfo.chatTeamId);

        const conversationId = `${this.initOptions.account}|2|${item.chatInfo.chatTeamId}`;
        console.log("会话ID:", conversationId);

        // 使用云信SDK的MsgStore.getHistoryMsgActive方法获取历史消息
        const msgStore = store.msgStore;

        if (msgStore && typeof msgStore.getHistoryMsgActive === "function") {
          try {
            const params = {
              conversationId: conversationId,
              endTime: Date.now(), // 当前时间戳
              limit: 50, // 获取最近50条消息
            };
            console.log("调用getHistoryMsgActive，参数:", params);
            // 调用getHistoryMsgActive方法
            const historyResult = await msgStore.getHistoryMsgActive(params);
            console.log(
              "getHistoryMsgActive返回结果:",
              historyResult ? historyResult.length : 0,
              "条消息"
            );
            if (historyResult && historyResult.length > 0) {
              console.log(`成功获取群聊历史消息 ${historyResult.length} 条`);
              return historyResult;
            } else {
              console.log("未获取到群聊历史消息，可能是新群聊或没有历史消息");
              return [];
            }
          } catch (historyError) {
            console.warn("getHistoryMsgActive调用失败:", historyError);
            // 检查是否为群成员不存在错误
            if (this.isTeamMemberNotExistError(historyError)) {
              console.log("检测到权限问题：管理端未加入群聊");
              throw historyError; // 抛出错误让上层处理
            }
            // 返回空数组
            console.log("无法获取历史消息，返回空数组");
            return [];
          }
        } else {
          console.warn("msgStore或getHistoryMsgActive方法不可用", store);
        }
      } catch (error) {
        console.error("获取群聊历史消息失败:", error);
        throw error; // 重新抛出错误让上层处理
      }
    },
  },
};
</script>

<style module>
body {
  background: #d8dee5;
}

.containerWrapper {
  width: 100%;
  height: calc(100vh - 87px);
  overflow: auto;
  display: flex;
}

.container {
  min-width: 870px;
  /* min-width: 1370px; */
  height: 810px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  background: #fff;
}

.header {
  width: 100%;
  /* height: 60px; */
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e8e8e8;
}

.search {
  width: 50%;
}

.add {
  margin-left: 20px;
}

.content {
  width: 100%;
  height: 810px;
  display: flex;
}

.left {
  width: 60px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  min-width: 60px;
}

.avatar-icon {
  margin: 20px 0 25px 0;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
}

.iconfont {
  font-size: 24px;
}

.chat-icon,
.contact-icon {
  margin: 0 0 25px 0;
  font-size: 22px;
  color: rgba(0, 0, 0, 0.6);
  height: 45px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.active {
  color: #2a6bf2;
}

.logout-icon {
  position: absolute;
  bottom: 10px;
  font-size: 22px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.icon-label {
  font-size: 12px;
  text-align: center;
}

.right {
  flex: 1;
  display: flex;
}

.right-list {
  width: 300px;
  height: 100%;
  border-right: 1px solid #e8e8e8;
}

.right-content {
  flex: 1;
}

.collect {
  width: 100%;
  height: 100%;
}

.collectRight {
  width: 100%;
  height: 100%;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
}

.tab.activeTwo {
  font-weight: bold;
  color: #409eff;
  /* Element Plus 主色 */
  border-bottom: 2px solid #409eff;
}

.welcome-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.welcome-actions .el-button {
  border-radius: 6px;
}

/* 聊天区域欢迎页面样式 */
.chat-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.welcome-image {
  width: 160px;
  height: 160px;
  margin-bottom: 24px;
  opacity: 0.7;
}

.welcome-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.welcome-subtitle {
  font-size: 14px;
  color: #888;
}

:deep(.chat-action-wrap) {
  display: none !important;
}
</style>
