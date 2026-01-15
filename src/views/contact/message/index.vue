<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="服务状态" prop="serviceStatus">
        <el-select
          v-model="queryParams.serviceStatus"
          placeholder="服务状态"
          clearable
          style="width: 240px"
        >
          <el-option
            v-for="dict in isTakeUpList"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <!-- <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:role:add']">新增</el-button> -->
      </el-col>
      <el-col :span="1.5">
        <!-- <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:role:edit']">修改</el-button> -->
      </el-col>
      <el-col :span="1.5">
        <!-- <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:role:remove']">删除</el-button> -->
      </el-col>
      <el-col :span="1.5">
        <!-- <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['system:role:export']">导出</el-button> -->
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>
    <el-table
      v-loading="loading"
      :data="conversationList"
      @selection-change="handleSelectionChange"
    >
      <!-- <el-table-column type="selection" width="55" align="center" /> -->
      <el-table-column label="会话ID" prop="contactId" width="220" />
      <el-table-column
        label="坐席"
        prop="assigneeName"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="技能组"
        prop="skillGroupName"
        :show-overflow-tooltip="true"
      />
      <!-- <el-table-column label="会话时间" prop="roleSort" width="100" /> -->
      <!-- <el-table-column label="结束时间" prop="roleSort" width="100">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column> -->
      <!-- <el-table-column label="会话时长" prop="roleSort" width="100" /> -->
      <el-table-column label="渠道名称" prop="channelName" />
      <el-table-column label="接起情况" prop="roleSort" >
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.isTakeUp === 1">已接起</el-tag>
          <el-tag type="info" v-if="scope.row.isTakeUp === 0">未接起</el-tag>
        </template>
      </el-table-column>
      <!-- <el-table-column label="结束原因" prop="roleSort" width="100" /> -->
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <!-- <el-tooltip content="修改" placement="top" v-if="scope.row.roleId !== 1">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              v-hasPermi="['system:role:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" v-if="scope.row.roleId !== 1">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
              v-hasPermi="['system:role:remove']"></el-button>
          </el-tooltip>
          <el-tooltip content="数据权限" placement="top" v-if="scope.row.roleId !== 1">
            <el-button link type="primary" icon="CircleCheck" @click="handleDataScope(scope.row)"
              v-hasPermi="['system:role:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="分配用户" placement="top" v-if="scope.row.roleId !== 1">
            <el-button link type="primary" icon="User" @click="handleAuthUser(scope.row)"
              v-hasPermi="['system:role:edit']"></el-button>
          </el-tooltip> -->
          <el-tooltip content="详情" placement="top">
            <el-button link type="primary" @click="lookdetails(scope.row)"
              >详情</el-button
            >
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.page"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
    <el-drawer
      v-model="drawer"
      title="会话详情"
      :direction="direction"
      :before-close="handleClose"
      size="60%"
    >
      <div class="drawer-content">
        <!-- 基本信息 -->
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-item">会话ID: {{ contactdetail.contactId }}</div>
          <div class="info-item">访客ID: {{ contactdetail.customerId }}</div>
          <div class="info-item">
            客户ID: {{ conversationdetail.receiverId }}
          </div>
          <div class="info-item">渠道名称: {{ contactdetail.channelName }}</div>
          <div class="info-item">
            接待坐席: {{ contactdetail.assigneeIdName }}
          </div>

          <!-- 自定义字段 -->
          <div v-if="customFields.length > 0" class="custom-fields">
            <div
              v-for="item in customFields"
              :key="item.result.formFieldId"
              class="info-item"
            >
              {{ item.result.displayName }}: {{ item.result.fieldName }}
            </div>
          </div>
        </div>

        <!-- 聊天消息 -->
        <div class="chat-section">
          <div class="chat-header">
            <h3>聊天记录</h3>
            <div class="chat-stats" v-if="chatMessages.length > 0">
              <span>共 {{ messagesPagination.total }} 条消息</span>
              <span>已显示 {{ chatMessages.length }} 条</span>
            </div>
          </div>
          <div
            v-loading="messagesLoading"
            class="chat-messages"
            v-infinite-scroll="loadMoreMessages"
            :infinite-scroll-disabled="
              !messagesPagination.hasMore || messagesLoading
            "
            :infinite-scroll-delay="1000"
            :infinite-scroll-distance="100"
            ref="chatMessagesRef"
          >
            <div
              v-if="chatMessages.length === 0 && !messagesLoading"
              class="no-messages"
            >
              暂无聊天记录
            </div>
            <div
              v-for="message in chatMessages"
              :key="message.id"
              :class="['message-item', { 'self-message': message.isFromSelf }]"
            >
              <div class="message-header">
                <span class="sender-name">{{ message.senderName }}</span>
                <span class="message-time">{{
                  formatTime(message.createTime)
                }}</span>
              </div>
              <div class="message-content">{{ message.content }}</div>
            </div>

            <!-- 加载状态提示 -->
            <div
              v-if="messagesLoading && chatMessages.length > 0"
              class="loading-more"
            >
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在加载更多消息...</span>
            </div>

            <!-- 没有更多数据提示 -->
            <div
              v-if="!messagesPagination.hasMore && chatMessages.length > 0"
              class="no-more"
            >
              没有更多消息了
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref, toRefs } from "vue";
import { Loading } from "@element-plus/icons-vue";
import {
  getcontactdetail,
  getcontactpage,
  getconversationdetail,
  getmessagepage,
} from "@/api/contact/sessionlogg";
import { getfieldInfo, gettemplateInfo } from "@/api/contact/templatepage";

const data = reactive({
  form: {},
  queryParams: {
    page: 1,
    pageSize: 10,
    serviceStatus: undefined,
  },
  rules: {
    roleName: [
      { required: true, message: "角色名称不能为空", trigger: "blur" },
    ],
    roleKey: [{ required: true, message: "权限字符不能为空", trigger: "blur" }],
    roleSort: [
      { required: true, message: "角色顺序不能为空", trigger: "blur" },
    ],
  },
});
// 自定义数组
const customFields = ref([]);
const contactdetail = ref({});
const conversationdetail = ref({});
const chatMessages = ref([]); // 聊天消息列表
const messagesLoading = ref(false); // 消息加载状态
const messagesPagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
}); // 消息分页信息
const chatMessagesRef = ref(null); // 聊天消息容器引用
const total = ref(0);
const direction = ref("rtl");
const drawer = ref(false);
const loading = ref(false);
const showSearch = ref(true);

const isTakeUpList = ref([
  {
    value: "10",
    label: "服务中",
  },
  {
    value: "20",
    label: "队列中",
  },
  {
    value: "30",
    label: "已结束",
  },
]);

const { queryParams, form, rules } = toRefs(data);
const dateRange = ref([]);
const { proxy, appContext } = getCurrentInstance();
const conversationList = ref([]);
/** 查询列表 */
const getList = () => {
  loading.value = true;
  getcontactpage(data.queryParams)
    .then((res) => {
      console.log(res, "asdasdasdasdasdssdasd");
      conversationList.value = res.result.dataList;
      total.value = res.result.totalResult;
      setInterval(() => {
        loading.value = false;
      }, 1000);
    })
    .catch((err) => {
      loading.value = false;
    });
};
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.page = 1;
  getList();
};

const handleSelectionChange = () => {};

// 查看详情
const lookdetails = async (rowData) => {
  try {
    drawer.value = true;
    messagesLoading.value = true;
    chatMessages.value = []; // 清空之前的消息
    console.log("查看详情:", rowData);

    // 联系人详情
    const contactRes = await getcontactdetail({ contactId: rowData.contactId });
    contactdetail.value = contactRes.result || {};
    console.log("联系人详情:", contactdetail.value);

    // 会话详情
    const conversationRes = await getconversationdetail({
      chatConversationId: contactRes.result?.chatConversationId,
    });
    conversationdetail.value = conversationRes.result || {};
    console.log("会话详情:", conversationdetail.value);

    // 模板详情
    if (contactRes.result?.formTemplateId) {
      const templateRes = await gettemplateInfo({
        formTemplateId: contactRes.result.formTemplateId,
      });
      console.log("模板详情:", templateRes);

      // 字段详情
      if (templateRes.result?.fieldIds?.length > 0) {
        customFields.value = await Promise.all(
          templateRes.result.fieldIds.map((fieldId) =>
            getfieldInfo({ formFieldId: fieldId })
          )
        );
        console.log("字段详情:", customFields.value);
      }
    }

    // 获取聊天消息
    if (contactRes.result?.chatConversationId) {
      await loadChatMessages(contactRes.result.chatConversationId, true);
    }
  } catch (err) {
    console.error("获取详情失败:", err);
    alert(err?.message || "获取详情失败");
  } finally {
    messagesLoading.value = false;
  }
};

// 加载聊天消息
const loadChatMessages = async (chatConversationId, isFirstLoad = false) => {
  try {
    if (isFirstLoad) {
      messagesLoading.value = true;
      messagesPagination.value.page = 1;
      chatMessages.value = [];
    } else {
      // 非首次加载时也要设置loading状态
      messagesLoading.value = true;
    }

    const messagesRes = await getmessagepage({
      chatConversationId: chatConversationId,
      page: messagesPagination.value.page,
      pageSize: messagesPagination.value.pageSize,
      sortOrder: "ASC",
    });

    console.log(
      `第${messagesPagination.value.page}页聊天消息数据:`,
      messagesRes.result
    );

    if (messagesRes.result && Array.isArray(messagesRes.result.dataList)) {
      // 处理消息数据
      const newMessages = messagesRes.result.dataList.map((msg) => ({
        id: msg.chatMessageId,
        content: formatMessageContent(msg),
        senderId: msg.senderId,
        senderName: getSenderName(msg),
        createTime: msg.sendTime,
        messageType: msg.msgType,
        senderType: msg.senderType,
        isFromSelf: msg.senderType === "AGENT", // 坐席发送的消息
      }));

      if (isFirstLoad) {
        chatMessages.value = newMessages;
      } else {
        // 追加到现有消息
        chatMessages.value = [...chatMessages.value, ...newMessages];
      }

      // 更新分页信息
      messagesPagination.value.total = messagesRes.result.totalResult || 0;
      messagesPagination.value.hasMore =
        newMessages.length === messagesPagination.value.pageSize;

      console.log(
        `${isFirstLoad ? "首次加载" : "追加加载"} ${
          newMessages.length
        } 条消息，总计 ${chatMessages.value.length} 条，还有更多: ${
          messagesPagination.value.hasMore
        }`
      );
    } else {
      console.log("未获取到聊天消息数据");
      if (isFirstLoad) {
        chatMessages.value = [];
      }
      messagesPagination.value.hasMore = false;
    }
  } catch (error) {
    console.error("加载聊天消息失败:", error);
    if (isFirstLoad) {
      chatMessages.value = [];
    }
    messagesPagination.value.hasMore = false;
  } finally {
    // 确保loading状态被重置
    messagesLoading.value = false;
  }
};

// 加载更多消息
const loadMoreMessages = async () => {
  // 防止重复加载
  if (!messagesPagination.value.hasMore || messagesLoading.value) {
    console.log("无法加载更多:", {
      hasMore: messagesPagination.value.hasMore,
      loading: messagesLoading.value,
    });
    return;
  }

  console.log(`开始加载第 ${messagesPagination.value.page + 1} 页消息`);
  messagesPagination.value.page++;
  const channelId = contactdetail.value?.channelId;
  if (channelId) {
    await loadChatMessages(channelId, false);
  }
};

// 格式化消息内容
const formatMessageContent = (msg) => {
  if (msg.msgType === "TEXT") {
    return msg.msgContent;
  } else if (msg.msgType === "CUSTOM") {
    try {
      const customData = JSON.parse(msg.msgContent);
      if (customData.type === "hot-experts") {
        return "[推荐专家]";
      }
      return "[自定义消息]";
    } catch (error) {
      return "[自定义消息]";
    }
  } else {
    return `[${msg.msgType}消息]`;
  }
};

// 获取发送者名称
const getSenderName = (msg) => {
  if (msg.senderType === "CUSTOMER") {
    return "客户";
  } else if (msg.senderType === "AGENT") {
    return "坐席";
  } else {
    return "系统";
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 解析时间（用于表格显示）
const parseTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 抽屉关闭
const handleClose = (done) => {
  drawer.value = false;
  chatMessages.value = []; // 清空消息
  // 重置分页信息
  messagesPagination.value = {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  };
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.mt {
  margin-top: 10px;
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-section {
  margin-bottom: 30px;
}

.info-section h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.info-item {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.5;
}

.custom-fields {
  margin-top: 15px;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chat-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #67c23a;
  padding-bottom: 8px;
}

.chat-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.chat-stats span {
  background-color: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.chat-messages {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.no-messages {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}

.message-item {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-item.self-message {
  background-color: #e1f3d8;
  margin-left: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.sender-name {
  font-weight: 600;
  color: #409eff;
}

.self-message .sender-name {
  color: #67c23a;
}

.message-time {
  color: #909399;
}

.message-content {
  color: #303133;
  line-height: 1.5;
  word-wrap: break-word;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载状态样式 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 15px;
  color: #409eff;
  font-size: 14px;
}

.loading-more .el-icon {
  font-size: 16px;
}

/* 没有更多数据样式 */
.no-more {
  text-align: center;
  padding: 15px 0;
  color: #c0c4cc;
  font-size: 12px;
  border-top: 1px solid #ebeef5;
  margin-top: 15px;
}
</style>
