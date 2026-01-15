<template>
  <div class="login">
    <el-form
      ref="loginRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
    >
      <h3 class="title">{{ title }}</h3>
      <el-form-item prop="mobile">
        <el-input
          v-model="loginForm.mobile"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="手机号"
          :maxlength="11"
        >
          <template #prefix
            ><svg-icon icon-class="user" class="el-input__icon input-icon"
          /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="smsCode">
        <el-input
          v-model="loginForm.smsCode"
          size="large"
          auto-complete="off"
          placeholder="短信验证码"
          style="width: 63%"
          @keyup.enter="handleLogin"
          :maxlength="6"
        >
          <template #prefix
            ><svg-icon icon-class="validCode" class="el-input__icon input-icon"
          /></template>
        </el-input>
        <el-button
          :disabled="smsBtnDisabled"
          size="large"
          style="width: 33%; margin-left: 4px"
          @click="handleSendSms"
          >{{ smsBtnText }}</el-button
        >
      </el-form-item>
      <el-form-item style="width: 100%">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          style="width: 100%"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div style="float: right" v-if="register">
          <router-link class="link-type" :to="'/register'"
            >立即注册</router-link
          >
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>Copyright © 2018-2025 ruoyi.vip All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup>
import useUserStore from "@/store/modules/user";
import { mobileSend } from "@/api/login";
import { getCurrentInstance, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  mobile: "13148947825",
  smsCode: "",
});

const loginRules = {
  mobile: [
    { required: true, trigger: "blur", message: "请输入手机号" },
    { pattern: /^1[3-9]\d{9}$/, trigger: "blur", message: "手机号格式不正确" },
  ],
  smsCode: [{ required: true, trigger: "blur", message: "请输入验证码" }],
};

const loading = ref(false);
const smsBtnText = ref("获取验证码");
const smsBtnDisabled = ref(false);
let smsTimer = null;
let smsCount = ref(60);
const register = ref(false);
const redirect = ref(undefined);

watch(
  route,
  (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect;
  },
  { immediate: true }
);

// 登录
function handleLogin() {
  proxy.$refs.loginRef.validate((valid) => {
    if (valid) {
      loading.value = true;
      userStore
        .login({
          mobile: loginForm.value.mobile,
          smsCode: loginForm.value.smsCode,
          clientInfoType: "10",
          roleType: "20",
          fromInviteCode: "",
        })
        .then(() => {
          const query = route.query;
          const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
            if (cur !== "redirect") {
              acc[cur] = query[cur];
            }
            return acc;
          }, {});
          router.push({ path: redirect.value || "/", query: otherQueryParams });
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
}

// 获取验证码
function handleSendSms() {
  if (smsBtnDisabled.value) return;
  proxy.$refs.loginRef.validateField("mobile", (valid) => {
    console.log("valid", valid);
    if (valid) {
      mobileSend({
        mobile: loginForm.value.mobile,
        codeType: "20",
      })
        .then(() => {
          // 成功后开始倒计时
          smsBtnText.value = `${smsCount.value}s后重试`;
          smsTimer = setInterval(() => {
            smsCount.value--;
            smsBtnText.value = `${smsCount.value}s后重试`;
            if (smsCount.value <= 0) {
              clearInterval(smsTimer);
              smsBtnText.value = "获取验证码";
              smsBtnDisabled.value = false;
              smsCount.value = 60;
            }
          }, 1000);
        })
        .catch((err) => {
          console.log(err);
          smsBtnDisabled.value = false;
        });
    }
  });
}
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/images/login-background.jpg");
  background-size: cover;
}
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.login-form {
  border-radius: 6px;
  background: #ffffff;
  width: 400px;
  padding: 25px 25px 5px 25px;
  z-index: 1;
  .el-input {
    height: 40px;
    input {
      height: 40px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 33%;
  height: 40px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}
.login-code-img {
  height: 40px;
  padding-left: 12px;
}
</style>
