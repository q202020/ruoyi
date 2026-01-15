<template>
  <!-- 客户信息字段 -->
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
          >新增字段</el-button
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
      <el-table-column label="字段名称" prop="displayName" align="center" />
      <el-table-column
        label="字段键值"
        prop="fieldName"
        :show-overflow-tooltip="true"
        align="center"
      />
      <el-table-column
        label="类型"
        prop="dataType"
        :show-overflow-tooltip="true"
        align="center"
        width="100"
      >
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.templateStatus === 10"
            >处理中</el-tag
          >
          <el-tag type="info" v-if="scope.row.templateStatus === 20"
            >处理完成</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column label="是否必填" align="center" prop="isRequired">
        <template #default="scope">
          <el-tag>{{ scope.row.isRequired === 1 ? "是" : "否" }}</el-tag>
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
              >编辑</el-button
            >
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

    <!-- 表单类型选择弹框 -->
    <el-dialog
      v-model="showFieldTypeDialog"
      title="选择字段类型"
      width="80%"
      :before-close="handleFieldTypeDialogClose"
    >
      <div class="form-options">
        <el-card
          v-for="option in formOptions"
          :key="option.type"
          class="form-option-card"
          shadow="hover"
          @click="selectFormType(option)"
        >
          <div class="option-content">
            <div :class="['option-icon', option.iconClass]">
              {{ option.icon }}
            </div>
            <div class="option-info">
              <h3>{{ option.title }}</h3>
              <p>{{ option.description }}</p>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 表单配置弹框 -->
    <el-dialog
      v-model="showFieldConfigDialog"
      :title="getDialogTitle()"
      width="90%"
      :before-close="handleFieldConfigDialogClose"
    >
      <div class="content-layout">
        <!-- 左侧配置区域 -->
        <div class="config-panel">
          <h3 class="panel-title">{{ getFormTypeTitle() }} 配置</h3>

          <el-form
            :model="formConfig"
            :rules="configRules"
            ref="configFormRef"
            label-width="120px"
          >
            <el-form-item label="字段名称" prop="fieldName">
              <el-input
                v-model="formConfig.fieldName"
                placeholder="请输入字段名称"
                @input="updatePreview"
              />
            </el-form-item>

            <el-form-item label="字段键值" prop="fieldKey">
              <el-input
                v-model="formConfig.fieldKey"
                :placeholder="
                  editMode
                    ? '字段键值（编辑模式下不可修改）'
                    : '请输入字段键值（仅支持英文字母）'
                "
                :disabled="editMode"
                @input="handleFieldKeyInput"
              />
              <div style="color: #909399; font-size: 12px; margin-top: 4px">
                <template v-if="editMode">
                  <el-icon style="margin-right: 4px"><Lock /></el-icon>
                  提示：编辑模式下字段键值不可修改，以确保数据一致性
                </template>
                <template v-else>
                  提示：字段键值仅支持英文字母，用于数据存储和API调用
                </template>
              </div>
            </el-form-item>

            <el-form-item label="字段描述">
              <el-input
                v-model="formConfig.description"
                type="textarea"
                :rows="3"
                placeholder="请输入字段描述"
                @input="updatePreview"
              />
            </el-form-item>

            <!-- 选项配置 -->
            <el-form-item
              v-if="
                ['dropdown', 'radio', 'checkbox'].includes(selectedFormType)
              "
              label="字段选项"
              prop="options"
            >
              <div
                v-for="(option, index) in formConfig.options"
                :key="index"
                class="option-input-group"
              >
                <div
                  style="
                    display: flex;
                    align-items: flex-end;
                    width: 100%;
                    gap: 12px;
                    margin-bottom: 12px;
                  "
                >
                  <div style="flex: 1">
                    <div
                      style="
                        font-size: 12px;
                        color: #909399;
                        margin-bottom: 4px;
                      "
                    >
                      值
                    </div>
                    <el-input
                      v-model="option.value"
                      placeholder="请输入值"
                      @input="handleOptionInput"
                      @blur="triggerOptionsValidation"
                    />
                  </div>
                  <div style="flex: 1">
                    <div
                      style="
                        font-size: 12px;
                        color: #909399;
                        margin-bottom: 4px;
                      "
                    >
                      标签
                    </div>
                    <el-input
                      v-model="option.label"
                      placeholder="请输入标签"
                      @input="handleOptionInput"
                      @blur="triggerOptionsValidation"
                    />
                  </div>
                  <el-button
                    type="danger"
                    @click="removeOption(index)"
                    :disabled="formConfig.options.length <= 1"
                  >
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                </div>
              </div>
              <div style="display: flex; flex-direction: column">
                <el-button type="primary" plain @click="addOption">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  添加选项
                </el-button>
                <div style="color: red; font-size: 12px; margin-top: 8px">
                  提示：值用于数据传输，标签用于界面显示
                </div>
              </div>
            </el-form-item>

            <el-form-item label="是否必填" prop="required">
              <el-radio-group
                v-model="formConfig.required"
                @change="handleRequiredChange"
              >
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 新增的默认值配置 -->
            <el-form-item
              label="默认值"
              v-if="selectedFormType && selectedFormType !== 'date'"
            >
              <!-- 下拉框默认值 -->
              <template v-if="selectedFormType === 'dropdown'">
                <el-select
                  v-model="formConfig.defaultValue"
                  placeholder="请选择默认值"
                  clearable
                  @change="updatePreview"
                >
                  <el-option
                    v-for="option in formConfig.options.filter(
                      (opt) => opt.value || opt.label
                    )"
                    :key="option.value || option.label"
                    :label="option.label || option.value"
                    :value="option.value"
                  />
                </el-select>
              </template>

              <!-- 单选框默认值 -->
              <template v-else-if="selectedFormType === 'radio'">
                <el-radio-group
                  v-model="formConfig.defaultValue"
                  @change="updatePreview"
                >
                  <el-radio
                    v-for="option in formConfig.options.filter(
                      (opt) => opt.value || opt.label
                    )"
                    :key="option.value || option.label"
                    :label="option.value"
                  >
                    {{ option.label || option.value }}
                  </el-radio>
                </el-radio-group>
              </template>

              <!-- 多选框默认值 -->
              <template v-else-if="selectedFormType === 'checkbox'">
                <el-checkbox-group
                  v-model="formConfig.defaultValue"
                  @change="updatePreview"
                >
                  <el-checkbox
                    v-for="option in formConfig.options.filter(
                      (opt) => opt.value || opt.label
                    )"
                    :key="option.value || option.label"
                    :label="option.value"
                  >
                    {{ option.label || option.value }}
                  </el-checkbox>
                </el-checkbox-group>
              </template>

              <!-- 文本类型默认值 -->
              <template
                v-else-if="['text', 'multitext'].includes(selectedFormType)"
              >
                <el-input
                  v-model="formConfig.defaultValue"
                  :type="selectedFormType === 'multitext' ? 'textarea' : 'text'"
                  :rows="selectedFormType === 'multitext' ? 3 : undefined"
                  placeholder="请输入默认值"
                  @input="updatePreview"
                />
              </template>

              <!-- 数字类型默认值 -->
              <template v-else-if="selectedFormType === 'number'">
                <el-input-number
                  v-model="formConfig.defaultValue"
                  placeholder="请输入默认值"
                  style="width: 100%"
                  :precision="2"
                  controls-position="right"
                  @change="updatePreview"
                />
              </template>
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧预览区域 -->
        <div class="preview-panel">
          <h3 class="panel-title">预览效果</h3>
          <div
            :class="[
              'preview-content',
              { 'has-content': formConfig.fieldName },
            ]"
          >
            <div v-if="!formConfig.fieldName" class="empty-preview">
              <el-icon size="48" color="#C0C4CC">
                <Document />
              </el-icon>
              <p>配置字段信息后将在此显示预览效果</p>
            </div>
            <div v-else class="preview-form">
              <el-form label-position="top">
                <el-form-item
                  :label="
                    formConfig.fieldName + (formConfig.required ? ' *' : '')
                  "
                  :required="formConfig.required"
                >
                  <p
                    v-if="formConfig.description"
                    style="color: #909399; font-size: 12px; margin: 0 0 12px 0"
                  >
                    {{ formConfig.description }}
                  </p>

                  <!-- 下拉框 -->
                  <template v-if="selectedFormType === 'dropdown'">
                    <el-select
                      v-model="previewValue.dropdown"
                      placeholder="请选择"
                      style="width: 100%"
                      clearable
                    >
                      <el-option
                        v-for="option in formConfig.options.filter(
                          (opt) => opt.value || opt.label
                        )"
                        :key="option.value || option.label"
                        :label="option.label || option.value"
                        :value="option.value"
                      />
                    </el-select>
                    <div
                      v-if="previewValue.dropdown"
                      class="preview-selected-value"
                    >
                      当前选择值: {{ previewValue.dropdown }}
                    </div>
                  </template>

                  <!-- 单选框 -->
                  <template v-else-if="selectedFormType === 'radio'">
                    <el-radio-group v-model="previewValue.radio">
                      <el-radio
                        v-for="option in formConfig.options.filter(
                          (opt) => opt.value || opt.label
                        )"
                        :key="option.value || option.label"
                        :label="option.value"
                      >
                        {{ option.label || option.value }}
                      </el-radio>
                    </el-radio-group>
                    <div
                      v-if="previewValue.radio"
                      class="preview-selected-value"
                    >
                      当前选择值: {{ previewValue.radio }}
                    </div>
                  </template>

                  <!-- 多选框 -->
                  <template v-else-if="selectedFormType === 'checkbox'">
                    <el-checkbox-group v-model="previewValue.checkbox">
                      <el-checkbox
                        v-for="option in formConfig.options.filter(
                          (opt) => opt.value || opt.label
                        )"
                        :key="option.value || option.label"
                        :label="option.value"
                      >
                        {{ option.label || option.value }}
                      </el-checkbox>
                    </el-checkbox-group>
                    <div
                      v-if="
                        previewValue.checkbox &&
                        previewValue.checkbox.length > 0
                      "
                      class="preview-selected-value"
                    >
                      当前选择值: {{ previewValue.checkbox.join(", ") }}
                    </div>
                  </template>

                  <!-- 日期选择 -->
                  <template v-else-if="selectedFormType === 'date'">
                    <el-date-picker
                      v-model="previewValue.date"
                      placeholder="请选择日期"
                      style="width: 100%"
                    />
                    <div
                      v-if="previewValue.date"
                      class="preview-selected-value"
                    >
                      当前选择日期: {{ formatDate(previewValue.date) }}
                    </div>
                  </template>

                  <!-- 单行文本 -->
                  <template v-else-if="selectedFormType === 'text'">
                    <el-input
                      v-model="previewValue.text"
                      placeholder="请输入内容"
                    />
                    <div
                      v-if="previewValue.text"
                      class="preview-selected-value"
                    >
                      当前输入内容: {{ previewValue.text }}
                    </div>
                  </template>

                  <!-- 数字 -->
                  <template v-else-if="selectedFormType === 'number'">
                    <el-input-number
                      v-model="previewValue.number"
                      placeholder="请输入数字"
                      style="width: 100%"
                    />
                    <div
                      v-if="
                        previewValue.number !== undefined &&
                        previewValue.number !== null
                      "
                      class="preview-selected-value"
                    >
                      当前输入数字: {{ previewValue.number }}
                    </div>
                  </template>

                  <!-- 多行文本 -->
                  <template v-else-if="selectedFormType === 'multitext'">
                    <el-input
                      v-model="previewValue.multitext"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入内容"
                    />
                    <div
                      v-if="previewValue.multitext"
                      class="preview-selected-value"
                    >
                      当前输入内容: {{ previewValue.multitext }}
                    </div>
                  </template>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="!editMode" @click="backToFieldTypeSelection"
            >返回选择</el-button
          >
          <el-button @click="showFieldConfigDialog = false">取消</el-button>
          <el-button type="primary" @click="saveFieldConfig">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { v4 as uuidv4 } from "uuid";
import {
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";
import { Delete, Plus, Document, Lock } from "@element-plus/icons-vue";
import {
  delfieldInfo,
  getfieldInfo,
  getfieldList,
  postfieldInfo,
  putfieldInfo,
} from "@/api/contact/templatepage";
import { ElMessageBox } from "element-plus";

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sear: undefined,
  },
});

// 表单选择器相关数据
const showFieldTypeDialog = ref(false);
const showFieldConfigDialog = ref(false);
const selectedFormType = ref("");
const editMode = ref(false); // 编辑模式标识
const currentFieldData = ref(null); // 当前编辑的字段数据

const formConfig = reactive({
  fieldName: "",
  fieldKey: "",
  description: "",
  required: null, // 初始为null
  defaultValue: null, // 新增默认值字段，支持多种类型
  options: [{ value: "", label: "" }],
});

// 新增预览值存储，用于演示交互效果
const previewValue = reactive({
  dropdown: "",
  radio: "",
  checkbox: [],
  date: "",
  text: "",
  number: null,
  multitext: "",
});

// 自定义验证器：验证选项数组
const validateOptions = (rule, value, callback) => {
  // 只对需要选项的字段类型进行验证
  if (["dropdown", "radio", "checkbox"].includes(selectedFormType.value)) {
    if (!value || !Array.isArray(value)) {
      callback(new Error("至少需要添加2个有效选项"));
      return;
    }

    // 过滤出有效选项（值和标签都不为空）
    const validOptions = value.filter((option) => {
      const hasValidValue = option.value && option.value.trim();
      const hasValidLabel = option.label && option.label.trim();
      return hasValidValue && hasValidLabel;
    });

    // 检查是否有选项的值或标签为空
    const hasEmptyOption = value.some((option) => {
      const valueEmpty = !option.value || !option.value.trim();
      const labelEmpty = !option.label || !option.label.trim();
      return valueEmpty || labelEmpty;
    });

    if (hasEmptyOption) {
      callback(new Error("选项的值和标签都不能为空"));
      return;
    }

    // 检查最少选项数量（至少2个）
    if (validOptions.length < 2) {
      callback(new Error("至少需要添加2个有效选项"));
      return;
    }

    // 检查选项值的唯一性
    const optionValues = validOptions.map((option) => option.value.trim());
    const uniqueValues = [...new Set(optionValues)];

    if (optionValues.length !== uniqueValues.length) {
      callback(new Error("选项值不能重复"));
      return;
    }
  }

  callback();
};

// 自定义验证器：验证是否必填选择
const validateRequired = (rule, value, callback) => {
  console.log("验证是否必填:", {
    value,
    editMode: editMode.value,
    type: typeof value,
  });

  // 在新增模式下，确保用户明确选择了是否必填（不能使用默认值）
  if (!editMode.value && (value === null || value === undefined)) {
    console.log("新增模式验证失败: 值为null或undefined");
    callback(new Error("请选择字段是否必填"));
    return;
  }

  // 在编辑模式下，值应该是boolean类型
  if (editMode.value && typeof value !== "boolean") {
    console.log("编辑模式验证失败: 值不是boolean类型");
    callback(new Error("请选择字段是否必填"));
    return;
  }

  console.log("是否必填验证通过");
  callback();
};

const configRules = {
  fieldName: [{ required: true, message: "字段名称不能为空", trigger: "blur" }],
  fieldKey: [
    { required: true, message: "字段键值不能为空", trigger: "blur" },
    {
      pattern: /^[a-zA-Z]+$/,
      message: "字段键值只能包含英文字母",
      trigger: "blur",
    },
  ],
  options: [{ validator: validateOptions, trigger: ["blur", "change"] }],
  required: [{ validator: validateRequired, trigger: "change" }],
};

const formOptions = [
  {
    type: "dropdown",
    title: "下拉框",
    description: "在选项菜单中选择一个选项",
    icon: "▼",
    iconClass: "icon-dropdown",
  },
  {
    type: "radio",
    title: "单选框",
    description: "少量选项中选择单个选项",
    icon: "◯",
    iconClass: "icon-radio",
  },
  {
    type: "checkbox",
    title: "多选框",
    description: "在选项列表中选择一个或多个选项",
    icon: "☑",
    iconClass: "icon-checkbox",
  },
  {
    type: "date",
    title: "日期",
    description: "从日历中选择日期",
    icon: "📅",
    iconClass: "icon-date",
  },
  {
    type: "text",
    title: "单行文本",
    description: "少量客观文字内容",
    icon: "T",
    iconClass: "icon-text",
  },
  {
    type: "number",
    title: "数字",
    description: "添加数字的选项",
    icon: "#",
    iconClass: "icon-number",
  },
  {
    type: "multitext",
    title: "多行文本",
    description: "添加几行文字描述",
    icon: "≡",
    iconClass: "icon-multitext",
  },
];

const total = ref(0);
const loading = ref(false);
const showSearch = ref(true);

const { queryParams, form } = toRefs(data);
const dateRange = ref([]);
const { proxy } = getCurrentInstance();
const chatdetailList = ref([]);
const configFormRef = ref(null);

// 格式化日期显示
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

// 解析时间格式
const parseTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  return date.toLocaleString();
};

// 映射后端字段类型到前端表单类型
const mapEditorTypeToFormType = (editorType) => {
  const typeMap = {
    INPUT: "text",
    TEXTAREA: "multitext",
    NUMBER: "number",
    DATE: "date",
    DATETIME: "date",
    SELECT: "dropdown",
    RADIO: "radio",
    CHECKBOX: "checkbox",
  };
  return typeMap[editorType] || "text";
};

// 重置预览值
const resetPreviewValue = () => {
  switch (selectedFormType.value) {
    case "dropdown":
    case "radio":
    case "text":
    case "multitext":
    case "date":
      previewValue[selectedFormType.value] = formConfig.defaultValue || "";
      break;
    case "checkbox":
      previewValue.checkbox = Array.isArray(formConfig.defaultValue)
        ? [...formConfig.defaultValue]
        : [];
      break;
    case "number":
      previewValue.number =
        typeof formConfig.defaultValue === "number"
          ? formConfig.defaultValue
          : null;
      break;
    default:
      break;
  }
};

// 监听表单类型变化，重置预览值
watch(selectedFormType, (newType) => {
  if (newType) {
    resetPreviewValue();
  }
});

// 监听默认值变化，更新预览值
watch(
  () => formConfig.defaultValue,
  (newVal) => {
    if (selectedFormType.value) {
      switch (selectedFormType.value) {
        case "dropdown":
        case "radio":
        case "text":
        case "multitext":
        case "date":
          previewValue[selectedFormType.value] = newVal || "";
          break;
        case "checkbox":
          previewValue.checkbox = Array.isArray(newVal) ? [...newVal] : [];
          break;
        case "number":
          previewValue.number = typeof newVal === "number" ? newVal : null;
          break;
      }
    }
  },
  { deep: true }
);

/** 查询列表 */
const getList = () => {
  loading.value = true;
  getfieldList({
    formGroup: "20",
    templateStatus: "",
    sear: queryParams.value.sear,
  })
    .then((res) => {
      console.log(res, "asdasdasdasdasdssdasd");
      chatdetailList.value = res.result;
      total.value = res.result.totalResult || 0;
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

// 重置字段配置
const resetFormConfig = () => {
  formConfig.fieldName = "";
  formConfig.fieldKey = "";
  formConfig.description = "";
  formConfig.required = null; // 重置为null，强制用户选择

  // 根据字段类型设置合适的默认值类型
  switch (selectedFormType.value) {
    case "checkbox":
      formConfig.defaultValue = [];
      break;
    case "number":
      formConfig.defaultValue = null; // 数字类型使用 null
      break;
    default:
      formConfig.defaultValue = "";
      break;
  }

  if (["dropdown", "radio", "checkbox"].includes(selectedFormType.value)) {
    formConfig.options = [
      { value: "option1", label: "选项1" },
      { value: "option2", label: "选项2" },
    ];
  } else {
    formConfig.options = [{ value: "", label: "" }];
  }

  // 重置预览值
  resetPreviewValue();
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

// 新增 - 打开字段类型选择弹框
const handleAdd = () => {
  // 重置编辑模式
  editMode.value = false;
  currentFieldData.value = null;
  // 清除表单验证状态
  configFormRef.value?.clearValidate();
  showFieldTypeDialog.value = true;
};

// 选择表单类型
const selectFormType = (option) => {
  selectedFormType.value = option.type;
  showFieldTypeDialog.value = false;
  showFieldConfigDialog.value = true;
  resetFormConfig();
  // 清除表单验证状态
  configFormRef.value?.clearValidate();
};

// 添加选项
const addOption = () => {
  formConfig.options.push({ value: "", label: "" });
  // 添加选项后触发验证
  triggerOptionsValidation();
};

// 移除选项
const removeOption = (index) => {
  formConfig.options.splice(index, 1);
  // 删除选项后触发验证
  triggerOptionsValidation();
};

// 处理字段键值输入，只允许英文字母
const handleFieldKeyInput = (value) => {
  // 编辑模式下不允许修改字段键值
  if (editMode.value) {
    return;
  }

  // 过滤掉非英文字母的字符
  const filteredValue = value.replace(/[^a-zA-Z]/g, "");
  formConfig.fieldKey = filteredValue;
  updatePreview();
};

// 触发选项验证
const triggerOptionsValidation = () => {
  // 延迟验证，避免频繁触发
  setTimeout(() => {
    configFormRef.value?.validateField("options");
  }, 100);
};

// 处理选项输入变化
const handleOptionInput = () => {
  updatePreview();
  triggerOptionsValidation();
};

// 处理是否必填变化
const handleRequiredChange = (value) => {
  console.log("是否必填变化:", value, "编辑模式:", editMode.value);
  updatePreview();
  // 触发是否必填字段的验证
  setTimeout(() => {
    configFormRef.value?.validateField("required");
  }, 50);
};

// 更新预览
const updatePreview = () => {
  // 预览更新逻辑 - 现在预览是实时响应的
};

// 获取表单类型标题
const getFormTypeTitle = () => {
  const option = formOptions.find((opt) => opt.type === selectedFormType.value);
  return option ? option.title : "";
};

// 获取对话框标题
const getDialogTitle = () => {
  if (editMode.value) {
    return `编辑${getFormTypeTitle()}字段`;
  }
  return `新增${getFormTypeTitle()}字段`;
};

// 返回字段类型选择
const backToFieldTypeSelection = () => {
  showFieldConfigDialog.value = false;
  showFieldTypeDialog.value = true;
};

// 映射前端表单类型到后端编辑器类型
const mapFormTypeToEditorType = (formType) => {
  const typeMap = {
    text: "TEXT",
    multitext: "TEXTAREA",
    number: "NUMBER",
    date: "DATE",
    dropdown: "SELECT",
    radio: "RADIO",
    checkbox: "CHECKBOX",
  };
  return typeMap[formType] || "TEXT";
};

// 构建选项数据源
const buildDataSource = (options) => {
  if (!options || !Array.isArray(options)) {
    return [];
  }

  return options
    .filter((option) => option.value || option.label)
    .map((option, index) => ({
      value: option.value || option.label,
      label: option.label || option.value,
      id: uuidv4(),
    }));
};

// 保存字段配置
const saveFieldConfig = () => {
  configFormRef.value.validate((valid) => {
    const attributes = {};
    // 如果是选择类型的字段，添加数据源
    if (["dropdown", "radio", "checkbox"].includes(selectedFormType.value)) {
      const dataSource = buildDataSource(formConfig.options);
      if (dataSource.length > 0) {
        attributes.DataSource = dataSource;

        // 设置选择器模式
        if (selectedFormType.value === "checkbox") {
          attributes.Mode = "multiple";
        } else {
          attributes.Mode = "single";
        }
      }
    }
    if (valid) {
      // 构建符合后端API要求的参数
      const apiParams = {
        formGroup: "20", // 会话字段
        editorType: mapFormTypeToEditorType(selectedFormType.value),
        displayName: formConfig.fieldName,
        fieldName: formConfig.fieldKey,
        isRequired: formConfig.required ? 1 : 0,
        description: formConfig.description || "",
        attributes: JSON.stringify(attributes),
        // pattern: "", // 暂时不用
        // minLength: 0, // 暂时不用
        // maxLength: 0, // 暂时不用
        // minImum: 0, // 暂时不用
        // maxImum: 0, // 暂时不用
      };


      console.log(
        editMode.value ? "更新字段配置参数:" : "保存字段配置参数:",
        apiParams
      );

      // 调用新增字段接口
      if (!editMode.value) {
        postfieldInfo(apiParams)
          .then((res) => {
            console.log("字段创建成功", res);
            proxy.$modal.msgSuccess("新增成功");

            // 重置状态
            resetDialogState();
            getList(); // 刷新列表
          })
          .catch((err) => {
            console.error("字段创建失败", err);
          });
      } else {
        // TODO: 编辑模式需要调用更新接口
        console.log("编辑模式暂未实现更新接口");
        proxy.$modal.msgSuccess("新增成功");
      }
    } else {
      return false;
    }
  });
};

// 重置弹窗状态
const resetDialogState = () => {
  showFieldConfigDialog.value = false;
  selectedFormType.value = "";
  editMode.value = false;
  currentFieldData.value = null;
};

// 字段类型选择弹框关闭处理
const handleFieldTypeDialogClose = (done) => {
  done();
};

// 字段配置弹窗关闭处理
const handleFieldConfigDialogClose = (done) => {
  ElMessageBox.confirm("确定要关闭吗？未保存的更改将会丢失。")
    .then(() => {
      // 重置所有状态
      selectedFormType.value = "";
      editMode.value = false;
      currentFieldData.value = null;
      // 清除表单验证状态
      configFormRef.value?.clearValidate();
      done();
    })
    .catch(() => {
      // catch error
    });
};

// 填充编辑表单数据
const fillEditFormData = (fieldData) => {
  // 设置编辑模式
  editMode.value = true;
  currentFieldData.value = fieldData;

  // 映射字段类型
  selectedFormType.value = mapEditorTypeToFormType(fieldData.editorType);

  // 填充表单配置
  formConfig.fieldName = fieldData.displayName || "";
  formConfig.fieldKey = fieldData.fieldName || "";
  formConfig.description = fieldData.description || "";
  formConfig.required = fieldData.isRequired === 1;

  // 处理选项数据（如果是选择类型的字段）
  if (["dropdown", "radio", "checkbox"].includes(selectedFormType.value)) {
    if (fieldData.options && Array.isArray(fieldData.options)) {
      formConfig.options = fieldData.options;
    } else {
      // 如果没有选项数据，设置默认选项
      formConfig.options = [
        { value: "option1", label: "选项1" },
        { value: "option2", label: "选项2" },
      ];
    }
  }

  // 设置当前值作为默认值
  if (fieldData.currentValue !== undefined && fieldData.currentValue !== null) {
    formConfig.defaultValue = fieldData.currentValue;
  } else {
    // 根据字段类型设置默认值
    switch (selectedFormType.value) {
      case "checkbox":
        formConfig.defaultValue = [];
        break;
      case "number":
        formConfig.defaultValue = null;
        break;
      default:
        formConfig.defaultValue = "";
        break;
    }
  }

  // 更新预览值
  resetPreviewValue();
};

// 查看详情/编辑
const handleEdit = (data) => {
  reset();
  getfieldInfo({
    formFieldId: data.formFieldId,
  })
    .then((res) => {
      console.log("查看详情", res);
      if (res.result) {
        // 填充编辑表单数据
        fillEditFormData(res.result);
        // 清除表单验证状态
        configFormRef.value?.clearValidate();
        // 直接显示配置弹窗，跳过类型选择
        showFieldConfigDialog.value = true;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// 删除
const handleDelete = (data) => {
  console.log(data, "adasdas");

  // @ts-ignore
  proxy.$modal
    .confirm('是否确认删除名称为"' + data.displayName + '"的数据项?')
    .then(function () {
      return delfieldInfo({ formFieldId: data.formFieldId });
    })
    .then(() => {
      getList();
      // @ts-ignore
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.form-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.form-option-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.form-option-card:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-content {
  display: flex;
  align-items: flex-start;
  padding: 20px;
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  font-weight: bold;
}

.icon-dropdown {
  background: #e6f7ff;
  color: #1890ff;
}

.icon-radio {
  background: #fff7e6;
  color: #fa8c16;
}

.icon-checkbox {
  background: #f6ffed;
  color: #52c41a;
}

.icon-date {
  background: #e6f7ff;
  color: #1890ff;
}

.icon-text {
  background: #fff1f0;
  color: #f5222d;
}

.icon-number {
  background: #fff7e6;
  color: #fa8c16;
}

.icon-multitext {
  background: #f0f5ff;
  color: #597ef7;
}

.option-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.option-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.content-layout {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.config-panel,
.preview-panel {
  flex: 1;
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.preview-content {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background: white;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-content.has-content {
  background: white;
  border: 1px solid #e4e7ed;
  text-align: left;
  justify-content: flex-start;
  padding: 20px;
}

.empty-preview {
  color: #909399;
  font-size: 16px;
}

.preview-form {
  width: 100%;
}

.preview-form .el-form-item {
  margin-bottom: 0;
}

.option-input-group {
  margin-bottom: 12px;
}

/* 新增预览选中值的样式 */
.preview-selected-value {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  font-size: 13px;
  color: #0369a1;
}

/* 字段键值禁用状态样式 */
.el-form-item .el-input.is-disabled .el-input__wrapper {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #a8abb2;
  cursor: not-allowed;
}

.el-form-item .el-input.is-disabled .el-input__inner {
  color: #a8abb2;
  cursor: not-allowed;
}

/* 编辑模式提示样式 */
.field-key-edit-hint {
  display: flex;
  align-items: center;
  color: #e6a23c;
  font-size: 12px;
  margin-top: 4px;
}

.field-key-edit-hint .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .content-layout {
    flex-direction: column;
  }
}
</style>
