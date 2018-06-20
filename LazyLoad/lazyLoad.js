(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(function() {
        return factory(root);
      });
    } else if (typeof exports === 'object') {
      module.exports = factory;
    } else {
      root.LazyLoad = factory(root);
    }
  })(this, function (root) {

    'use strict';

    var root = (typeof self == 'object' && self.self == self && self) ||
                (typeof global == 'object' && global.global == global && global) ||
                this || {};

    // 新建bind函数，解决ie8及其以下的兼容性问题
    Function.prototype.bind =  Function.prototype.bind || function(oThis) {
        if (typeof this !== 'function') {
          // closest thing possible to the ECMAScript 5
          // internal IsCallable function
          throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
    
        var aArgs   = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
              return fToBind.apply(this instanceof fNOP
                     ? this
                     : oThis,
                     // 获取调用时(fBound)的传参.bind 返回的函数入参往往是这么传递的
                     aArgs.concat(Array.prototype.slice.call(arguments)));
            };
    
        // 维护原型关系
        if (this.prototype) {
          // Function.prototype doesn't have a prototype property
          fNOP.prototype = this.prototype; 
        }
        fBound.prototype = new fNOP();
    
        return fBound;
    };

    // 工具函数
    var util = {
        extend: function(target) {
            for (var i = 1, len = arguments.length; i < len; i++) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop]
                    }
                }
            }

            return target
        },
        addEvent: function(elem, type, fn) {
            if (document.addEventListener) {
                elem.addEventListener(type, fn, false);
                return fn;
            } else if (document.attachEvent) {
                var bound = function() {
                    return fn.apply(elem, arguments)
                }
                elem.attachEvent('on' + type, bound);
                return bound;
            }
        },
        removeEvent: function(elem, type, fn) {
        	if (document.removeEventListener) {
        		elem.removeEventListener(type, fn, false)
        	}
        	else {
        		elem.detachEvent("on" + type, fn)
        	}
        }
    }

    function LazyLoad(opts) {
        this.opts = util.extend({}, this.constructor.defaultOpts, opts);
        this.init();
    }

    LazyLoad.VERSION = '1.0.1';

    LazyLoad.defaultOpts = {
        delay: 250, // 节流函数n毫秒执行一次
        useDebounce: false // 是否使用节流函数
    }

    var proto = LazyLoad.prototype;

    /**
     * @desc 初始化函数， 计算进行懒加载的页面范围。 同时绑定scroll事件
     */
    proto.init = function() {
        this.calulateView();
        this.bindScrollEvent();
    }


    proto.calulateView = function() {
        this.view = {
            top: 0 - (parseInt(this.opts.top, 10) || 0),
            bottom: (root.innerHeight || document.documentElement.clientHeight) + (parseInt(this.opts.bottom, 10) || 0),
            left: 0 - (parseInt(this.opts.left, 10) || 0),
            right: (root.innerWidth || document.documentElement.clientWidth) + (parseInt(this.opts.right, 10) || 0)
        }
    }

    /**
     * @desc 页面滚动的时候和加载时， 判断图片是否在可见区域，如果可见，替换src，将原始图片加载出来
     */
    proto.bindScrollEvent = function() {
        var scrollEvent = util.addEvent(root, 'scroll', this.handleLazyLoad.bind(this));
        var loadEvent = util.addEvent(root, 'load', this.handleLazyLoad.bind(this));

        this.event = {
            scrollEvent: scrollEvent,
            loadEvent: loadEvent
        }
    }

    /**
     * @desc 使用防抖函数，减少计算次数，优化性能
     */
    var timer = null;
    proto.handleLazyLoad = function() {
        var self = this;
        
        if(!this.opts.useDebounce && !!timer) {
            return 
        }

        clearTimeout(timer);

        timer = setTimeout(function(){
            timer = null;
            self.render()
        }, this.opts.delay)
    }

    proto.isHidden = function(element) {
        return element.offsetParent === null;
    }

    /**
     * 
     * @param {[object]} element  待检测图片节点
     * @desc 检查图片是不是在可视区域
     */
    proto.checkInView = function(element) {
        if(this.isHidden(element)) {
            return false;
        }

        var rect = element.getBoundingClientRect();

        return (rect.right >= this.view.left && rect.bottom >= this.view.top && rect.left <= this.view.right && rect.top <= this.view.bottom);
    }

    /**
     * @desc检查所有添加了 data-lazy-src data-lazy-background 属性的图片节点， 如果在可视区域 替换src， 去除设置的属性
    */
    proto.render = function() {
         var nodes = document.querySelectorAll('[data-lazy-src], [data-lazy-background]');
         var length = nodes.length;
         
         console.log(nodes);
         for(var i = 0; i < length; i++) {
             var elem = nodes[i];
             let lazySrc =  elem.getAttribute('data-lazy-src');
             if(this.checkInView(elem)) {
                 if(elem.getAttribute('data-lazy-background') !== null) {
                     elem.style.backgroundImage = 'url(' + elem.getAttribute('data-lazy-background') + ')';
                 } else if(elem.src !== lazySrc){
                     elem.src = lazySrc;
                 }

                 elem.removeAttribute('data-lazy-src');
                 elem.removeAttribute('data-lazy-background');

                 if(this.opts.onload && typeof this.opts.onload === 'function') {
                     this.opts.onload(elem);
                 }
             }
         }

         if(!length) {
             this.unbindScrollEvent();
         }
    }   

    /**
     * @desc 所有图片都加载出来 之后，去除监听函数
     */
    proto.unbindScrollEvent = function() {
        util.removeEvent(root, 'scroll', this.event.scrollEvent);
        util.removeEvent(root, 'load', this.event.loadEvent);
    }

    return LazyLoad;
});