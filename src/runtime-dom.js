// import { effect, reactive } from './reactivity';

{/* <script src="https://unpkg.com/@vue/reactivity@3.0.5/dist/reactivity.global.js"></script> */ }

// const { effect, ref } = VueReactivity



function getSequence(arr) {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = result.length - 1
            while (u < v) {
                c = (u + v) >> 1
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}

function shouldSetAsProps(el, key, value) {
    // 特殊处理
    if (key === 'form' && el.tagName === 'INPUT') return false
    // 兜底
    return key in el
}
// 文本节点的 type 标识
const Text = Symbol()
// 注释节点的 type 标识
const Comment = Symbol()
const Fragment = Symbol();
function createRenderer(options) {
    const { createElement, setElementText, insert, patchProps } = options
    function patch(oldNode, newNode, container, anchor) {
        // 如果 oldNode 存在，则对比 oldNode 和 newNode 的类型
        if (oldNode && oldNode.type !== newNode.type) {
            // 如果新旧 vnode 的类型不同，则直接将旧 vnode 卸载
            unmount(oldNode)
            oldNode = null
        }
        // 代码运行到这里，证明 oldNode 和 newNode 所描述的内容相同
        const { type } = newNode
        // 如果 newNode.type 的值是字符串类型，则它描述的是普通标签元素
        // if (typeof newNode === 'string') {
        //     setElementText(container, newNode);
        // } else
        if (typeof type === 'string') {
            if (!oldNode) {
                mountElement(newNode, container, anchor)
            } else {
                // 更新dom元素差异
                patchElement(oldNode, newNode)
            }
        } else if (type === Text) {
            // 文本节点
            // 如果没有旧节点，则进行挂载
            if (!oldNode) {
                // 使用 createTextNode 创建文本节点
                const el = newNode.el = createText(newNode.children);
                // 将文本节点插入到容器中
                insert(el, container)
            } else {
                // 如果旧 vnode 存在，只需要使用新文本节点的文本内容更新旧文本节点即可
                const el = newNode.el = oldNode.el
                if (newNode.children !== oldNode.children) {
                    setText(el, newNode.children)
                }
            }
        } else if (type === Fragment) {
            if (!oldNode) {
                // 如果旧 vnode 不存在，则只需要将 Fragment 的 children 逐个挂载即可
                newNode.children.forEach(c => patch(null, c, container))
            } else {
                // 如果旧 vnode 存在，则只需要更新 Fragment 的 children 即可
                patchChildren(oldNode, newNode, container)
            }
        } else if (typeof type === 'object') {
            // 如果 newNode.type 的值的类型是对象，则它描述的是组件
        } else if (type === 'xxx') {
            // 处理其他类型的 vnode
        }
    }

    function mountElement(vnode, container, anchor) {
        const el = vnode.el = createElement(vnode.type);
        if (typeof vnode.children === 'string') {
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {
            vnode.children.forEach(child => {
                patch(null, child, el)
            })
        }

        // props处理
        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }

        insert(el, container, anchor)
    }

    function patchElement(oldNode, newNode) {
        const el = newNode.el = oldNode.el
        const oldProps = oldNode.props
        const newProps = newNode.props
        // 第一步：更新 props(在new没在old中要新设置，在old有new没有要去除)
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key])
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                patchProps(el, key, oldProps[key], null)
            }
        }
        // 第二步：更新 children
        patchChildren(oldNode, newNode, el)
    }

    function patchChildren(oldNode, newNode, container) {
        // 判断新子节点的类型是否是文本节点
        if (typeof newNode.children === 'string') {
            // 旧子节点的类型有三种可能：没有子节点、文本子节点以及一组子节点
            // 只有当旧子节点为一组子节点时，才需要逐个卸载，其他情况下什么都不需要做
            if (Array.isArray(oldNode.children)) {
                oldNode.children.forEach((c) => unmount(c))
            }
            // 最后将新的文本节点内容设置给容器元素
            setElementText(container, newNode.children)
        } else if (Array.isArray(newNode.children)) {
            // 封装 patchKeyedChildren 函数处理两组子节点

            // 双端比较diff
            // patchKeyedChildren(oldNode, newNode, container)

            // 快速diff
            quickKeyedChildren(oldNode, newNode, container)

            // 说明新子节点是一组子节点
            // 判断旧子节点是否也是一组子节点
            // if (Array.isArray(oldNode.children)) {
            //     // 代码运行到这里，则说明新旧子节点都是一组子节点，这里涉及核心的 Diff 算法
            //     // 重新实现两组子节点的更新方式

            //     // 新旧 children
            //     const oldChildren = oldNode.children
            //     const newChildren = newNode.children

            //     // 旧的一组子节点的长度
            //     // const oldLen = oldChildren.length
            //     // // 新的一组子节点的长度
            //     // const newLen = newChildren.length
            //     // // 两组子节点的公共长度，即两者中较短的那一组子节点的长度
            //     // const commonLength = Math.min(oldLen, newLen)
            //     // // 遍历 commonLength 次

            //     // for (let i = 0; i < commonLength; i++) {
            //     //     patch(oldChildren[i], newChildren[i], container)
            //     // }
            //     // // 如果 newLen > oldLen，说明有新子节点需要挂载
            //     // if (newLen > oldLen) {
            //     //     for (let i = commonLength; i < newLen; i++) {
            //     //         patch(null, newChildren[i], container)
            //     //     }
            //     // } else if (oldLen > newLen) {
            //     //     // 如果 oldLen > newLen，说明有旧子节点需要卸载
            //     //     for (let i = commonLength; i < oldLen; i++) {
            //     //         unmount(oldChildren[i])
            //     //     }
            //     // }    
            //     // 用来存储寻找过程中遇到的最大索引值

            //     let lastIndex = 0
            //     // 遍历新的 children
            //     for (let i = 0; i < newChildren.length; i++) {
            //         const newVNode = newChildren[i]
            //         let j = 0;
            //         // 初始值为 false，代表没找到
            //         let find = false;
            //         // 遍历旧的 children
            //         for (j; j < oldChildren.length; j++) {
            //             const oldVNode = oldChildren[j]
            //             // 如果找到了具有相同 key 值的两个节点，说明可以复用，但仍然需要调用 patch 函数更新

            //             if (newVNode.key === oldVNode.key) {
            //                 // 一旦找到可复用的节点，则将变量 find 的值设为 true
            //                 find = true
            //                 // 更新了文本及属性，但并未移动
            //                 patch(oldVNode, newVNode, container)
            //                 if (j < lastIndex) {
            //                     // 都需要移动
            //                     const prevVNode = newChildren[i - 1]
            //                     // 如果 prevVNode 不存在，则说明当前 newVNode 是第一个节点，它不需要移动
            //                     if (prevVNode) {
            //                         const anchor = prevVNode.el.nextSibling;
            //                         insert(newVNode.el, container, anchor)
            //                     }
            //                 } else {
            //                     lastIndex = j
            //                 }
            //                 break // 这里需要 break
            //             }
            //         }
            //         if (!find) {
            //             // 首先获取当前 newVNode 的前一个 vnode 节点
            //             const prevVNode = newChildren[i - 1]
            //             let anchor = null;
            //             if (prevVNode) {
            //                 // 如果有前一个 vnode 节点，则使用它的下一个兄弟节点作为锚点元素
            //                 anchor = prevVNode.el.nextSibling
            //             } else {
            //                 // 如果没有前一个 vnode 节点，说明即将挂载的新节点是第一个子节点
            //                 // 这时我们使用容器元素的 firstChild 作为锚点
            //                 anchor = container.firstChild
            //             }
            //             //  新增元素 挂载 newVNode
            //             patch(null, newVNode, container, anchor)
            //         }
            //     }

            //     // 删除元素
            //     for (let i = 0; i < oldChildren.length; i++) {
            //         const oldVNode = oldChildren[i];
            //         const has = newChildren.find(
            //             vnode => vnode.key === oldVNode.key
            //         )
            //         if (!has) {
            //             // 如果没有找到具有相同 key 值的节点，则说明需要删除该节点
            //             // 调用 unmount 函数将其卸载
            //             unmount(oldVNode)
            //         }
            //     }
            // } else {
            //     // 此时：
            //     // 旧子节点要么是文本子节点，要么不存在
            //     // 但无论哪种情况，我们都只需要将容器清空，然后将新的一组子节点逐个挂载
            //     setElementText(container, '')
            //     newNode.children.forEach(c => patch(null, c, container))
            // }
        } else {
            // 代码运行到这里，说明新子节点不存在
            // 旧子节点是一组子节点，只需逐个卸载即可
            if (Array.isArray(oldNode.children)) {
                oldNode.children.forEach(c => unmount(c))
            } else if (typeof oldNode.children === 'string') {
                // 旧子节点是文本子节点，清空内容即可
                setElementText(container, '')
            }
            // 如果也没有旧子节点，那么什么都不需要做
        }
    }


    function patchKeyedChildren(oldNode, newNode, container) {
        const oldChildren = oldNode.children
        const newChildren = newNode.children
        // 四个索引值

        let oldStartIdx = 0
        let oldEndIdx = oldChildren.length - 1
        let newStartIdx = 0
        let newEndIdx = newChildren.length - 1

        // 四个索引指向的 vnode 节点
        let oldStartVNode = oldChildren[oldStartIdx]
        let oldEndVNode = oldChildren[oldEndIdx]
        let newStartVNode = newChildren[newStartIdx]
        let newEndVNode = newChildren[newEndIdx]

        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            console.log("🚀 ~ patchKeyedChildren ~ newEndIdx:", newEndIdx)
            console.log("🚀 ~ patchKeyedChildren ~ newStartIdx:", newStartIdx)
            console.log("🚀 ~ patchKeyedChildren ~ oldEndIdx:", oldEndIdx)
            console.log("🚀 ~ patchKeyedChildren ~ oldStartIdx:", oldStartIdx)

            if (!oldStartVNode) {
                oldStartVNode = oldChildren[++oldStartIdx]
            } else if (!oldEndVNode) {
                oldEndVNode = oldChildren[++oldEndIdx]
            } else if (oldStartVNode.key === newStartVNode.key) {
                console.log('第四轮')
                // 第一步：oldStartVNode 和 newStartVNode 比较
                patch(oldStartVNode, newStartVNode, container)
                oldStartVNode = oldChildren[++oldStartIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else if (oldEndVNode.key === newEndVNode.key) {
                console.log('第二轮')
                // 第二步：oldEndVNode 和 newEndVNode 比较
                // 都在尾部不需要移动
                patch(oldEndVNode, newEndVNode, container)
                oldEndVNode = oldChildren[--oldEndIdx]
                newEndVNode = newChildren[--newEndIdx]
            } else if (oldStartVNode.key === newEndVNode.key) {
                console.log('第三轮')
                // 第三步：oldStartVNode 和 newEndVNode 比较
                patch(oldStartVNode, newEndVNode, container)
                insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)
                oldStartVNode = oldChildren[++oldStartIdx]
                newEndVNode = newChildren[--newEndIdx]
            } else if (oldEndVNode.key === newStartVNode.key) {
                console.log('第一轮')
                // 第四步：oldEndVNode 和 newStartVNode 比较
                // 仍然需要调用 patch 函数进行打补丁
                patch(oldEndVNode, newStartVNode, container)
                // 移动 DOM 操作
                // oldEndVNode.el 移动到 oldStartVNode.el 前面
                insert(oldEndVNode.el, container, oldStartVNode.el)
                // 移动 DOM 完成后，更新索引值，并指向下一个位置
                oldEndVNode = oldChildren[--oldEndIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else {
                // 新的一组子节点中的头部节点去旧的一组子节点中寻找
                const idxInOld = oldChildren.findIndex(
                    node => node.key === newStartVNode.key
                )

                if (idxInOld > 0) {
                    const vnodeToMove = oldChildren[idxInOld]
                    patch(vnodeToMove, newStartVNode, container)
                    insert(vnodeToMove.el, container, oldStartVNode.el)
                    // 原有位置换成无
                    oldChildren[idxInOld] = undefined
                    // 最后更新 newStartIdx 到下一个位置
                    newStartVNode = newChildren[++newStartIdx]
                } else {
                    // 新增节点
                    // 将 newStartVNode 作为新节点挂载到头部，使用当前头部节点oldStartVNode.el 作为锚点
                    patch(null, newStartVNode, container, oldStartVNode.el)
                    newStartVNode = newChildren[++newStartIdx];
                }
            }
        }

        // 循环结束后检查索引值的情况
        if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
            // 如果满足条件，则说明有新的节点遗留，需要挂载它们
            for (let i = newStartIdx; i <= newEndIdx; i++) {
                const anchor = newChildren[newEndIdx + 1] ?
                    newChildren[newEndIdx + 1].el : null;
                patch(null, newChildren[i], container, anchor);
            }
        } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
            // 移除操作
            for (let i = oldStartIdx; i <= oldEndIdx; i++) {
                unmount(oldChildren[i])
            }
        }
    }

    function quickKeyedChildren(oldNode, newNode, container) {
        const newChildren = newNode.children
        const oldChildren = oldNode.children

        // 处理相同的前置节点
        // 索引 j 指向新旧两组子节点的开头
        let j = 0
        let oldVNode = oldChildren[j]
        let newVNode = newChildren[j]

        while (oldVNode.key === newVNode.key) {
            patch(oldVNode, newVNode, container)
            j++;
            oldVNode = oldChildren[j]
            newVNode = newChildren[j]
        }


        // 更新相同的后置节点(为什么开头可以一个变量，结尾却用两个，因为长度可能不同)
        // 索引 oldEnd 指向旧的一组子节点的最后一个节点
        let oldEnd = oldChildren.length - 1
        // 索引 newEnd 指向新的一组子节点的最后一个节点
        let newEnd = newChildren.length - 1
        oldVNode = oldChildren[oldEnd]
        newVNode = newChildren[newEnd]

        while (oldVNode.key === newVNode.key) {
            patch(oldVNode, newVNode, container)
            oldEnd--;
            newEnd--;
            oldVNode = oldChildren[oldEnd]
            newVNode = newChildren[newEnd]
        }

        if (oldEnd < j && newEnd >= j) {
            // j-newEnd之间的节点需要挂载
            // 锚点的索引
            const anchorIndex = newEnd + 1
            // 锚点元素
            const anchor = anchorIndex < newChildren.length ?
                newChildren[anchorIndex].el : null

            while (j <= newEnd) {
                patch(null, newChildren[j++], container, anchor)
            }
        } else if (newEnd < j && oldEnd >= j) {
            // j-oldEnd之间的节点需要删除
            // 需要删除的节点
            while (j <= oldEnd) {
                unmount(oldChildren[j++])
            }
        } else {
            // 构造 source 数组
            // 新的一组子节点中剩余未处理节点的数量

            // 新的一组子节点中的节点在旧的一组子节点中的位置索引，后面将会使用它计算出一个最长递增子序列，并用于辅助完成 DOM 移动的操作
            const count = newEnd - j + 1
            const source = new Array(count)
            source.fill(-1);

            // 构建索引表优化性能
            //  oldStart 和 newStart 分别为起始索引，即 j
            const oldStart = j;
            const newStart = j;

            // 新增两个变量,moved和pos
            let moved = false;
            let pos = 0;

            // 新节点的构建索引表
            const keyIndex = {}
            for (let i = newStart; i <= newEnd; i++) {
                keyIndex[newChildren[i].key] = i
            }

            // 代表更新过的节点数量
            let patched = 0;

            for (let i = oldStart; i <= oldEnd; i++) {
                const oldVNode = oldChildren[i];
                // count是需要更新的数量
                if (patched < count) {
                    // 通过索引表快速找到新的一组子节点中具有相同 key 值的节点位置
                    const k = keyIndex[oldVNode.key]
                    if (typeof k !== 'undefined') {
                        newVNode = newChildren[k]
                        // 调用 patch 函数完成更新
                        patch(oldVNode, newVNode, container)
                        // 每更新一个节点，都将 patched 变量 +1
                        patched++
                        // 填充 source 数组
                        source[k - newStart] = i;
                        // k是新节点的下标,遍历旧的一组子节点的过程中遇到的最大索引值 k。
                        if (k < pos) {
                            moved = true
                        } else {
                            pos = k
                        }
                    } else {
                        // 没找到
                        unmount(oldVNode)
                    }
                } else {
                    // 如果更新过的节点数量大于需要更新的节点数量，则卸载多余的节点
                    unmount(oldVNode)
                }
            }
            console.log("🚀 ~ quickKeyedChildren ~ source:", source)

            if (moved) {
                // 在新的一组子节点中，重新编号后索引值为 0 和 1 的这两个节点在更新前后顺序没有发生变化。
                const seq = getSequence(source)
                console.log("🚀 ~ quickKeyedChildren ~ seq:", seq)
                // s 指向最长递增子序列的最后一个元素 - p4
                let s = seq.length - 1
                // i 指向新的一组子节点的最后一个元素 - p7
                let i = count - 1;
                for (i; i >= 0; i--) {
                    if (source[i] === -1) {
                        // 说明索引为 i 的节点是全新的节点，应该将其挂载
                        // 该节点在新 children 中的真实位置索引
                        const pos = i + newStart;
                        const newVNode = newChildren[pos]
                        // 该节点的下一个节点的位置索引
                        const nextPos = pos + 1
                        // 锚点
                        const anchor = nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null
                        patch(null, newVNode, container, anchor)
                    } else if (i !== seq[s]) {
                        // 2 !== 1
                        // seq[s]对应是新节点映射在旧节点的下标
                        // 如果节点的索引 i 不等于 seq[s] 的值，说明该节点需要移动
                        // 该节点在新的一组子节点中的真实位置索引
                        const pos = i + newStart
                        const newVNode = newChildren[pos]
                        // 该节点的下一个节点的位置索引
                        const nextPos = pos + 1
                        // 锚点
                        const anchor = nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null
                        console.log('insert几次')
                        insert(newVNode.el, container, anchor)
                    } else {
                        // 当 i === seq[s] 时，说明该位置的节点不需要移动
                        // 只需要让 s 指向下一个位置
                        s--
                    }
                }
            }
        }
    }

    function unmount(vnode) {
        // 在卸载时，如果卸载的 vnode 类型为 Fragment，则需要卸载其 children
        if (vnode.type === Fragment) {
            vnode.children.forEach(c => unmount(c))
            return
        }
        const parent = vnode.el.parentNode;
        // 调用 removeChild 移除元素
        if (parent) parent.removeChild(vnode.el)
    }

    function render(vnode, container) {
        if (vnode) {
            // 新 vnode 存在，将其与旧 vnode 一起传递给 patch 函数，进行打补丁
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                // 旧 vnode 存在，且新 vnode 不存在，说明是卸载（unmount）操作
                // 只需要将 container 内的 DOM 清空即可
                // container.innerHTML = '' // 事件绑定不会消失
                unmount(container._vnode);
            }
        }
        // 把 vnode 存储到 container._vnode 下，即后续渲染中的旧 vnode
        container._vnode = vnode
    }
    return {
        render
    }
}
const renderer = createRenderer({
    // 用于创建元素
    createElement(tag) {
        console.log(`创建元素 ${tag}`)
        return document.createElement(tag)
    },
    // 用于设置元素的文本节点
    setElementText(el, text) {
        console.log(`设置 ${el} 的文本内容：${text}`)
        el.textContent = text
    },
    // 用于在给定的 parent 下添加指定元素
    insert(el, parent, anchor = null) {
        // 参考节点之前插入一个拥有指定父节点的子节点
        // el插入到anchor之前，如果anchor为null，则插入到末尾
        console.log(`将 ${el} 添加到 ${parent} 下`)
        parent.insertBefore(el, anchor)
    },
    createText(text) {
        return document.createTextNode(text)
    },
    setText(el, text) {
        el.nodeValue = text
    },
    // 将属性设置相关操作封装到 patchProps 函数中，并作为渲染器选项传递
    patchProps(el, key, prevValue, nextValue) {
        // 匹配以 on 开头的属性，视其为事件
        if (/^on/.test(key)) {
            // 根据属性名称得到对应的事件名称，例如 onClick ---> click
            const name = key.slice(2).toLowerCase()
            // 获取为该元素伪造的事件处理函数 invoker
            const invokers = el._vei || (el._vei = {});
            //根据事件名称获取 invoker
            let invoker = invokers[key];
            if (nextValue) {
                if (!invoker) {
                    // 如果没有 invoker，则将一个伪造的 invoker 缓存到 el._vei 中
                    // vei 是 vue event invoker 的首字母缩写
                    invoker = el._vei[key] = (e) => {
                        // e.timeStamp 是事件发生的时间
                        // 如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
                        // 当伪造的事件处理函数执行时，会执行真正的事件处理函数
                        // 如果 invoker.value 是数组，则遍历它并逐个调用事件处理函数
                        if (e.timeStamp < invoker.attached) return
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach(fn => fn(e))
                        } else {
                            // 否则直接作为函数调用
                            invoker.value(e)
                        }
                    }
                    invoker.value = nextValue
                    // 添加 invoker.attached 属性，存储事件处理函数被绑定的时间
                    invoker.attached = performance.now()
                    el.addEventListener(name, invoker)
                } else {
                    // 如果 invoker 存在，意味着更新，并且只需要更新 invoker.value 的值即可
                    invoker.value = nextValue
                }
            } else if (invoker) {
                // 新的事件绑定函数不存在，且之前绑定的 invoker 存在，则移除绑定
                el.removeEventListener(name, invoker)
            }
        } else if (key === 'class') {
            el.className = nextValue || ''
        } else if (shouldSetAsProps(el, key, nextValue)) {
            // 获取该 DOM Properties 的类型
            const type = typeof el[key]
            // 如果是布尔类型，并且 nextValue 是空字符串，则将值矫正为 true
            if (type === 'boolean' && nextValue === '') {
                el[key] = true
            } else {
                el[key] = nextValue
            }
        } else {
            // 如果要设置的属性没有对应的 DOM Properties，则使用 setAttribute 函数设置属性
            el.setAttribute(key, nextValue)
        }
    }
})

export {
    renderer
}

// 首次渲染
// const vnode = {
//     // type: 'div',
//     // props: {
//     //     id: 'foo',
//     //     class: 'bar baz',
//     //     // 使用 onXxx 描述事件
//     //     onClick: [
//     //         // 第一个事件处理函数
//     //         () => {
//     //             alert('clicked 1')
//     //         }, // 第二个事件处理函数
//     //         () => {
//     //             alert('clicked 2')
//     //         }
//     //     ]
//     // },
//     // children: [
//     //     {
//     //         type: 'p',
//     //         children: 'hello'
//     //     },
//     //     {
//     //         type: Text,
//     //         children: 'Some Text'
//     //     }
//     // ]
//     type: 'ul',
//     children: [
//         {
//             type: Fragment,
//             children: [
//                 { type: 'li', children: 'text 1' },
//                 { type: 'li', children: 'text 2' },
//                 { type: 'li', children: 'text 3' }
//             ]
//         }
//     ]
// }



// 旧 vnode
// const oldVNode = {
//     type: 'div',
//     children: [
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: 'hello', key: 3 }

//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '3', key: 3 }

//         //  双端比较理想状态
//         // { type: 'p', children: '1', key: 1 },         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '2', key: 2 },         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '3', key: 3 },         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '4', key: 4 }          // { type: 'p', children: '3', key: 3 }

//         //  双端比较非理想状态
//         // { type: 'p', children: '1', key: 1 },         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '2', key: 2 },         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '3', key: 3 },         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '4', key: 4 }           // { type: 'p', children: '3', key: 3 }


//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '3', key: 3 },

//         // 快速diff算法
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '3', key: 3 },

//         { type: 'p', children: '1', key: 1 }, // 0
//         { type: 'p', children: '2', key: 2 }, // 1  j       0
//         { type: 'p', children: '3', key: 3 }, // 2          1
//         { type: 'p', children: '4', key: 4 }, // 3          2
//         { type: 'p', children: '6', key: 6 }, // 4  oldEnd  3
//         { type: 'p', children: '5', key: 5 }, // 5
//     ]
// }

// const newVNode = {
//     type: 'div',
//     children: [
//         // { type: 'p', children: 'world', key: 3 }, // 0新-2旧
//         // { type: 'p', children: '1', key: 1 }, // 1新-0旧
//         // { type: 'p', children: '2', key: 2 } // 2新-1旧

//         // { type: 'p', children: '3', key: 3 },
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '2', key: 2 },


//         // { type: 'p', children: '3', key: 3 },
//         // { type: 'p', children: '1', key: 1 },

//         //  双端比较理想状态
//         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '3', key: 3 }

//         // 双端比较非理想状态
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '3', key: 3 }


//         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '3', key: 3 },
//         // { type: 'p', children: '2', key: 2 }


//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '3', key: 3 },

//         // 快速diff算法
//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '4', key: 4 },
//         // { type: 'p', children: '2', key: 2 },
//         // { type: 'p', children: '3', key: 3 },

//         // { type: 'p', children: '1', key: 1 },
//         // { type: 'p', children: '3', key: 3 },

//         // 首尾节点后，更新下标的值
//         { type: 'p', children: '1', key: 1 },  // 0
//         { type: 'p', children: '3', key: 3 },  // 1  j       0
//         { type: 'p', children: '4', key: 4 },  // 2          1
//         { type: 'p', children: '2', key: 2 },  // 3          2
//         { type: 'p', children: '7', key: 7 },  // 4  newEnd  3
//         { type: 'p', children: '5', key: 5 },  // 5
//     ]
// }
// renderer.render(oldVNode, document.querySelector('#app'))

// setTimeout(() => {
//     renderer.render(newVNode, document.querySelector('#app'))
// }, 3000)
// const count = ref(1)
// const info = reactive({ age: 23, name: 'lilei' })

// effect(() => {
//     renderer.render(`<h1>${info.value}</h1>`,
//         document.getElementById('app'))
// })

// setTimeout(() => {
//     info.name = 'swl'
// }, 2000);

// 快速diff步骤（有key）：
// 1.根据key值先比较最长公共首尾节点，计算出需要挂载或者卸载的元素
// 2.剩余中间非理想的部分，根据key值索引表构建一个新节点在旧节点对应的下标数组，初始填充为-1。这个过程同时会卸载掉旧节点在新节点找不到的元素
// 3.基于这个构建的下标映射数组，找出这个数组的最长递增子序列返回子序列的下标
// 4.将新旧节点去掉公共首尾节点，重新下标排序。此时，子序列下标对应的正好为不需要更新的节点
// 5.子序列与新节点循环，不在子序列集合中的都需要移动，-1的为新挂载，循环条件为子序列最后一个元素--


// 双端diff(有key)

// 简单diff（无key）