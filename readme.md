# minipack
实现webpack的基本功能，即设置入口文件，找到所有的依赖文件，打包成一个bundle

## 核心原理
三个函数
### createAST
将js文件转化成模块
1. 通过(babylon)[https://www.npmjs.com/package/babylon]将js文件转换成AST
2. 将文件的所有依赖(import引入的文件)放进`deps`数组`['./name.js']`
3. 将js通过babel转化成低版本的js代码
4. 返回模块

### createGragh
递归获得依赖图集


### bundle
将依赖图集的commonjs模块转化成浏览器能识别的模块
因为浏览器缺少node中的`module`, `export`, `require`等环境变量
具体实现就是封装一个带有这几个变量的自执行函数
```js
var module = {
exports: {}
};
(function(module, exports) {
exports.multiply = function (n) { return n * 1000 };
}(module, module.exports))
var f = module.exports.multiply;
f(5) // 5000
```



## 参考
[浏览器加载 CommonJS 模块的原理与实现](https://www.ruanyifeng.com/blog/2015/05/commonjs-in-browser.html)
[minipack原理](https://segmentfault.com/a/1190000015291911)