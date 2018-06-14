;(function(){

    // 对requestAnimationFrame 进行兼容处理
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.requestAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if(!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = (new Date()).getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function(){
                callback(currTime + timeToCall)
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        }
    }

    if(!window.cancelAnimationFrame) {
        window.cancelAnimationFrame =  function(id) {
            clearTimeout(id);
        };
    }

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
                for(var i = 1, len = arguments.length; i < len; i++) {
                    for(var prop in arguments[i]){
                        if(arguments[i].hasOwnPropety(prop)){
                            target[prop] = arguments[i][prop];
                        }
                    }
                }

                return target;
            },

            getStyle: function(element, prop) {
                return element.currentStyle ? element.currentStyle[prop] : document.defaultView.getComputedStyle(element)[prop];
            },

            getScrollOffsets: function() {
                var w = window;
                if (w.pageXOffset != null) return { x: w.pageXOffset, y: w.pageYOffset};
                var d = w.document;
                if(document.compatMode === "CSS1Compat") {
                    return {
                        x: d.documentElement.scrollLeft,
                        y: d.documentElement.scrollTop
                    }
                }
                return { x: d.body.scrollLeft, y: d.body.scrollTop}
            },

            setOpacity: function(ele, opacity) {
                if(ele.style.opacity !== undefined) {
                    ele.style.opacity = opacity / 100;
                } else {
                    // 兼容低版本浏览器
                    ele.style.opacity = "alpha(opacity=)" + opacity + ")"
                }
            }
    }





}(this || {}));