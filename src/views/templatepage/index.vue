<template>
  <!-- 工单模版 -->
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="搜索" prop="sear">
        <el-input
          v-model="queryParams.sear"
          placeholder="请输入搜索内容"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="templateStatus">
        <el-select
          v-model="queryParams.templateStatus"
          placeholder="请选择状态"
          clearable
          style="width: 240px"
        >
          <el-option
            v-for="dict in templateStatusList"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd"
          >新增</el-button
        >
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
      :data="chatdetailList"
      @selection-change="handleSelectionChange"
    >
      <!-- <el-table-column type="selection" width="55" align="center" /> -->
      <el-table-column label="模版ID" prop="formTemplateId" align="center" />
      <el-table-column
        label="模版名称"
        prop="templateName"
        :show-overflow-tooltip="true"
        align="center"
      />
      <el-table-column
        label="状态"
        prop="templateStatus"
        :show-overflow-tooltip="true"
        align="center"
        width="80"
      >
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.templateStatus === 10"
            >上线</el-tag
          >
          <el-tag type="info" v-if="scope.row.templateStatus === 20"
            >下线</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column label="编辑人" align="center" width="400">
        <template #default="scope">
          {{ scope.row.editorInstanceUsersId }} -
          {{ scope.row.editorInstanceUsersNickName }}
        </template>
      </el-table-column>

      <el-table-column label="编辑时间" prop="updateTime" align="center">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-tooltip content="详情" placement="top">
            <el-button link type="primary" @click="handleEdit(scope.row)"
              >查看</el-button
            >
          </el-tooltip>
          <el-tooltip content="上下线" placement="top">
            <el-button link type="primary" @click="handleOnline(scope.row)">{{
              scope.row.templateStatus === 10 ? "下线" : "上线"
            }}</el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button link type="primary" @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 模板字段管理器弹框 -->
    <el-dialog
      v-model="dialogFormVisible"
      :title="dialogTitle"
      width="95%"
      top="2vh"
      class="template-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="template-field-manager">
        <div class="content-wrapper">
          <!-- 左侧配置区域 -->
          <div class="config-section">
            <div class="form-section">
              <!-- 模板名称 -->
              <div class="form-item">
                <label class="form-label">模板名称 <span class="required">*</span></label>
                <el-input
                  v-model="templateForm.templateName"
                  placeholder="请输入模板名称"
                  clearable
                />
              </div>

              <!-- 字段选择 - 移除拖拽功能 -->
              <div class="form-item">
                <label class="form-label">选择模板包含字段</label>
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索字段"
                  :prefix-icon="Search"
                  clearable
                  class="search-input"
                />
                
                <!-- 字段列表 - 不使用 Draggable -->
                <div class="fields-container">
                  <div
                    v-for="field in filteredFields"
                    :key="field.formFieldId"
                    :class="getFieldItemClass(field)"
                    @click="handleFieldToggle(field)"
                  >
                    <!-- 复选框 -->
                    <el-checkbox
                      :model-value="selectedFields[field.formFieldId]"
                      :disabled="field.isSystem === 1"
                      @change="(val) => handleCheckboxChange(field, val)"
                    />
                    
                    <!-- 字段信息 -->
                    <div class="field-info">
                      <div class="field-main">
                        <el-icon class="field-icon">
                          <component :is="getFieldIcon(field.editorType)" />
                        </el-icon>
                        
                        <span class="field-name">{{ field.displayName }}</span>
                        
                        <!-- 系统字段标签 -->
                        <el-tag
                          v-if="field.isSystem === 1"
                          type="warning"
                          size="small"
                          class="system-tag"
                        >
                          系统字段
                        </el-tag>
                        
                        <!-- 必填标识 -->
                        <span
                          v-if="field.isRequired === 1"
                          class="required-mark"
                        >*</span>
                      </div>
                      
                      <div class="field-type">
                        {{ field.editorTypeStr }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="!hasSelectedFields" class="error-tip">
                  请选择模板字段
                </div>
              </div>

              <!-- 节点配置 -->
              <div class="form-item">
                <label class="form-label">配置工单节点 <span class="required">*</span></label>

                <!-- 节点列表 -->
                <div class="nodes-container">
                  <!-- 开始节点（固定，不可拖动） -->
                  <div
                    v-for="node in startNodes"
                    :key="node.id"
                    :class="getNodeItemClass(node)"
                  >
                    <!-- 固定节点图标 -->
                    <el-icon class="node-fixed-icon">
                      <Lock />
                    </el-icon>

                    <!-- 节点信息 -->
                    <div class="node-info">
                      <div class="node-main">
                        <el-icon class="node-icon">
                          <component :is="getNodeIcon(node.taskType)" />
                        </el-icon>

                        <el-input
                          v-model="node.taskName"
                          placeholder="请输入节点名称"
                          class="node-name-input"
                          @blur="validateNodeName(node)"
                        />

                        <el-tag type="success" size="small">开始节点</el-tag>
                      </div>
                    </div>
                  </div>

                  <!-- 可拖动的中间节点 -->
                  <Draggable
                    v-model="middleNodes"
                    @start="onNodeDragStart"
                    @end="onNodeDragEnd"
                    item-key="id"
                    handle=".node-drag-handle"
                  >
                    <template #item="{ element: node, index }">
                      <div
                        :key="node.id"
                        :class="getNodeItemClass(node)"
                      >
                        <!-- 拖拽手柄 -->
                        <el-icon class="node-drag-handle">
                          <Grid />
                        </el-icon>

                        <!-- 节点信息 -->
                        <div class="node-info">
                          <div class="node-main">
                            <el-icon class="node-icon">
                              <component :is="getNodeIcon(node.taskType)" />
                            </el-icon>

                            <el-input
                              v-model="node.taskName"
                              placeholder="请输入节点名称"
                              class="node-name-input"
                              @blur="validateNodeName(node)"
                            />

                            <el-tag type="info" size="small">自定义节点</el-tag>
                          </div>
                        </div>

                        <!-- 删除按钮 -->
                        <el-button
                          type="danger"
                          size="small"
                          :icon="Delete"
                          circle
                          @click="handleDeleteMiddleNode(index)"
                        />
                      </div>
                    </template>
                  </Draggable>

                  <!-- 结束节点（固定，不可拖动） -->
                  <div
                    v-for="node in endNodes"
                    :key="node.id"
                    :class="getNodeItemClass(node)"
                  >
                    <!-- 固定节点图标 -->
                    <el-icon class="node-fixed-icon">
                      <Lock />
                    </el-icon>

                    <!-- 节点信息 -->
                    <div class="node-info">
                      <div class="node-main">
                        <el-icon class="node-icon">
                          <component :is="getNodeIcon(node.taskType)" />
                        </el-icon>

                        <el-input
                          v-model="node.taskName"
                          placeholder="请输入节点名称"
                          class="node-name-input"
                          @blur="validateNodeName(node)"
                        />

                        <el-tag type="danger" size="small">结束节点</el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 添加节点按钮 -->
                <el-button
                  type="primary"
                  :icon="Plus"
                  @click="handleAddNode"
                  class="add-node-btn"
                >
                  添加节点
                </el-button>

                <div v-if="!hasValidNodes" class="error-tip">
                  请至少配置开始节点和结束节点
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧预览区域 -->
          <div class="preview-section">
            <div class="preview-header">
              <el-icon><View /></el-icon>
              <h2>预览效果</h2>
            </div>

            <el-card class="preview-card">
              <!-- 无字段时的占位 -->
              <div v-if="selectedFieldsList.length === 0" class="empty-preview">
                <el-empty description="请先选择字段来预览表单效果" />
              </div>

              <!-- 表单预览 - 添加拖拽功能 -->
              <div v-else class="form-preview">
                <h3 class="preview-title">{{ templateForm.templateName || '未命名模板' }}</h3>
                
                <!-- 使用 Draggable -->
                <Draggable
                  v-model="sortedSelectedFields"
                  @start="onDragStart"
                  @end="onDragEnd"
                  item-key="formFieldId"
                  handle=".drag-handle"
                  :disabled="false"
                  ghost-class="field-ghost"
                  chosen-class="field-chosen"
                  drag-class="field-drag"
                >
                  <template #item="{ element: field }">
                    <div
                      :key="field.formFieldId"
                      :class="getPreviewFieldClass(field)"
                    >
                      <!-- 拖拽手柄 - 只对非系统字段显示 -->
                      <div
                        v-if="field.isSystem !== 1"
                        class="drag-handle"
                        title="拖拽排序"
                      >
                        <el-icon><Grid /></el-icon>
                      </div>
                      
                      <!-- 表单项 -->
                      <el-form-item
                        :label="getFieldLabel(field)"
                        :required="field.isRequired === 1"
                        class="preview-form-item"
                      >
                        <!-- 单行文本 -->
                        <el-input
                          v-if="field.editorType === 'TEXT'"
                          v-model="previewFormData[field.fieldName]"
                          :placeholder="`请输入${field.displayName}`"
                        />
                        
                        <!-- 多行文本 -->
                        <el-input
                          v-else-if="field.editorType === 'TEXTAREA'"
                          v-model="previewFormData[field.fieldName]"
                          type="textarea"
                          :rows="3"
                          :placeholder="`请输入${field.displayName}`"
                        />
                        
                        <!-- 下拉框 -->
                        <el-select
                          v-else-if="field.editorType === 'SELECT'"
                          v-model="previewFormData[field.fieldName]"
                          :placeholder="`请选择${field.displayName}`"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="option in getFieldDataSource(field)"
                            :key="option.id"
                            :label="option.label"
                            :value="option.value"
                          />
                        </el-select>
                        
                        <!-- 单选 -->
                        <el-radio-group
                          v-else-if="field.editorType === 'RADIO'"
                          v-model="previewFormData[field.fieldName]"
                        >
                          <el-radio
                            v-for="option in getFieldDataSource(field)"
                            :key="option.id"
                            :label="option.value"
                          >
                            {{ option.label }}
                          </el-radio>
                        </el-radio-group>
                        
                        <!-- 多选 -->
                        <el-checkbox-group
                          v-else-if="field.editorType === 'CHECKBOX'"
                          v-model="previewFormData[field.fieldName]"
                        >
                          <el-checkbox
                            v-for="option in getFieldDataSource(field)"
                            :key="option.id"
                            :label="option.value"
                          >
                            {{ option.label }}
                          </el-checkbox>
                        </el-checkbox-group>
                        
                        <!-- 数字 -->
                        <el-input-number
                          v-else-if="field.editorType === 'NUMBER'"
                          v-model="previewFormData[field.fieldName]"
                          style="width: 100%"
                        />
                        
                        <!-- 日期 -->
                        <el-date-picker
                          v-else-if="field.editorType === 'DATE'"
                          v-model="previewFormData[field.fieldName]"
                          type="date"
                          :placeholder="`选择${field.displayName}`"
                          style="width: 100%"
                        />
                        
                        <!-- 默认文本框 -->
                        <el-input
                          v-else
                          v-model="previewFormData[field.fieldName]"
                          :placeholder="`请输入${field.displayName}`"
                        />
                        
                        <!-- 字段描述 -->
                        <div v-if="field.description" class="field-description">
                          {{ field.description }}
                        </div>
                      </el-form-item>
                    </div>
                  </template>
                </Draggable>
              </div>
            </el-card>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button v-if="!isEditMode" type="primary" @click="handleSave" :loading="saveLoading">
            {{ isEditMode ? '更新模板' : '保存模板' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref, toRefs, computed, watch } from "vue";
import { Search, View, Grid, Document, Calendar, User, Phone, Select, EditPen, Plus, Delete, VideoPlay, Flag, Setting, Lock } from '@element-plus/icons-vue'
import Draggable from 'vuedraggable'
import {
  deltemplateInfo,
  getTemplateDetail,
  gettemplateInfo,
  puttemplateInfo,
  posttemplateInfo,
  getfieldList,
} from "@/api/contact/templatepage";

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sear: undefined,
    templateStatus: undefined,
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

const templateStatusList = ref([
  {
    value: "10",
    label: "上线",
  },
  {
    value: "20",
    label: "下线",
  },
]);

const total = ref(0);
const loading = ref(false);
const saveLoading = ref(false);
const dialogTitle = ref("");
const dialogFormVisible = ref(false);
const showSearch = ref(true);
const isEditMode = ref(false);

const { queryParams, form, rules } = toRefs(data);
const dateRange = ref([]);
const { proxy } = getCurrentInstance();
const chatdetailList = ref([]);

// 模板字段
const templateForm = reactive({
  templateName: '',
  description: '',
  formTemplateId: null
});
const searchKeyword = ref('');
const selectedFields = ref({});
const previewFormData = reactive({});

// 字段列表数据
const fieldList = ref([]);

// 节点配置数据
const taskFroms = ref([]);

// 计算属性
const filteredFields = computed(() => {
  const keyword = searchKeyword.value || '';
  if (!keyword.trim()) {
    return fieldList.value
  }
  return fieldList.value.filter(field => 
    (field.displayName || '').includes(keyword) ||
    (field.fieldName || '').includes(keyword) ||
    (field.editorTypeStr || '').includes(keyword)
  )
})

const selectedFieldsList = computed(() => {
  return fieldList.value.filter(field => selectedFields.value[field.formFieldId])
})

// 排序后的选中字段列表
const sortedSelectedFields = computed({
  get() {
    return selectedFieldsList.value
  },
  set(newValue) {
    // 更新字段顺序
    const fieldMap = new Map()
    fieldList.value.forEach(field => {
      fieldMap.set(field.formFieldId, field)
    })
    
    // 重新排列 fieldList 中的顺序
    const newFieldList = [...fieldList.value]
    const selectedIds = newValue.map(field => field.formFieldId)
    const unselectedFields = newFieldList.filter(field => !selectedIds.includes(field.formFieldId))
    
    // 将选中的字段按新顺序排列，未选中的字段保持原位置
    fieldList.value = [
      ...newValue,
      ...unselectedFields
    ]
  }
})

const hasSelectedFields = computed(() => {
  return selectedFieldsList.value.length > 0
})

const hasValidNodes = computed(() => {
  const hasStart = taskFroms.value.some(node => node.taskType === 'TICKET_START')
  const hasFinish = taskFroms.value.some(node => node.taskType === 'TICKET_FINISH')
  return hasStart && hasFinish && taskFroms.value.every(node => node.taskName.trim())
})

// 分离不同类型的节点
const startNodes = computed(() => {
  return taskFroms.value.filter(node => node.taskType === 'TICKET_START')
})

const middleNodes = computed({
  get() {
    return taskFroms.value.filter(node => node.taskType === 'APPROVAL')
  },
  set(value) {
    // 重新组合所有节点：开始节点 + 中间节点 + 结束节点
    const start = taskFroms.value.filter(node => node.taskType === 'TICKET_START')
    const end = taskFroms.value.filter(node => node.taskType === 'TICKET_FINISH')
    taskFroms.value = [...start, ...value, ...end]
  }
})

const endNodes = computed(() => {
  return taskFroms.value.filter(node => node.taskType === 'TICKET_FINISH')
})

// 模板字段管理器方法
const getFieldIcon = (editorType) => {
  const iconMap = {
    'TEXT': Document,
    'TEXTAREA': Document,
    'SELECT': Select,
    'RADIO': User,
    'CHECKBOX': Phone,
    'NUMBER': EditPen,
    'DATE': Calendar
  }
  return iconMap[editorType] || Document
}

const getFieldItemClass = (field) => {
  const baseClass = 'field-item'
  const isSelected = selectedFields.value[field.formFieldId]
  
  return [
    baseClass,
    {
      'field-item--selected': isSelected,
      'field-item--system': field.isSystem === 1
    }
  ]
}

// 获取预览字段的样式类
const getPreviewFieldClass = (field) => {
  return [
    'preview-field-item',
    {
      'preview-field-item--system': field.isSystem === 1,
      'preview-field-item--draggable': field.isSystem !== 1
    }
  ]
}

const getFieldLabel = (field) => {
  let label = field.displayName
  if (field.isSystem === 1) {
    label += ' (系统)'
  }
  return label
}

// 解析字段属性
const parseFieldAttributes = (field) => {
  try {
    if (field.attributes && typeof field.attributes === 'string') {
      return JSON.parse(field.attributes)
    } else if (field.attributes && typeof field.attributes === 'object') {
      return field.attributes
    }
    return {}
  } catch (error) {
    console.error('解析字段属性失败:', field.fieldName, error)
    return {}
  }
}

// 获取字段的数据源
const getFieldDataSource = (field) => {
  const attributes = parseFieldAttributes(field)
  return attributes.DataSource || []
}

const handleFieldToggle = (field) => {
  if (field.isSystem === 1) return
  
  const isSelected = selectedFields.value[field.formFieldId]
  selectedFields.value[field.formFieldId] = !isSelected
  
  if (!isSelected) {
    if (field.editorType === 'CHECKBOX') {
      previewFormData[field.fieldName] = []
    } else {
      previewFormData[field.fieldName] = ''
    }
  } else {
    delete previewFormData[field.fieldName]
  }
}

const handleCheckboxChange = (field, value) => {
  if (field.isSystem === 1) return
  
  selectedFields.value[field.formFieldId] = value
  
  if (value) {
    if (field.editorType === 'CHECKBOX') {
      previewFormData[field.fieldName] = []
    } else {
      previewFormData[field.fieldName] = ''
    }
  } else {
    delete previewFormData[field.fieldName]
  }
}

// 拖拽事件处理
const onDragStart = () => {
  console.log('开始拖拽')
}

const onDragEnd = (event) => {
  console.log('拖拽结束', event)
  // 可以在这里添加保存排序的逻辑
}

// 节点相关方法
const getNodeIcon = (taskType) => {
  const iconMap = {
    'TICKET_START': VideoPlay,
    'TICKET_FINISH': Flag,
    'APPROVAL': Setting
  }
  return iconMap[taskType] || Setting
}

const getNodeItemClass = (node) => {
  return [
    'node-item',
    {
      'node-item--error': !node.taskName.trim() || !node.taskType
    }
  ]
}

const onNodeDragStart = () => {
  // 节点拖拽开始
}

const onNodeDragEnd = () => {
  // 节点拖拽结束
}

const handleAddNode = () => {
  const newNode = {
    id: Date.now().toString(),
    taskName: '自定义节点',
    taskType: 'APPROVAL'
  }
  // 插入到结束节点之前
  const endIndex = taskFroms.value.findIndex(node => node.taskType === 'TICKET_FINISH')
  if (endIndex !== -1) {
    taskFroms.value.splice(endIndex, 0, newNode)
  } else {
    taskFroms.value.push(newNode)
  }
}

const handleDeleteMiddleNode = (index) => {
  // 删除中间节点（只删除APPROVAL类型的节点）
  const middleNodeIndex = taskFroms.value.findIndex((node, i) =>
    node.taskType === 'APPROVAL' &&
    taskFroms.value.filter(n => n.taskType === 'APPROVAL').indexOf(node) === index
  )
  if (middleNodeIndex !== -1) {
    taskFroms.value.splice(middleNodeIndex, 1)
  }
}

const validateNodeName = (node) => {
  if (!node.taskName.trim()) {
    node.taskName = node.taskType === 'TICKET_START' ? '开始' :
                   node.taskType === 'TICKET_FINISH' ? '结束' : '自定义节点'
  }
}

const initializeNodes = () => {
  // 初始化默认节点
  taskFroms.value = [
    {
      id: 'start_' + Date.now(),
      taskName: '开始',
      taskType: 'TICKET_START'
    },
    {
      id: 'finish_' + Date.now(),
      taskName: '结束',
      taskType: 'TICKET_FINISH'
    }
  ]
}

// 获取字段列表
const getFieldList = async () => {
  try {
    const res = await getfieldList({
      formGroup: "10"
    })
    if (res && res.result) {
      fieldList.value = res.result
      initializeFields()
    }
  } catch (error) {
    console.error('获取字段列表失败:', error)
    proxy.$modal.msgError('获取字段列表失败')
  }
}

const initializeFields = () => {
  // 清空选中状态
  selectedFields.value = {}
  // 清空预览数据
  Object.keys(previewFormData).forEach(key => {
    delete previewFormData[key]
  })

  // 初始化系统字段
  fieldList.value.forEach(field => {
    selectedFields.value[field.formFieldId] = field.isSystem === 1

    if (field.isSystem === 1) {
      if (field.editorType === 'CHECKBOX') {
        previewFormData[field.fieldName] = []
      } else {
        previewFormData[field.fieldName] = ''
      }
    }
  })
}

const handleSave = async () => {
  if (!templateForm.templateName.trim()) {
    proxy.$modal.msgError('请输入模板名称')
    return
  }
  
  if (!hasSelectedFields.value) {
    proxy.$modal.msgError('请至少选择一个字段')
    return
  }
  
  if (!hasValidNodes.value) {
    proxy.$modal.msgError('请配置完整的工单节点（至少包含开始节点和结束节点）')
    return
  }
  
  saveLoading.value = true
  
  try {
    // 使用排序后的字段顺序    
    const fieldIds = sortedSelectedFields.value.map(field => field.formFieldId)

    const templateData = {
      templateName: templateForm.templateName,
      description: templateForm.description || undefined, // 可选字段，空值时不传
      formGroup: "10", // 工单类型
      fieldIds: fieldIds,
      taskFroms: taskFroms.value.map(node => ({
        taskName: node.taskName,
        taskType: node.taskType
      }))
    }

    console.log('保存模板数据:', templateData)
    let resData 

    if (isEditMode.value) {
      // 编辑模式
      templateData.formTemplateId = templateForm.formTemplateId
      resData = await posttemplateInfo(templateData)
    } else {
      // 新增模式
      resData = await posttemplateInfo(templateData)
    }
    console.log('保存模板结果:', resData)

    if(resData.status == 0){
      proxy.$modal.msgError(resData.message)
      return
    }

    proxy.$modal.msgSuccess(isEditMode.value ? '更新成功' : '创建成功')
    dialogFormVisible.value = false
    getList()
  } catch (error) {
    console.error('保存失败:', error)
    proxy.$modal.msgError('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handleCancel = () => {
  dialogFormVisible.value = false
  resetTemplateForm()
}

const resetTemplateForm = () => {
  templateForm.templateName = ''
  templateForm.description = ''
  templateForm.formTemplateId = null
  searchKeyword.value = ''
  initializeFields()
  initializeNodes()
}

/** 查询列表 */
const getList = () => {
  loading.value = true;
  getTemplateDetail({
    formGroup: "10",
    templateStatus: queryParams.value.templateStatus,
    sear: queryParams.value.sear,
  })
    .then((res) => {
      console.log(res, "asdasdasdasdasdssdasd");
      chatdetailList.value = res.result.dataList;
      total.value = res.result.totalResult;
      setInterval(() => {
        loading.value = false;
      }, 1000);
    })
    .catch((err) => {
      console.log(err);
      loading.value = false;
    });
};

/** 表单重置 */
const reset = () => {
  form.value = {
    noticeId: undefined,
    noticeTitle: undefined,
    noticeType: undefined,
    noticeContent: undefined,
    status: "0",
  };
  proxy.resetForm("templateformRef");
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

// 多选框选中数据
const handleSelectionChange = () => {};

// 新增
const handleAdd = () => {
  resetTemplateForm();
  isEditMode.value = false;
  dialogTitle.value = "新建模板";
  dialogFormVisible.value = true;
};

// 查看详情
const handleEdit = (data) => {
  resetTemplateForm();
  isEditMode.value = true;
  templateForm.formTemplateId = data.formTemplateId;
  templateForm.templateName = data.templateName;

  gettemplateInfo({
    formTemplateId: data.formTemplateId,
  })
    .then((res) => {
      dialogTitle.value = `编辑模板 - ${data.templateName}`;
      dialogFormVisible.value = true;
      console.log("查看详情", res);

      // 设置模板描述
      if (res.result && res.result.description) {
        templateForm.description = res.result.description;
      }

      // 根据API返回的数据设置选中的字段
      if (res.result && res.result.fieldIds) {
        res.result.fieldIds.forEach(fieldId => {
          selectedFields.value[fieldId] = true;
        });
      }

      // 设置节点数据
      if (res.result && res.result.tasks && res.result.tasks.length > 0) {
        taskFroms.value = res.result.tasks.map((task, index) => ({
          id: task.formTemplateTaskId || 'node_' + Date.now() + '_' + index,
          taskName: task.taskName,
          taskType: task.taskType,
          formTemplateTaskId: task.formTemplateTaskId, // 保存原始ID用于更新
          nextTaskId: task.nextTaskId // 保存下一个任务ID
        }));
      } else {
        // 如果没有节点数据，使用默认的开始和结束节点
        initializeNodes();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// 上下线
const handleOnline = (data) => {
  proxy.$modal
    .confirm(
      "是否确认" + (data.templateStatus === 10 ? "下线" : "上线") + "模版?"
    )
    .then(function () {
      return puttemplateInfo({
        formTemplateId: data.formTemplateId,
        templateStatus: data.templateStatus === 10 ? "20" : "10",
      });
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("操作成功");
    })
    .catch(() => {});
};

// 删除
const handleDelete = (data) => {
  proxy.$modal
    .confirm('是否确认删除名称为"' + data.templateName + '"的数据项?')
    .then(function () {
      return deltemplateInfo({formTemplateId:data.formTemplateId});
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
  getFieldList();
});
</script>

<style scoped>
/* 原有样式保持不变 */

/* 模板字段管理器样式 */
.template-dialog {
  .el-dialog__body {
    padding: 10px 20px;
  }
}

.template-field-manager {
  background-color: #f5f5f5;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.config-section {
  flex: 1;
  max-width: 50%;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}

.preview-section {
  flex: 1;
  max-width: 50%;
  padding: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.required {
  color: #f56c6c;
}

.search-input {
  margin-bottom: 12px;
}

.fields-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background-color: #fff;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fff;
}

.field-item:hover {
  border-color: #c0c4cc;
  background-color: #f8f9fa;
}

.field-item--selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.field-item--system {
  background-color: #fdf6ec;
}

.field-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.field-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-icon {
  color: #606266;
}

.field-name {
  font-weight: 500;
  color: #303133;
}

.system-tag {
  margin-left: 8px;
}

.required-mark {
  color: #f56c6c;
  font-weight: bold;
  margin-left: 4px;
}

.field-type {
  font-size: 12px;
  color: #909399;
}

.error-tip {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.preview-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.preview-card {
  min-height: 500px;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.form-preview {
  padding: 20px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
}

.field-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 预览区域的拖拽样式 */
.preview-field-item {
  position: relative;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px;
  transition: all 0.2s;
}

.preview-field-item--draggable {
  cursor: move;
}

.preview-field-item--draggable:hover {
  border-color: #e4e7ed;
  background-color: #f8f9fa;
}

.preview-field-item--system {
  background-color: #fdf6ec;
}

.preview-field-item--system .drag-handle {
  display: none !important;
}

.drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #909399;
  cursor: move;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.drag-handle:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.preview-form-item {
  margin-bottom: 0;
  padding-right: 40px; /* 为拖拽手柄留出空间 */
}

/* 拖拽状态样式 */
.field-ghost {
  opacity: 0.5;
  background-color: #f0f9ff;
  border: 2px dashed #409eff;
}

.field-chosen {
  background-color: #ecf5ff;
  border: 1px solid #409eff;
}

.field-drag {
  opacity: 0.8;
  transform: rotate(5deg);
}

/* 系统字段特殊样式 */
.preview-field-item--system .preview-form-item {
  padding-right: 20px; 
  flex: 1;
}

.preview-field-item--system {
  display: flex;
  align-items: center;
  /* position: relative; */
}

.preview-field-item--system::after {
  content: "系统字段";
  font-size: 12px;
  color: #e6a23c;
  background-color: #fdf6ec;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 节点配置样式 */
.nodes-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background-color: #fff;
  margin-bottom: 12px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  background-color: #fff;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #c0c4cc;
  background-color: #f8f9fa;
}

.node-item--error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.node-drag-handle {
  color: #909399;
  cursor: move;
}

.node-fixed-icon {
  color: #f56c6c;
  cursor: not-allowed;
}

.node-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.node-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.node-icon {
  color: #606266;
}

.node-name-input {
  flex: 1;
  max-width: 200px;
}

.node-type-select {
  width: 150px;
}

.add-node-btn {
  width: 100%;
  margin-top: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>