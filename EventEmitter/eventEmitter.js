;(function (exports) {
    'use strict';

    /**
     * @desc 初始化emitter,把注册事件都挂载到__events下去，最后events对象变成下面的形式
     *  __events = {
     *             ...
     *              XXX: [
     *                       { listener: ()=>{}, once: true },
     *                       { listener: ()=>{}, once: false },
     *                   ]
     *              ...
     *          }
     */
    function EventEmitter (){
        this.__events = {};
    }

    EventEmitter.VERSION = '1.0.0';

    
    function isValidListener(listener) {
        if(typeof listener === 'function') {
            return true;
        } else if (listener && typeof listener === 'object') {
            return isValidListener(listener.listener);
        } else {
            return false;
        }
    }

    /**
     * @desc 监测事件是否已经在订阅集合中，以及它的位置
     * @param {Array} array 待检测订阅事件集合
     * @param {*} item  订阅事件
     */
    function indexOf(array, item) {
        var result = -1;
        item = typeof item === 'obejct' ? item.listener : item;

        for(var i = 0, len = array.length; i < len ; i++) {
            if(array[i].listener === item) {
                result = i;
                break;
            }
        }
        return result;
    }


    /**
     * @desc 将emitter下面的方法全部挂载到原型上去
     */
    var proto = EventEmitter.prototype;

    /**
     * @desc 设置订阅函数
     * @param {string} eventName 监听信号
     * @param {function} listener  信号被激活的时候，要执行的回调函数
     */
    proto.on = function(eventName, listener) {
        if(!eventName || !listener) return;

        if(!isValidListener(listener)) {
            throw new TypeError('listener must be a function');
        }

        var events  = this.__events;
        var listeners = events[eventName] = events[eventName] || [];
        var listenerIsWrapped = typeof listener === 'object';

        // 不重复添加事件
        if (indexOf(listeners, listener) === -1) {
            listeners.push(listenerIsWrapped ? listener : {
                listener: listener,
                once: false
            })
        }

        return this;
    }

    /**
     * @desc 设置只触发一次函数
     */
    proto.once = function(eventName, listener) {
        return this.on(eventName, {
            listener: listener,
            once: true
        })
    }

    /**
     * @desc 取消指定函数的订阅
     * @param {string} eventName  要取消函数的订阅类型
     * @param {function} listener  要取消的函数
     */
    proto.off = function(eventName, listener) {
        var listeners = this.__events[eventName];
        if(!listeners) return;

        var index;
        for(var i = 0, len = listeners.length; i < len ; i++) {
            if(listeners[i] && listeners[i].listener === listener) {
                index = i;
                break;
            }
        }

        if(typeof index !== 'undefined') {
            listeners.splice(index, 1, null)
        }

        return this;
    }

    /**
     * @desc 进行发布
     * @param {string} eventName  发布类型名称
     * @param {*} args 发布时附带的信息内容
     */
    proto.emit = function(eventName, ...args) {
        var listeners = this.__events[eventName];
        if(!listeners) return ;

        for(var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            if(listener) {
                listener.listener.apply(this, args || []);
                if(listener.once) {
                    this.off(eventName, listener.listener);
                }
            }
        }
        return this;
    }

    /**
     * @desc 取消所有eventName类型的订阅
     * @param {string} eventName 要取消订阅的类型名称
     */
    proto.allOff =  function(eventName) {
        if (eventName && this.__events[eventName]) {
            this.__events[eventName] = []
        } else {
            this.__events = {}
        }
    };

    // 根据环境将模块输出为AMD CMD或者全局对象
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
     
}(this || {}));