const fs = require("fs");
const path = require("path");
const babylon = require("babylon");
const traverse = require("@babel/traverse").default;
const { transformFromAst } = require("@babel/core");

let ID = 0;
/**
 * 读取一个文件，查找import引入的文件作为依赖
 * 返回一个模块，包含id、文件名、所有的依赖文件（数组）并把该文件转为es5
 * @param filename 文件路径
 * @returns
 *
 */
function createAST(filename) {
  // 读取文件内容
  const content = fs.readFileSync(filename, "utf-8");

  // 转化为AST
  const AST = babylon.parse(content, {
    sourceType: "module",
  });

  // 存储该文件的所有依赖
  const deps = [];

  // 获取文件的所有import引入的依赖
  traverse(AST, {
    ImportDeclaration: ({ node }) => {
      deps.push(node.source.value);
    },
  });

  // 转化为es5
  const { code } = transformFromAst(AST, null, {
    presets: ["@babel/preset-env"],
  });

  const id = ID++;

  return {
    id,
    filename,
    deps,
    code,
  };
}

/**
 *递归获得所有的依赖模块
 */
function createGraph(entry) {
  const mainAsset = createAST(entry);
  // 所有的依赖
  const queue = [mainAsset];

  for (let asset of queue) {
    // 每个文件的依赖
    asset.mapping = {};

    const dirname = path.dirname(asset.filename);

    asset.deps.forEach((relativePath) => {
      const absPath = path.join(dirname, relativePath);

      const child = createAST(absPath);
      asset.mapping[relativePath] = child.id;
      queue.push(child);
    });
  }
  return queue;
}

// 将node module转化为浏览器能识别的js
// https://www.ruanyifeng.com/blog/2015/05/commonjs-in-browser.html
function bundle(graph) {
  let modules = "";
  graph.forEach((mod) => {
    console.log(mod)
    modules += `${mod.id}: [
    function (require, module, exports) { ${mod.code} },
    ${JSON.stringify(mod.mapping)},
    ],`;
  });
  const result = `
    (function(modules) {
    function require(id) {
    const [fn, mapping] = modules[id];
    function localRequire(name) {
    return require(mapping[name]);
    }
    const module = { exports : {} };
    fn(localRequire, module, module.exports);
    return module.exports;
    }
    require(0);
    })({${modules}})
    `;
  return result;
}
let res = bundle(createGraph('./src/entry.js'))
