;(function (exports) {
    'use strict';

    // 兼容处理
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || // webkit中取消方法的名字变了
            window[vendors + 'CancelRequestAnimationFrame'];
    }

    //  对不支持requestAnimation 的浏览器使用 setTimeout 进行模拟
    if(!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();           
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));

            var id =  window.setTimeout(function(){
                callback(currTime + timeToCall);
            }, timeToCall);

            lastTime = currTime + timeToCall;
            return id;
        }
    }

    if(!window.cancelAnimationFrame) {
        window.cancelAnimationFrame =  function(id) {
            clearTimeout(id);
        }
    }


    // 工具函数
    var util = {
        extend:  function(target) {
            for (var i = 1, len = arguments.length; i < len; i++) {
                for(var prop in arguments[i]) {
                    if(arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }
                }
            }
            return target;
        },
        getViewPortSizeHeight: function (){
            var w = window;
            if(w.innerWidth != null) return w.innerHeight;
            // 标准模式
            if(document.compatMode === 'CSS1Compat') {
                return d.documentElement.clientHeight;
            }
            // 怪异模式
            return d.body.clientHeight;
        },
        getScollOffsetsTop: function() {
            var w =  window;
            if(w.pageXOffset != null) return w.pageYOffset;
            var d = w.document;
            // 标准模式
            if(document.compatMode === 'CSS1Compat') {
                return d.documentElement.scrollTop;
            }
            // 怪异模式
            return d.body.scrollTop;
        },
        addEvent: function(element, type, fn) {
            if(document.addEventListener) {
                element.addEventListener(type, fn, false);
                return fn;
            } else if (document.attachEvent) {
                var bound = function () {
                    return fn.apply(element, arguments)
                }
                element.attachEvent('on' + type, bound);
                return bound;
            }
        }
    };


    function ProgressIndicator(options) {
        this.options = util.extend({}, this.constructor.defaultOptions, options);

        this.handlers = {};

        this.init();
    }

    ProgressIndicator.VERSION = '1.0.0';
    
    ProgressIndicator.defaultOptions = {
        color: "#0A74DA",
        callback: function(){} // 到达100% 时候的回调函数
    }

    var proto = ProgressIndicator.prototype;

    proto.constructor = ProgressIndicator;

    proto.init = function() {
        this.createIndicator();
        var width = this.calculateWidthPrecent();
        this.setWidth(width);
        this.bindScrollEvent();
    }

    // 创建顶部指示条
    proto.createIndicator = function() {
        var div = document.createElement('div');

        div.id = 'progress-indicator';
        div.className = "progress-indicator";

        div.style.position = 'fixed';
        div.style.top = 0;
        div.style.left = 0;
        div.style.height = '3px';

        div.style.background = this.options.color;

        this.element = div;

        document.body.appendChild(div);
    }

    // 计算百分比宽度
    proto.calculateWidthPrecent = function() {
        //  文档高度
        this.docHeight = Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight);

        // 视口高度
        this.viewHeight = util.getViewPortSizeHeight();

        // 差值
        this.sHeight = Math.max(this.docHeight - this.viewHeight, 0);

        // 滚动条垂直偏移量
        var scrollTop = util.getScollOffsetsTop();

        return this.sHeight ? scrollTop / this.sHeight : 0;
    }

    // 设置指示条宽度
    proto.setWidth =  function(perc) {
        this.element.style.width = perc * 100 + '%';
    }

    proto.bindScrollEvent =  function() {
        var self = this;
        var prev;

        util.addEvent(window, 'scroll', function(){
            window.requestAnimationFrame(function(){

                var perc = Math.min(util.getScollOffsetsTop() / self.sHeight,  1);
                // 火狐中有可能连续计算为1，导致end事件被计算两次
                if(perc === prev)  return;
                // 在达到100%的时候，刷新页面执行回调函数
                if (perc && perc === 1) {
                   self.options.callback && self.options.callback();
                }

                prev = perc;
                self.setWidth(perc);
            })
        })
    }

    // 根据环境将模块输出为AMD CMD或者全局对象
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return ProgressIndicator;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = ProgressIndicator;
    }
    else {
        exports.ProgressIndicator = ProgressIndicator;
    }
     
}(this || {}));