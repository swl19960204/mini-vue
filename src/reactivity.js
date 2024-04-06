// 实现vue的响应式
const bucket = new WeakMap();
// 1.解决副作用命名问题
let activeEffect;
// 4.解决嵌套的effect与effect栈
const effectStack = [];
const ITERATE_KEY = Symbol()
// const obj2 = { text: 'hello Vue3', ok: true };
// const obj3 = { foo: 1, bar: 1 };
// const obj2Proxy = new Proxy(obj2, handlerWatch);

// 深响应和浅响应
function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            console.log("🚀 ~ file: oral.html:287 ~ get ~ receiver:", receiver)
            // 代理对象可以通过 raw 属性访问原始数据
            if (key === 'raw') {
                return target;
            }

            // 非只读的时候才需要建立响应联系
            if (!isReadonly) {
                track(target, key);
            }
            // return target[key];
            // return Reflect.get(target, key, receiver);
            const res = Reflect.get(target, key, receiver);
            if (isShallow) {
                return res;
            }
            if (typeof res === 'object' && res !== null) {
                // 如果数据为只读，则调用 readonly 对值进行包装
                return isReadonly ? readonly(res) : reactive(res)
            }
            return res
        },
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.warn(`属性 ${key} 是只读的`)
                return true;
            }
            // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
            // 如果代理目标是数组，则检测被设置的索引值是否小于数组长度
            const type = Array.isArray(target) ? Number(key) < target.length ? 'SET' : 'ADD'
                : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD';
            const oldVal = target[key];
            // target[key] = newVal;
            const res = Reflect.set(target, key, newVal, receiver);
            // NaN === NaN // false
            // target === receiver.raw 说明 receiver 就是 target 的代理对象
            if (target === receiver.raw) {
                if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
                    trigger(target, key, type, newVal);
                }
            }

            return res;
        },
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`属性 ${key} 是只读的`)
                return true;
            }
            // 检查被操作的属性是否是对象自己的属性
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            // 使用 Reflect.deleteProperty 完成属性的删除
            const res = Reflect.deleteProperty(target, key)

            if (res && hadKey) {
                // 只有当被删除的属性是对象自己的属性并且成功删除时，才触发更新
                trigger(target, key, 'DELETE')
            }

            return res
        },
        // x in obj
        has(target, key) {
            console.log("🚀 ~ file: oral.html:311 ~ has ~ key:", key)
            track(target, key);
            return Reflect.has(target, key);
        },
        // for...in
        ownKeys(target) {
            track(target, ITERATE_KEY);
            return Reflect.ownKeys(target);
        }
    });
}

export function reactive(obj) {
    return createReactive(obj)
}

export function shallowReactive(obj) {
    return createReactive(obj, true)
}

function readonly(obj) {
    return createReactive(obj, false, true)
}

export function shallowReadonly(obj) {
    return createReactive(obj, true /* shallow */, true)
}

// const obj3Proxy = reactive(obj3);

function track(target, key) {
    if (!activeEffect) {
        return target[key];
    }
    let depsMap = bucket.get(target);

    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }

    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    // bucket.add(activeEffect);
    deps.add(activeEffect)
    // deps 就是一个与当前副作用函数存在联系的依赖集合
    // 将其添加到 activeEffect.deps 数组中
    // Set → effectFn
    // effectFn → Set
    activeEffect.deps.push(deps);
}

function trigger(target, key, type, newVal) {
    console.log("🚀 ~ file: oral.html:300 ~ set ~ bucket:", bucket)
    const depsMap = bucket.get(target);
    if (!depsMap) return

    const effects = depsMap.get(key);


    // const effectsToRun = new Set(effects)
    const effectsToRun = new Set();
    effects && effects.forEach(ef => {
        if (ef !== activeEffect) {
            effectsToRun.add(ef)
        }
    })

    if (type === 'ADD' || type === 'DELETE') {
        // 取得与 ITERATE_KEY 相关联的副作用函数
        const iterateEffects = depsMap.get(ITERATE_KEY);
        // 将与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
        iterateEffects && iterateEffects.forEach(ef => {
            if (ef !== activeEffect) {
                effectsToRun.add(ef)
            }
        })
    }

    // 当操作类型为 ADD 并且目标对象是数组时，应该取出并执行那些与 length 属性相关联的副作用函数
    if (type === 'ADD' && Array.isArray(target)) {
        // 取出与 length 相关联的副作用函数
        const lengthEffects = depsMap.get('length')
        // 将这些副作用函数添加到 effectsToRun 中，待执行
        lengthEffects && lengthEffects.forEach(ef => {
            if (ef !== activeEffect) {
                effectsToRun.add(ef)
            }
        })
    }

    // 如果操作目标是数组，并且修改了数组的 length 属性
    if (Array.isArray(target) && key === 'length') {
        // 对于索引大于或等于新的 length 值的元素，
        // 需要把所有相关联的副作用函数取出并添加到 effectsToRun 中待执行
        depsMap.forEach((effects, key) => {
            if (key >= newVal) {
                effects.forEach(effectFn => {
                    if (effectFn !== activeEffect) {
                        effectsToRun.add(effectFn)
                    }
                })
            }
        })
    }

    // effectsToRun.forEach(fn => fn());
    effectsToRun.forEach(fn => {
        if (fn.options.scheduler) {
            fn.options.scheduler(fn);
        } else {
            fn();
        }
    });
    // return true;
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        // deps 是依赖集合 - Set
        const deps = effectFn.deps[i]
        // 将 effectFn 从依赖集合中移除
        deps.delete(effectFn)
    }
    // 最后需要重置 effectFn.deps
    effectFn.deps.length = 0;
}

export function effect(fn, options = {}) {
    const effectFn = () => {
        //调用 cleanup 函数完成清除工作
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        // 将 fn 的执行结果存储到 res
        const res = fn();
        // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并把activeEffect 还原为之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    };
    // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = [];
    effectFn.options = options;
    // 只有非 lazy 的时候，才执行
    if (!options.lazy) {
        effectFn()
    }
    return effectFn;
}


// 类似多次更新只执行一次
const jobQueue = new Set();
const p = Promise.resolve();

let isFlushing = false;
function flushJob() {
    if (isFlushing) return;
    isFlushing = true
    p.then(() => {
        jobQueue.forEach(job => job())
    }).finally(() => {
        isFlushing = false
    })
}

// effect(() => {
//     console.log('effect run')
//     // 3.分支切换与cleanup，即深层次依赖清除，
//     // 下面会触发两次effect,实际上当ok为false时，text的effect并不需要执行收集依赖
//     // 下次如果再触发，effect-text依赖还在，如果再触发text依赖仍然会触发，应该清除掉
//     // document.title = obj2Proxy.ok ? obj2Proxy.text : 'not';
//     // 5.无限递归循环
//     // obj3Proxy.foo++;
//     console.log(obj3Proxy.foo);
// }
//     // 6.支持调度系统
//     , {
//         scheduler(fn) {
//           // setTimeout(fn)
//          jobQueue.add(fn);
//           flushJob()
//        },
//     });
// 7.lazy，实现computed
// const effectFn = effect(() => obj3Proxy.foo + obj3Proxy.bar, { lazy: true });
// const computed = effectFn();

export function computed(getter) {
    let value;
    let dirty = true;
    const effectFn = effect(getter, {
        lazy: true, scheduler() {
            dirty = true;
            // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
            trigger(obj3Proxy, 'value');
        }
    });

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            // 当读取 value 时，手动调用 track 函数进行追踪
            track(obj3Proxy, 'value')
            return value;
        }
    }

    return obj
}
// const sumRes = computed(() => obj3Proxy.foo + obj3Proxy.bar);
// console.log("🚀 ~ file: oral.html:452 ~ computed:", sumRes.value);
// effect(() => {
//     // 在该副作用函数中读取 sumRes.value
//     console.log("🚀 ~ file: oral.html:455 ~ computed:", sumRes.value);
// })
// effect(() => {
//     'bar' in obj3Proxy;
// })
// obj3Proxy.foo++;
// 7.只有真正读取他的值，才会进行计算并得到值
// console.log("🚀 ~ file: oral.html:459 ~ computed:", sumRes.value);
// obj3Proxy.foo++;
// console.log('结束了')

// 8.实现watch
export function watch(source, cb, options = {}) {
    let getter;
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    let oldValue, newValue;

    // cleanup 用来存储用户注册的过期回调
    let cleanup;
    function onInvalidate(fn) {
        // 将过期回调存储到 cleanup 中
        cleanup = fn;
    }

    const job = () => {
        newValue = effectFn();
        // 在调用回调函数 cb 之前，先调用过期回调
        if (cleanup) {
            cleanup();
        }
        // 将 onInvalidate 作为回调函数的第三个参数，以便用户使用
        cb(newValue, oldValue, onInvalidate);
        // 当数据变化时，调用回调函数 cb
        // cb()
        oldValue = newValue;
    }
    const effectFn = effect(
        // 触发读取操作，从而建立联系
        () => getter(),
        {
            scheduler: () => {
                if (options.flush === 'post') {
                    const p = Promise.resolve();
                    p.then(job);
                } else {
                    job();
                }
            },
            lazy: true
        }
    )
    if (options.immediate) {
        job();
    } else {
        oldValue = effectFn();
    }
}

function traverse(value, seen = new Set()) {
    // 如果要读取的数据是原始值，或者已经被读取过了，那么什么都不做
    if (typeof value !== 'object' || value === null || seen.has(value)) {
        return
    }
    seen.add(value);
    // 假设 value 就是一个对象，使用 for...in 读取对象的每一个值，并递归地调用 traverse 进行处理
    for (const k in value) {
        traverse(value[k], seen);
    }
    return value
}

// watch(obj3Proxy, () => {
//     console.log('数据变化了')
// })
// watch(() => obj3Proxy.foo, (newVal, oldVal, onInvalidate) => {
//     console.log('数据变化了：', '新值：', newVal, '旧值：', oldVal)
//     // 定义一个标志，代表当前副作用函数是否过期，默认为 false，代表没有过期
//     let expired = false;

//     onInvalidate(() => {
//         expired = true;
//     })
//     // 发送网络请求
//     // 实际A轮较慢的回来了，只是改变变量，没有被赋值
//     // const res = await fetch('/path/to/request')
//     // 只有当该副作用函数的执行没有过期时，才会执行后续操作。
//     if (!expired) {
//         // finalData = res;
//     }
// }, { immediate: true, /* flush: 'post' */ })

// obj3Proxy.foo++;
// console.log('数据变化后我打印了console')

// setTimeout(() => {
//     obj2Proxy.text = 'hello World';
// }, 1000)
// setTimeout(() => {
// 2.解决无副作用属性也会触发响应式的问题
// 三重数据结构:weakMap(target,Map)/Map(Key,Set)/Set(effect)
// obj2Proxy.noExist = 'hello World';
// obj2Proxy.ok = false;
// obj2Proxy.text = 'hello World';
// }, 1000)
