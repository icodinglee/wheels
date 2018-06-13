(exports => { 'use strict';

 /** @jsx createElement */

    /**
    * @desc 构造一个jsx渲染器， 把 <div></div>这种dom节点形式的的转化为 {type: 'div', props: { className: 'XXX}, children: []}这种json格式，便于处理
    */
    const  createElement = (type, props, ...children) => {
        if(props === null) props = null;
        return {type, props, children}
    }

    /**
    *@desc render方法 将 vdom -> 转化为 dom
    */
    const render = (vdom, parent = null) => {
        const mount = parent ? (el => parent.appendChild(el)) : (el => el);
        if(typeof vdom === 'string' || typeof vdom === 'number') {
            return  mount(document.createTextNode(vdom));
        } else if (typeof vdom === 'boolean' || vdom === null) {
            return mount(document.createTextNode(''));
        } else if (typeof vdom === 'object' && typeof vdom.type === 'function') {
            return Component.render(vdom, parent);
        } else if (typeof vdom === 'object' && typeof vdom.type === 'string') {
            const dom = mount(document.createElement(vdom.type));
            for (const child of [/* flatten */].concat(...vdom.children))
                render(child, dom);
            for (const prop in vdom.props)
                setAttribute(dom, prop, vdom.props[prop])
            return dom;
        } else {
            throw new Error(`Invalid VDOM: ${vdom}.`)
        }
    }
    
    /**
    * @desc 把vdom中的属性方法重新绑定到dom 中去
    */
    const setAttribute = (dom, key, value) => {
        if(typeof value === 'function' && key.startWith('on')) {
            const eventType = key.slice(2).toLowerCase();
            dom.__tinyactHandlers = dom.__tinyactHandlers || {};
            dom.removeEventListener(eventType, dom.__tinyactHandlers[eventType]);
            dom.__tinyactHandlers[eventType] = value;
            dom.addEventListener(eventType, dom.__tinyactHandlers[eventType]);
        } else if (key === 'checked' || key === 'value' || key === 'className'){
            dom[key] = value
        } else if (key === 'style' || typeof value === 'object') {
            object.assign(dom.style, value)
        } else if (key === 'ref' && typeof value === 'function') {
            value(dom)
        } else if (key === 'key') {
            dom.__tinyactKey = value;
        } else if (typeof value !== 'object' && typeof value !== 'function') {
            dom.setAttribute(key, value)
        }
    }

    /**
     * @desc patch算法 新旧替换
     */
    const patch = (dom, vdom, parent = dom.parentNode) => {
        const replace = parent ? el => (parent.replaceChild(el, dom) && el) : (el => el);
        if (typeof vdom == 'object' && typeof vdom.type == 'function') {
            return Component.patch(dom, vdom, parent);
        } else if (typeof vdom != 'object' && dom instanceof Text) {
            return dom.textContent != vdom ? replace(render(vdom, parent)) : dom;
        } else if (typeof vdom == 'object' && dom instanceof Text) {
            return replace(render(vdom, parent));
        } else if (typeof vdom == 'object' && dom.nodeName != vdom.type.toUpperCase()) {
            return replace(render(vdom, parent));
        } else if (typeof vdom == 'object' && dom.nodeName == vdom.type.toUpperCase()) {
            const pool = {};
            const active = document.activeElement;
            [/* flatten */].concat(...dom.childNodes).map((child, index) => {
                const key = child.__tinyactKey || `__index_${index}`;
                pool[key] = child;
            });
            [/* flatten */].concat(...vdom.children).map((child, index) => {
                const key = child.props && child.props.key || `__index_${index}`;
                dom.appendChild(pool[key] ? patch(pool[key], child) : render(child, dom));
                delete pool[key];
            });
            for (const key in pool) {
                const instance = pool[key].__tinyactInstance;
                if (instance) instance.componentWillUnmount();
                pool[key].remove();
            }
            for (const attr of dom.attributes) dom.removeAttribute(attr.name);
            for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
            active.focus();
            return dom;
        }
    }

    const Component = exports.Component = class Component {
        constructor(props) {
            this.props = props || {};
            this.state = null;
        }

        static render(vdom, parent=null) {
            const props = Object.assign({}, vdom.props, {children: vdom.children});
            if (Component.isPrototypeOf(vdom.type)) {
                const instance = new (vdom.type)(props);
                instance.componentWillMount();
                instance.base = render(instance.render(), parent);
                instance.base.__tinyactInstance = instance;
                instance.base.__tinyactKey = vdom.props.key;
                instance.componentDidMount();
                return instance.base;
            } else {
                return render(vdom.type(props), parent);
            }
        }

        static patch(dom, vdom, parent=dom.parentNode) {
            const props = Object.assign({}, vdom.props, {children: vdom.children});
            if (dom.__tinyactInstance && dom.__tinyactInstance.constructor == vdom.type) {
                dom.__tinyactInstance.componentWillReceiveProps(props);
                dom.__tinyactInstance.props = props;
                return patch(dom, dom.__tinyactInstance.render(), parent);
            } else if (Component.isPrototypeOf(vdom.type)) {
                const ndom = Component.render(vdom, parent);
                return parent ? (parent.replaceChild(ndom, dom) && ndom) : (ndom);
            } else if (!Component.isPrototypeOf(vdom.type)) {
                return patch(dom, vdom.type(props), parent);
            }
        }

        setState(nextState) {
            if (this.base && this.shouldComponentUpdate(this.props, nextState)) {
                const prevState = this.state;
                this.componentWillUpdate(this.props, nextState);
                this.state = nextState;
                patch(this.base, this.render());
                this.componentDidUpdate(this.props, prevState);
            } else {
                this.state = nextState;
            }
        }


        shouldComponentUpdate(nextProps, nextState) {
            return nextProps != this.props || nextState != this.state;
        }
    
        componentWillReceiveProps(nextProps) {
            return undefined;
        }
    
        componentWillUpdate(nextProps, nextState) {
            return undefined;
        }
    
        componentDidUpdate(prevProps, prevState) {
            return undefined;
        }
    
        componentWillMount() {
            return undefined;
        }
    
        componentDidMount() {
            return undefined;
        }
    
        componentWillUnmount() {
            return undefined;
        }

    }



})(typeof exports != 'undefined' ? exports : window.Tinyact = {});