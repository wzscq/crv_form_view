/**
 * 以下为操作类型枚举常量定义
 */
export const OP_TYPE={
    OPEN:"OP_TYPE_OPEN",   //打开窗口
    CLOSE:"OP_TYPE_CLOSE",   //关闭窗口
    REQUEST:"OP_TYPE_REQUEST",   //调用API
    UPDATE_FRAME_DATA:"OP_TYPE_UPDATE_FRAME_DATA",  //更新子框架数据
    RELOAD_FRAME_DATA:"OP_TYPE_RELOAD_FRAME_DATA", //重新加载页面数据
    MESSAGE:"OP_TYPE_MESSAGE",  //弹出提示消息,
    DOWNLOAD_FILE:"OP_TYPE_DOWNLOAD_FILE"
}

/**
 * 以下为操作返回结果
 */
export const OP_RESULT={
    SUCCESS:"OP_RESULT_SUCCESS",  //操作成功
    ERROR:"OP_RESULT_ERROR"  //操作失败
}

/**
 * 以下为打开窗口操作中，指定窗口打开位置的枚举常量定义
 */
export const OPEN_LOCATION={
    TAB:"LOCATION_TYPE_TAB",  //在tab页中打开窗口
    CURRENT:"LOCATION_TYPE_CURRENT",  //打开窗口替换当前页面
    MODAL:"LOCATION_TYPE_MODAL"  //以模态框形式打开窗口
}

export const FRAME_MESSAGE_TYPE={
    DO_OPERATION:"DO_OPERATION",
    INIT:"INIT",
    UPDATE_DATA:"UPDATE_DATA",
    RELOAD_DATA:"RELOAD_DATA",
    QUERY_REQUEST:"QUERY_REQUEST",
    QUERY_RESPONSE:"QUERY_RESPONSE",
    GET_IMAGE:"GET_IMAGE"
}

export const DATA_TYPE={
    MODEL_CONF:"DATA_TYPE_MODEL_CONF",   //模型配置数据
    QUERY_RESULT:"DATA_TYPE_QUERY_RESULT",   //数据查询结果
}

export const FORM_TYPE={
    CREATE:"FORM_TYPE_CREATE",
    EDIT:'FORM_TYPE_EDIT',
    DETAIL:'FORM_TYPE_DETAIL'
}

//系统默认字段，这些字段有特殊用户，用户字段不能和这些字段重复
export const CC_COLUMNS={
	CC_SAVE_TYPE:"_save_type",
	CC_CREATE_TIME:"create_time",
	CC_CREATE_USER:"create_user",
	CC_UPDATE_TIME:"update_time",
	CC_UPDATE_USER:"update_user",
	CC_VERSION:"version",
	CC_ID:"id"
}

//保存数据的类型
export const SAVE_TYPE={
	CREATE:"create",
	UPDATE:"update",
	DELETE:"delete"
}

//字段类型
export const FIELD_TYPE={
	MANY2MANY:"MANY_TO_MANY",
	MANY2ONE:"MANY_TO_ONE",
	ONE2MANY:"ONE_TO_MANY",
	FILE:"FILE",
}

//字段级联类型
export const CASCADE_TYPE={
	MANY2MANY:"MANY_TO_MANY",
	MANY2ONE:"MANY_TO_ONE",
}