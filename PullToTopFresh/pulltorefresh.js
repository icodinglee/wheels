(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(function() {
        return factory(root);
      });
    } else if (typeof exports === 'object') {
      module.exports = factory;
    } else {
      root.PullToRefresh  = factory(root);
    }
  })(this, function (root) {

    'use strict';

    //  工具函数
    var util = {
        extend:  function(target) {
            for(var i = 0, len = arguments.length; i < len; i++){
                for(var prop in arguments[i]) {
                    if(arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop]
                    }
                }
            }

            return target;
        }
    }

    function PullToTopFresh(options) {

        this.options = util.extend({}, this.constructor.defaultOptions, options);

        this.init();
    }

    
    PullToTopFresh.VERSION = '1.0.0';
    
    PullToTopFresh.defaultOptions = {
        // 下拉时的文字
        pullText: '下拉以刷新页面',
        // 下拉时的图标
        pullIcon: '&#8675;',
        // 释放前的文字
        relaseText: '释放以刷新页面',
        // 释放后的文字
        refreshText: '刷新',
        // 释放后的图标
        refreshIcon: '&hellip;',
        // 当大于60px的时候才会触发relase事件
        threshold: 60,
        // 最大可以拉到的高度
        max: 80,
        // 释放后，高度返回50px
        reloadHeight: 50
    }

    // 记录当前状态 pending/ pulling / releasing /refreshing
    var _state = 'pending';
    // touchStart时的Y轴位置
    var pullStartY = null;
    // touchMove时Y轴位置
    var pullMoveY = null;
    // 手指移动的距离
    var dist = 0;
    // refresh-element 要移动的距离，跟手指距离的值不同，因为要有阻尼效果
    var distResisted = 0;
    // 判断浏览器是否支持passive event Listeners (PEL是为了提高页面流畅度而设计的， 
    // Web开发者通过一个新的属性passive来告诉浏览器，当前页面内注册的事件监听器内部是否会调用preventDefault函数来阻止事件的默认行为，
    // 以便浏览器根据这个信息更好地做出决策来优化页面性能)
    var supportPassive = false;

    var proto = PullToTopFresh.prototype;

    proto.constructor = PullToTopFresh;

    proto.init = function() {
        // 创建下拉元素和添加样式
        this.createRefreshElement();
        this.setRefreshStyle();

        // 获取改下拉元素
        this.getElement();

        // 判断是否支持passive
        this.supportPassive();

        // 绑定事件
        this.bindEvent();
    }

    //  创建刷新元素，并添加类名和id，后面根据添加相应的类名来使元素呈现不同的样式形态
    proto.createRefreshElement = function() {
        var elem = document.createElement('div');
        if(this.options.target !== 'body'){
            var target = document.getElementById(this.options.target);
            target.parentNode.insertBefore(elem, target);
        } else {
            document.body.insertBefore(elem, document.body.firstChild);
        }

        elem.className = 'refresh-element';
        elem.id = 'refresh-element';

        elem.innerHTML = '<div class="refresh-box"><div class="refresh-content"><div class="refresh-icon"></div><div class="refresh-text"></div></div></div>';
    }

    proto.setRefreshStyle =  function() {
        var styleElem = document.createElement('style');
        styleElem.setAttribute('id', 'refresh-element-style');
        document.head.appendChild(styleElem);
        styleElem.textContent = (
            '.refresh-element {pointer-events: none; font-size: 0.85em; top: 0; height: 0; transition: height 0.3s, min-height 0.3s; text-align: center; width: 100%; overflow: hidden; color: #fff; }    .refresh-box {padding: 10px; }    .pull {transition: none; } .refresh-text {margin-top: .33em; }   .refresh-icon {transition: transform .3s; }      .release .refresh-icon {transform: rotate(180deg); }' 
        );

    }
    
    proto.getElement =  function(){
        this.refreshElem = document.getElementById('refresh-element');
    }


    // 判断是否支持passive
    proto.supportPassive = function(){
        try{
            var opts = Object.defineProperty({}, 'passive', {
                get: {
                    function () {
                        supportPassive = true;
                    }
                }
            })
            window.addEventListener('test', null, opts);
        }catch(e){}
    }

    // 事件绑定
    proto.bindEvent =  function(){
        window.addEventListener('touchstart', this);
        window.addEventListener('touchmove', this, supportPassive ? {passive: false} : false);
        window.addEventListener('touchend', this);
    }

    // 外部事件调用映射到内部
    proto.handleEvent = function(){
        console.log(event.type);
        var method = 'on' + event.type;
        if(this[method]) {
            this[method](event);
        }
    }

    
    proto.shouldPullToRefresh = function(){
        return !window.scrollY;
    }

    // 根据状态 更新 文字及icon显示
     proto.update = function() {

        var iconEl = this.refreshElem.querySelector('.refresh-icon');
        var textEl = this.refreshElem.querySelector('.refresh-text');

        if(_state === 'refreshing') {
            iconEl.innerHTML = this.options.refreshIcon;
        } else {
            iconEl.innerHTML = this.options.pullIcon;
        }

        if(_state === 'releasing') {
            textEl.innerHTML = this.options.relaseText;
        }

        if(_state === 'pulling' || _state === 'pending') {
            textEl.innerHTML = this.options.pullText;
        }

        if(_state === 'refreshing') {
            textEl.innerHTML = this.options.refreshText;
        }
     }

     proto.ontouchstart = function(e) {
         if(this.shouldPullToRefresh()) {
             pullStartY = e.touches[0].screenY;
         }

         if(_state !== 'pending') {
             return;
         };

         _state = 'pending';

         this.update();
     };

     proto.resistanceFunction = function(t) {
         return Math.min(1, t / 2.5);
     };

     // 拇指按压移动事件
     proto.ontouchmove = function(e) {
         pullMoveY = e.touches[0].screenY;

         if(_state === 'refreshing') {
             return ;
         }

         if(_state === 'pending') {
             this.refreshElem.classList.add('pull');
             _state = 'pulling';
             this.update();
         }

        if(pullStartY && pullMoveY) {
            dist = pullMoveY - pullStartY;
        }

        if(dist > 0) {
            
            // e.preventDefault && e.preventDefault(); 

            this.refreshElem.style.minHeight = distResisted + 'px';

            distResisted = this.resistanceFunction(dist / this.options.threshold) * Math.min(this.options.max, dist);

            if (_state === 'pulling' && distResisted > this.options.threshold) {
                this.refreshElem.classList.add('release');
                _state = 'releasing';
                this.update();
            }

            if(_state === 'releasing' && distResisted < this.options.threshold) {
                this.refreshElem.classList.remove('release');
                _state = 'pulling';
                this.update();
            }
        }

     };

     proto.ontouchend = function(){
          
        if(_state === 'releasing' && distResisted > this.options.threshold) {
            _state = 'refreshing';

            this.refreshElem.style['minHeight'] = this.options.reloadHeight + 'px';
            this.refreshElem.classList.add('refresh');

            if(typeof this.options.onRefresh === 'function') {
                this.options.onRefresh(this.onReset.bind(this));

            }

        } else {
            if(_state === 'refreshing') {
                return;
            }

            this.refreshElem.style['minHeight'] = '0px';

            _state = 'pending';
        }

        this.update();

        this.refreshElem.classList.remove('release');
        this.refreshElem.classList.remove('pull');

        pullStartY = pullMoveY = null;
        dist = distResisted = 0;
     }

     // 恢复到下拉初始位置
     proto.onReset =  function() {
         this.refreshElem.classList.remove('refresh');
         this.refreshElem.style['min-height'] = '0px';

         _state = 'pending';
     }



    return PullToTopFresh;
  })