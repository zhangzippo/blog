---
category: 项目经验
tags:
  - js
date: 2019-05-12
title: webpack4 + vue多页面项目精细构建思路
header-title: true
vssue-title: webpack4 + vue多页面项目精细构建思路
---

# webpack4 + vue多页面项目精细构建思路

虽然当前前端项目多以单页面为主，但多页面也并非一无是处，在一些情况下也是有用武之地的，比如：
1. 项目庞大，各个业务模块需要解耦
2. SEO更容易优化
3. 没有复杂的状态管理问题 
4. 可以实现页面单独上线
## 前言
这里就第4点做一些解释，也对多页面的应用场景做一个我认为有价值的思路，在组内的一个项目中，因为项目日益膨胀，拆分系统有一定困难，项目页面达到200+个以上， 因此构建速度十分缓慢，部署时间也很长，经常因为文案的更改及一些简单的bug修复就要进行重新构建，如果采用单页面一方面构建部署时间会随着体量增大，另一方面在工程上不好进行拆分。这时候多页面就存在一种优势，我们可以在前端做一个空框架只包含菜单，内容区域采用多页面结构，当我们部署上线时可以只针对单个页面进行上线，速度大幅度提升（单页面内部可以集成前端路由），这样业务模块间也可平滑解耦。
## 项目架构
vue +  typescript + webpack4
vue项目，并没有使用vue-cli，原因是对于开发人员来说，了解构建的详细流程很重要，vue-cli这类工具的目的是快速实现项目的搭建，让开发人员快速接手，快速进入 业务代码编写，因此隐含的为我们做了很多事，很多构建及本地开发的优化等等，但对于开发人员来说了解每个步骤，每个细节是做什么的对自身成长很有帮助（尤其是组里的很多程序员都不爱使用高度封装的东西）。
## 思路
对于多页面来说，与单页面对比无非就是以下几个问题：
> 1. entry入口文件为多个，需要考虑页面多需要自动生成，少的话提前预置几个就可以。
> 2. htmlWebpackPlugin使用时也需要相应的添加多个。
> 3. 公共静态资源提取的问题，splitchunkplugin是否需要使用的问题。
> 4. 最后就是支持项目的部分构建的功能实现

为达到我们的终极目标，也就是能够部分代码进行构建，我们将一个项目从业务角度进行一个划分，两个层级，模块和页面，模块代表一个具体业务场景，页面代表这个业务场景的各个页面，我们将支持进行单/多模块和单/多页面的打包。
## 开始
首先先看一下我们的项目目录结构
#### 自动生成entry
由于我们的页面非常之多，因此我们肯定是需要自动生成entry文件的，并且这一步是需要在进入webpack构建流程之前就要做好的。我们创建一个build_entries.ts的文件，用于编写创建entry流程,这里放一些核心代码
```javascript

const getTemplate = pagePath => {
  return (
  `
import App from '${pagePath}';
import Vue from 'vue';
  new Vue({
  render: function (h) {
  return h(App);
}
}).$mount('#app');`);
}
const scriptReg = /<script([\s\S]*?)>/;
/**
 * 判断文件应该采用的后缀
 */
const getSuffix = (source: string): string => {
  const matchArr = source.match(scriptReg) || [];
  if(matchArr[1].includes('ts')){
    return '.ts'
  }
  return '.js';
};

const generateEntries = () => {
  const entries = {};
  /***一些前置代码拿到pages*/
  if (!pages.length) return entries;
  // 清除entries
  rimraf.sync(entryPath+'/*.*');
 
  pages.forEach(page => {
    const relativePage = path.relative(vueRoot, page);
    const source = fs.readFileSync(page, 'utf8');
    const suffix = getSuffix(source);
    const pageEntry = path.resolve(entryPath, relativePage.replace(/\/index\.vue$/, '').replace(/\//g, '.')) + suffix;
    const entryName = path.basename(pageEntry, suffix);
    entries[entryName] = pageEntry
    if (fs.existsSync(pageEntry)) return;
    const pagePath = path.resolve(vueRoot, relativePage);
    const template = getTemplate(pagePath);
    fs.writeFileSync(pageEntry, template, 'utf-8');
  });
  return entries
}

export const getEntriesInfos = ()=>{
  return generateEntries();
}

```
大概解释下思路，我们规定项目目录结构为modules/xxmodle/xxpage,我们以命名为index.vue的页面为入口页面，为每个index.vue创建入口的js模版（getTemplete方法），生成的entry名称为"模块名.页面名.js"。因为项目内需要支持ts，因此我们还需要判断vue内的script标签的语言，以便创建ts格式的entry还是js格式的entry。
我们的webpack配置：
```javascript
const entries  = getEntriesInfos();
const common = {
  entry: entries,
  output: {
    filename: `[name]-[hash].bundle.js`,
    path: path.resolve(rootPath, 'static'),
    publicPath,
  },
```
#### 公共文件提取
因为我们是多页面，每个页面都需要加载核心的包（如vue,element-ui,lodash等等）而这类包我们是不常变化的，因此我们需要使用webpack的dllplugin来剥离他们出来，不参与构建，我们的项目中也可能会有我们自己的全局工具包，这部分代码不适合提取，只需要在entry中再加入一个common的entry即可。对于单页面内是否需要使用splitchunk，在我的实践中是没有使用的，但是这个看情况，如果页面引用的包确实比较大（毕竟vue这类框架包已经被提取出去了，这个概率不大）那么可以使用splitchunk来分离，我目前的实践是合并到一个页面的js内，单页面js在gzip后在200k以内都可忍受。
下面放一下dll的配置
webpack.dll.config.ts
```javascript
const commonLibs = ['vue','element-ui','moment', 'lodash']

export default {
  mode: 'production',
  entry: {
    commonLibs
  },
  output: {
    path: path.join(__dirname, 'dll_libs'),
    filename: 'dll.[name].[hash:8].min.js',
    library: '[name]',
    // publicPath: '/static/'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DllPlugin({
      context: __dirname,
      path: path.join(__dirname, 'dll_libs/', '[name]-manifest.json'),
      name: '[name]'
    }),
    new assetsWebpackPlugin({
      filename: 'dll_assets.json',
      path: path.join(__dirname,'assets/')
    })
  ]
} as webpack.Configuration;
```
如代码所示我们将'vue','element-ui','moment', 'lodash'这几个组件提取打成一个公共包命名为commonLib，这里使用了assetsWebpackPlugin用于生成一个json文件，记录每次dll构建的文件名（因为每次构建hash是不一样的），为的是在使用webpackhtmlplugin的时候拿到这个结果注入到模版页面中去。
生成的json记录类似：
```
{"commonLibs":{"js":"dll.commonLibs.51be3e86.min.js"}}
```
这样我们就可以在webpack配置文件中取到这个名字：
```
const dllJson = require('./assets/dll_assets.json');
for(let entryKey in entries){
  if(entryKey!== 'global'){
    common.plugins.push(
      new HtmlWebpackPlugin({
        title: allConfiguration[entryKey].title,
        isDebug: process.env.DEBUG,
        filename: `${entryKey}.html`,
        template: 'index.html',
        chunks:['global', entryKey, ],
        chunksSortMode: 'manual',
        dll_common_assets: process.env.NODE_ENV !== 'production'?'./dll_libs/' + dllJson.commonLibs.js : publicPath + 'dll_libs/' + dllJson.commonLibs.js,
      
      }),
    )
  }
}
```
因为是多页面，因此我们webpackhtml使用时也是要添加多个的，这里根据生成的json拿到dll的文件名注入到模版页面中。
#### 按需打包
接下来我们要支持进行按需构建打包，支持单/多模块以及单/多页面的打包，这里怎么做呢，可以在构建时传入环境变量，然后在build_entry中判断环境变量进行局部打包，因为打包的入口是entry的数量决定的。
命令可以这样构成：
```
 MODULES=xxx,xxx PAGES=sss,sss npm run build
```
build_entry相关代码,在generateEntries方法中
```
const entries = {};
  const buildModules = process.env.MODULES || '*';
  const buildPages = process.env.PAGES || '*';
  const filePaths = `${!buildModules.includes(',') ? buildModules : '{'+buildModules+'}'}/${!buildPages.includes(',') ? buildPages : '{'+buildPages+'}'}/*.vue`
  const pages = glob.sync(path.resolve(vueRoot, filePaths)).filter(file =>{
    return /index\.vue$/.test(file) || [];
  })
  if (!pages.length) return entries;
```
上面的方法根据传入的环境变量拼对应的页面及模块路径，通过glob的支持生成对应的entyr进行构建。
#### 多页面线上发布
多页面构建完成之后就是发布流程，发布流程其实也会变的简单，如果是单页面每次构建完成都要整体替换静态文件（js,css）,多页面模式下，我们只需要替换对应页面的文件即可，一般的思路是页面文件可以上传到部署的服务器，然后静态js，css等文件直接扔到CDN上即可，发布不会影响到其他页面，即便出错也不会影响项目，而且效率极高，这部分代码就不展示了，只是提供思路，毕竟每个项目发布流程都不太一样。
## 总结
以上是我对多页面应用场景的一个思路，它是有一定的适用场景的，比较适合大而全而且模块划分清晰的系统。
