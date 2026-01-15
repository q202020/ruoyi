import { IMUIKit } from "@xkit-yx/im-kit-ui";
import V2NIM from "nim-web-sdk-ng";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import { app } from "@/main";
import { getIMToken } from "@/api/contact/contact";

function initializeNIMSDK(result) {
    const initOptions = {
        appkey: result.appkey, // 请填写你的appkey
        account: result.account, // 请填写你的account
        token: result.token, // 请填写你的token
    };
    // 将 initOptions 存到全局属性中
    // app.config.globalProperties.$initOptions = initOptions;
    sessionStorage.setItem("initOptions", JSON.stringify(initOptions));
    const localOptions = {
        // 添加好友模式，默认需要验证
        addFriendNeedVerify: true,
        // 群组加入模式，默认不需要验证
        //@ts-ignore
        teamJoinMode: V2NIMConst.V2NIMTeamJoinMode.V2NIM_TEAM_JOIN_MODE_FREE,
        // 群组被邀请模式，默认不需要验证
        teamAgreeMode:
            //@ts-ignore
            V2NIMConst.V2NIMTeamAgreeMode.V2NIM_TEAM_AGREE_MODE_NO_AUTH,
        // 单聊消息是否显示已读未读 默认 false
        p2pMsgReceiptVisible: true,
        // 群聊消息是否显示已读未读 默认 false
        teamMsgReceiptVisible: true,
        // 是否需要@消息 默认 true
        needMention: true,
        // 是否显示在线离线状态 默认 true
        loginStateVisible: true,
        // 是否允许转让群主
        allowTransferTeamOwner: true,
        // 是否需要显示群管理员相关主动功能，默认 false
        teamManagerVisible: true,
    };

    const nim = V2NIM.getInstance({
        appkey: initOptions.appkey,
        account: initOptions.account,
        token: initOptions.token,
        // 是否开启云端会话，默认不开启
        enableV2CloudConversation: false,
        debugLevel: "debug",
        apiVersion: "v2",
    });

    nim.V2NIMLoginService.login(initOptions.account, "", {
        forceMode: false,
        authType: 1, // 动态Token鉴权方式
        retryCount: 5,
        tokenProvider: async (accountId) => {
            console.log("tokenProvider 被调用, accountId:", accountId);
            try {
                const res = await getIMToken();
                if (res.status === 1) {
                    // 更新全局 token
                    initOptions.token = res.result.token;
                    sessionStorage.setItem("initOptions", JSON.stringify(initOptions));
                    return res.result.token;
                } else {
                    throw new Error(res.message || "获取 token 失败");
                }
            } catch (err) {
                console.error("动态获取 token 失败:", err);
                throw err;
            }
        },
    });
    // 初始化 UIKit 实例
    app.config.globalProperties.$uikit = new IMUIKit({
        //@ts-ignore
        nim,
        singleton: true,
        localOptions,
    });
}

export const fetchIMToken = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await getIMToken();
            if (res.status === 1) {
                initializeNIMSDK(res.result);
                resolve(res.result); // 返回初始化结果
            } else {
                console.error("获取IM登录令牌失败:", res.message);
                reject(res.message);
            }
        } catch (error) {
            console.error("获取IM登录令牌异常:", error);
            reject(error);
        }
    });
}

