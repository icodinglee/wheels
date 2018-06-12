/**
 * @desc redux 内部简单实现 --- 发布订阅模式
 */

//   <-----------------------一些公用方法------------------------->

/**
 * 
 * @param {*} obj 待检测类型
 * @desc 类型检测
 */
function type(obj) {
    var toString = Object.prototype.toString;
    var map = {
        '[object Boolean]'  : 'boolean', 
        '[object Number]'   : 'number', 
        '[object String]'   : 'string', 
        '[object Function]' : 'function', 
        '[object Array]'    : 'array', 
        '[object Date]'     : 'date', 
        '[object RegExp]'   : 'regExp', 
        '[object Undefined]': 'undefined',
        '[object Null]'     : 'null', 
        '[object Object]'   : 'object'
    };
    if(obj instanceof Element) {
        return 'element';
    }
    return map[toString.call(obj)];
}

/**
 * 
 * @param {*} data 
 * @desc 深度克隆 
 */
function deepClone(data) {
    var t = type(data), o, i, ni;
    
    if(t === 'array') {
        o = [];
        for (i = 0, ni = data.length; i < ni; i++) {
            o.push(deepClone(data[i]));
        }
        return o;
    }else if( t === 'object') {
        o = {};
        for( i in data) {
            o[i] = deepClone(data[i]);
        }
        return o;
    }else{
        return data;
    }
}



//   <-----------------------创建reducer------------------------->

const CREATE_NOTE = 'CREATE_NOTE';
const UPDATE_NOTE = 'UPDATE_NOTE';
const OPEN_NOTE = 'OPEN_NOTE';
const CLOSE_NOTE = 'CLOSE_NOTE';

// 初始数据
const initialState = {
  isLoading: false,
  notes: {},
  openNoteId: null
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case CREATE_NOTE: {
            const id = action.id;
            if(!id){
                return {
                    ...state,
                    isLoading: true
                }
            }
            const newNote = {
                id,
                content: ''
            };
            return {
                ...state,
                openNoteId: id,
                isLoading: false,
                notes: {
                    ...state.notes,
                    [id]: newNote
                }
            };
        }
        case UPDATE_NOTE: {
            const {id, content} = action;
            const editedNote = {
                ...state.notes[id],
                content
            };
            return {
                ...state,
                notes: {
                    ...state.notes,
                    [id]: editedNote
                }
            };
        }
        case OPEN_NOTE: {
            return {
                ...state,
                openNoteId: action.id
            };
        }
        case CLOSE_NOTE: {
            return {
                ...state,
                openNoteId: null
            };
        }
        default:
            return state;
    }
};


//   <-------------------------创建store------------------------->

/**
 * 
 * @param {obejct} action
 * @desc  对传入的action进行类型监测
 */
const validateAction = action => {
    if(!action || typeof action !== 'object' || Array.isArray(action)) {
        throw new Error('Action must be an obejct!')
    }
    if(typeof action.type === 'undefined') {
        throw new Error('Action must be a type!')
    }
}

// 创建reducer 并添加中间件
const createStore = (reducer, middleware) => {
    let state = undefined;
    const subscribers = [];
    const coreDispatch = action => {
        validateAction(action); // 类型安全检测
        state = reducer(state, action);
        subscribers.forEach(handler => handler());
    };
    const getState = () => state;
    let store = {
        dispatch: action => {
            validateAction(action);  //类型安全检测
            state = reducer(state, action);
            subscribers.forEach(handler => handler());  // 数据更新时执行回调函数，触发connect组件中相关函数 !important
        },
        getState,
        subscribe: handler => {
            subscribers.push(handler);
            return ()=> {   // 在这里可以取消订阅
                const index = subscribers.indexOf(handler);
                if(index > 0) {
                    subscribers.splice(index, 1);
                }
            }
        }
    };
    if (middleware) {
        const dispatch = action => store.dispatch(action);
        store.dispatch = middleware({
          dispatch,
          getState
        })(coreDispatch);
      }
    coreDispatch({type: '@@redux/INIT'});
    return store;
}

// 创建一个延时中间件
const delayMiddleware = () => next => action => {
    setTimeout(()=>{
        next(action);
    }, 1000)
}

// 创建一个日志打印中间件
const loggingMiddleware = ({getState}) => next => action => {
    console.log('before', getState());
    console.info('action', action);
    const result = next(action);
    console.info('after', getState());
    return result;
}

// 创建中间件合成器
const applyMiddleware = (...middlewares) => store => {
    if(middlewares.length === 0){
        return dispatch => dispatch
    }
    if(middlewares.length === 1){
        return middlewares[0]
    }
    const boundMiddlewares = middlewares.map(middleware=> 
        middleware(store)
    );
    return boundMiddlewares.reduce((a, b)=>
        next => a(b(next)) 
    )
}

// 创建异步中间件
const thunkMiddleware = ({dispatch, getState}) => next => action => {
    if(typeof action === 'function') {
        return action({dispatch, getState});
    }
    return next(action);
}

const store = createStore(reducer, applyMiddleware(
    // delayMiddleware,
    thunkMiddleware,
    loggingMiddleware
));
