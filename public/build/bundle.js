
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function buscaUsuario(nomeDeUsuario) {
        return fetch(`https://api.github.com/users/${nomeDeUsuario}`);
    }
    function buscaRepositorios(nomeDeUsuario) {
        return fetch(`https://api.github/users/${nomeDeUsuario}/repos?sort=created&per_page=5`);
    }

    /* src\components\Botao.svelte generated by Svelte v3.58.0 */

    const file$5 = "src\\components\\Botao.svelte";

    function create_fragment$5(ctx) {
    	let button;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "botao svelte-3cf4i");
    			add_location(button, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Botao', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Botao> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Botao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Botao",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function montaUsuario(dadosUsuario, dadosRepositorios) {
        const repositorios_recentes = dadosRepositorios.map((repositorio) => {
            return {
                nome: repositorio.name,
                url: repositorio.url
            };
        });
        return {
            avatar_url: dadosUsuario.avatar_url,
            login: dadosUsuario.login,
            name: dadosUsuario.name,
            perfil_url: dadosUsuario.html_url,
            repositorios_publicos: dadosUsuario.public_repos,
            seguidores: dadosUsuario.followers,
            repositorios_recentes
        };
    }

    /* src\components\Formulario.svelte generated by Svelte v3.58.0 */
    const file$4 = "src\\components\\Formulario.svelte";

    // (33:4) {#if statusDeErro === 404}
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Usuario não encontrado";
    			attr_dev(span, "class", "erro svelte-5xy6bs");
    			add_location(span, file$4, 33, 8, 1204);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(33:4) {#if statusDeErro === 404}",
    		ctx
    	});

    	return block;
    }

    // (39:8) <Botao>
    function create_default_slot(ctx) {
    	let t;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			t = text("Buscar\r\n            ");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/assets/lupa.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ícone de lupa");
    			add_location(img, file$4, 40, 12, 1360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(39:8) <Botao>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let form;
    	let input;
    	let t0;
    	let t1;
    	let div;
    	let botao;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*statusDeErro*/ ctx[1] === 404 && create_if_block$2(ctx);

    	botao = new Botao({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			form = element("form");
    			input = element("input");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div = element("div");
    			create_component(botao.$$.fragment);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Pesquise aqui o usuario");
    			attr_dev(input, "class", "input svelte-5xy6bs");
    			toggle_class(input, "erro-input", /*statusDeErro*/ ctx[1] === 404);
    			add_location(input, file$4, 24, 4, 965);
    			attr_dev(div, "class", "botao-container svelte-5xy6bs");
    			add_location(div, file$4, 36, 4, 1271);
    			add_location(form, file$4, 23, 0, 915);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input);
    			set_input_value(input, /*valorInput*/ ctx[0]);
    			append_dev(form, t0);
    			if (if_block) if_block.m(form, null);
    			append_dev(form, t1);
    			append_dev(form, div);
    			mount_component(botao, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(form, "submit", prevent_default(/*aoSubmeter*/ ctx[2]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*valorInput*/ 1 && input.value !== /*valorInput*/ ctx[0]) {
    				set_input_value(input, /*valorInput*/ ctx[0]);
    			}

    			if (!current || dirty & /*statusDeErro*/ 2) {
    				toggle_class(input, "erro-input", /*statusDeErro*/ ctx[1] === 404);
    			}

    			if (/*statusDeErro*/ ctx[1] === 404) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(form, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const botao_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				botao_changes.$$scope = { dirty, ctx };
    			}

    			botao.$set(botao_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(botao.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(botao.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (if_block) if_block.d();
    			destroy_component(botao);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Formulario', slots, []);
    	let valorInput = "";
    	let statusDeErro = null;
    	const dispatch = createEventDispatcher();

    	async function aoSubmeter() {
    		const respostaUsuario = await buscaUsuario(valorInput);
    		const respostaRepositorios = await buscaRepositorios(valorInput);

    		if (respostaUsuario.ok && respostaRepositorios.ok) {
    			const dadosUsuario = await respostaUsuario.json();
    			const dadosRepositorios = await respostaRepositorios.json();
    			dispatch("aoAlterarUsuario", montaUsuario(dadosUsuario, dadosRepositorios));
    			$$invalidate(1, statusDeErro = null);
    		} else {
    			$$invalidate(1, statusDeErro = respostaUsuario.status);
    			dispatch('aoAlterarUsuario', null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Formulario> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		valorInput = this.value;
    		$$invalidate(0, valorInput);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		buscaRepositorios,
    		buscaUsuario,
    		Botao,
    		montaUsuario,
    		valorInput,
    		statusDeErro,
    		dispatch,
    		aoSubmeter
    	});

    	$$self.$inject_state = $$props => {
    		if ('valorInput' in $$props) $$invalidate(0, valorInput = $$props.valorInput);
    		if ('statusDeErro' in $$props) $$invalidate(1, statusDeErro = $$props.statusDeErro);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [valorInput, statusDeErro, aoSubmeter, input_input_handler];
    }

    class Formulario extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Formulario",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Titulo.svelte generated by Svelte v3.58.0 */

    const file$3 = "src\\components\\Titulo.svelte";

    function create_fragment$3(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Usuários GitHub";
    			attr_dev(h1, "class", "titulo svelte-ybedb7");
    			add_location(h1, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Titulo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Titulo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Titulo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Titulo",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\BarraSuperior.svelte generated by Svelte v3.58.0 */

    const file$2 = "src\\components\\BarraSuperior.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			attr_dev(span0, "class", "acao svelte-1opmssq");
    			add_location(span0, file$2, 1, 4, 34);
    			attr_dev(span1, "class", "acao svelte-1opmssq");
    			add_location(span1, file$2, 2, 4, 66);
    			attr_dev(span2, "class", "acao svelte-1opmssq");
    			add_location(span2, file$2, 3, 4, 98);
    			attr_dev(div, "class", "barra-superior svelte-1opmssq");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t1);
    			append_dev(div, span2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BarraSuperior', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BarraSuperior> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class BarraSuperior extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BarraSuperior",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Usuario.svelte generated by Svelte v3.58.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\Usuario.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (22:8) {#if usuario.name}
    function create_if_block_1(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*usuario*/ ctx[0].name + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Nome: ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "svelte-10uahd0");
    			add_location(span, file$1, 24, 13, 641);
    			attr_dev(div, "class", "info svelte-10uahd0");
    			add_location(div, file$1, 23, 6, 608);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*usuario*/ 1 && t1_value !== (t1_value = /*usuario*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(22:8) {#if usuario.name}",
    		ctx
    	});

    	return block;
    }

    // (46:6) {#if temRepositorios}
    function create_if_block$1(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let ul;
    	let each_value = /*usuario*/ ctx[0].repositorios_recentes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Repositorios Recentes:";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "titulo svelte-10uahd0");
    			add_location(h2, file$1, 48, 10, 1115);
    			add_location(ul, file$1, 50, 10, 1175);
    			attr_dev(div, "class", "repositorios svelte-10uahd0");
    			add_location(div, file$1, 47, 8, 1077);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*usuario*/ 1) {
    				each_value = /*usuario*/ ctx[0].repositorios_recentes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(46:6) {#if temRepositorios}",
    		ctx
    	});

    	return block;
    }

    // (52:12) {#each usuario.repositorios_recentes as repositorio}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*repositorio*/ ctx[2].nome + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = /*repositorio*/ ctx[2].url);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "class", "repositorio svelte-10uahd0");
    			add_location(a, file$1, 53, 16, 1283);
    			add_location(li, file$1, 52, 14, 1261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*usuario*/ 1 && t0_value !== (t0_value = /*repositorio*/ ctx[2].nome + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*usuario*/ 1 && a_href_value !== (a_href_value = /*repositorio*/ ctx[2].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:12) {#each usuario.repositorios_recentes as repositorio}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div7;
    	let barrasuperior;
    	let t0;
    	let div6;
    	let div1;
    	let a;
    	let div0;
    	let style_background_image = `url(${/*usuario*/ ctx[0].avatar_url})`;
    	let a_href_value;
    	let t1;
    	let div5;
    	let t2;
    	let div2;
    	let t3;
    	let span0;
    	let t4_value = /*usuario*/ ctx[0].login + "";
    	let t4;
    	let t5;
    	let div3;
    	let t6;
    	let span1;
    	let t7_value = /*usuario*/ ctx[0].login + "";
    	let t7;
    	let t8;
    	let div4;
    	let t9;
    	let span2;
    	let t10_value = /*usuario*/ ctx[0].repositorios_publicos + "";
    	let t10;
    	let t11;
    	let current;
    	barrasuperior = new BarraSuperior({ $$inline: true });
    	let if_block0 = /*usuario*/ ctx[0].name && create_if_block_1(ctx);
    	let if_block1 = /*temRepositorios*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			create_component(barrasuperior.$$.fragment);
    			t0 = space();
    			div6 = element("div");
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			t1 = space();
    			div5 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div2 = element("div");
    			t3 = text("Usuario: ");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			t6 = text("Seguidores: ");
    			span1 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			div4 = element("div");
    			t9 = text("Repositorio: ");
    			span2 = element("span");
    			t10 = text(t10_value);
    			t11 = text("\r\n\r\n        //Repositorios Recentes\r\n\r\n      ");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "foto-usuario svelte-10uahd0");
    			set_style(div0, "background-image", style_background_image);
    			add_location(div0, file$1, 14, 4, 418);
    			attr_dev(a, "href", a_href_value = /*usuario*/ ctx[0].perfil_url);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$1, 13, 4, 352);
    			attr_dev(div1, "class", "foto-container svelte-10uahd0");
    			add_location(div1, file$1, 12, 3, 318);
    			attr_dev(span0, "class", "svelte-10uahd0");
    			add_location(span0, file$1, 31, 14, 753);
    			attr_dev(div2, "class", "info svelte-10uahd0");
    			add_location(div2, file$1, 30, 4, 719);
    			attr_dev(span1, "class", "svelte-10uahd0");
    			add_location(span1, file$1, 35, 17, 838);
    			attr_dev(div3, "class", "info svelte-10uahd0");
    			add_location(div3, file$1, 34, 4, 801);
    			attr_dev(span2, "class", "svelte-10uahd0");
    			add_location(span2, file$1, 39, 18, 932);
    			attr_dev(div4, "class", "info svelte-10uahd0");
    			add_location(div4, file$1, 38, 4, 894);
    			attr_dev(div5, "class", "detalhes-usuario svelte-10uahd0");
    			add_location(div5, file$1, 20, 3, 540);
    			attr_dev(div6, "class", "usuario svelte-10uahd0");
    			add_location(div6, file$1, 11, 2, 292);
    			attr_dev(div7, "class", "card-usuario svelte-10uahd0");
    			add_location(div7, file$1, 8, 1, 240);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			mount_component(barrasuperior, div7, null);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t2);
    			append_dev(div5, div2);
    			append_dev(div2, t3);
    			append_dev(div2, span0);
    			append_dev(span0, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, t6);
    			append_dev(div3, span1);
    			append_dev(span1, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, t9);
    			append_dev(div4, span2);
    			append_dev(span2, t10);
    			append_dev(div6, t11);
    			if (if_block1) if_block1.m(div6, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*usuario*/ 1 && style_background_image !== (style_background_image = `url(${/*usuario*/ ctx[0].avatar_url})`)) {
    				set_style(div0, "background-image", style_background_image);
    			}

    			if (!current || dirty & /*usuario*/ 1 && a_href_value !== (a_href_value = /*usuario*/ ctx[0].perfil_url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (/*usuario*/ ctx[0].name) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div5, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty & /*usuario*/ 1) && t4_value !== (t4_value = /*usuario*/ ctx[0].login + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*usuario*/ 1) && t7_value !== (t7_value = /*usuario*/ ctx[0].login + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*usuario*/ 1) && t10_value !== (t10_value = /*usuario*/ ctx[0].repositorios_publicos + "")) set_data_dev(t10, t10_value);

    			if (/*temRepositorios*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(barrasuperior.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(barrasuperior.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(barrasuperior);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Usuario', slots, []);
    	let { usuario } = $$props;
    	let temRepositorios;

    	$$self.$$.on_mount.push(function () {
    		if (usuario === undefined && !('usuario' in $$props || $$self.$$.bound[$$self.$$.props['usuario']])) {
    			console_1.warn("<Usuario> was created without expected prop 'usuario'");
    		}
    	});

    	const writable_props = ['usuario'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Usuario> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('usuario' in $$props) $$invalidate(0, usuario = $$props.usuario);
    	};

    	$$self.$capture_state = () => ({ BarraSuperior, usuario, temRepositorios });

    	$$self.$inject_state = $$props => {
    		if ('usuario' in $$props) $$invalidate(0, usuario = $$props.usuario);
    		if ('temRepositorios' in $$props) $$invalidate(1, temRepositorios = $$props.temRepositorios);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*usuario, temRepositorios*/ 3) {
    			{
    				$$invalidate(1, temRepositorios = Boolean(usuario.repositorios_recentes.length));
    				console.log(temRepositorios);
    			}
    		}
    	};

    	return [usuario, temRepositorios];
    }

    class Usuario extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { usuario: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Usuario",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get usuario() {
    		throw new Error("<Usuario>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set usuario(value) {
    		throw new Error("<Usuario>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.58.0 */
    const file = "src\\App.svelte";

    // (22:1) {#if usuario}
    function create_if_block(ctx) {
    	let usuario_1;
    	let current;

    	usuario_1 = new Usuario({
    			props: { usuario: /*usuario*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(usuario_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(usuario_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const usuario_1_changes = {};
    			if (dirty & /*usuario*/ 1) usuario_1_changes.usuario = /*usuario*/ ctx[0];
    			usuario_1.$set(usuario_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(usuario_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(usuario_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(usuario_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(22:1) {#if usuario}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let header;
    	let titulo;
    	let t0;
    	let div0;
    	let formulario;
    	let t1;
    	let current;
    	titulo = new Titulo({ $$inline: true });
    	formulario = new Formulario({ $$inline: true });
    	formulario.$on("aoAlterarUsuario", /*definirUsuario*/ ctx[1]);
    	let if_block = /*usuario*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			header = element("header");
    			create_component(titulo.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(formulario.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "buscar-usuario svelte-qaeqfk");
    			add_location(div0, file, 14, 2, 325);
    			attr_dev(header, "class", "svelte-qaeqfk");
    			add_location(header, file, 10, 1, 297);
    			attr_dev(div1, "class", "app svelte-qaeqfk");
    			add_location(div1, file, 9, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, header);
    			mount_component(titulo, header, null);
    			append_dev(header, t0);
    			append_dev(header, div0);
    			mount_component(formulario, div0, null);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*usuario*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*usuario*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titulo.$$.fragment, local);
    			transition_in(formulario.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titulo.$$.fragment, local);
    			transition_out(formulario.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(titulo);
    			destroy_component(formulario);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let usuario = null;

    	function definirUsuario(evento) {
    		$$invalidate(0, usuario = evento.detail);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Formulario,
    		Titulo,
    		Usuario,
    		usuario,
    		definirUsuario
    	});

    	$$self.$inject_state = $$props => {
    		if ('usuario' in $$props) $$invalidate(0, usuario = $$props.usuario);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [usuario, definirUsuario];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
