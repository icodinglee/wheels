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
const InitialState = {
  nextNoteId: 1,
  notes: {},
  openNoteId: null
};

// 根据传来的action,reducer进行相关操作
const initialState = {
    nextNoteId: 1,
    notes: {},
    openNoteId: null
};
  
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case CREATE_NOTE: {
            const id = state.nextNoteId;
            const newNote = {
                id,
                content: ''
            };
            return {
                ...state,
                nextNoteId: id + 1,
                openNoteId: id,
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

const createStore = reducer => {
    let state = undefined;
    const subscribers = [];
    const store = {
        dispatch: action => {
            validateAction(action);
            state = reducer(state, action);
            subscribers.forEach(handler => handler());
        },
        getState: ()=> state,
        subscribe: handler => {
            subscribers.push(handler);
            return ()=> {
                const index = subscribers.indexOf(handler);
                if(index > 0) {
                    subscribers.splice(index, 1);
                }
            }
        }
    };
    store.dispatch({type: '@@redux/INIT'});
    return store;
}


const store = createStore(reducer);
