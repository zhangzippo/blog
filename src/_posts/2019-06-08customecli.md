---
category: 前端工具
tags:
  - js
date: 2019-06-08
title: 写一个基于webpack的cli
header-title: true
vssue-title: 写一个基于webpack的cli
---
# 写一个基于webpack的cli

## 前言
我们经常接触到各种各样的前端脚手架和cli工具，像vue-cli就是一款基于webpack的cli工具，我们有时候也有针对自己个性化项目快速构建的需求，这时候我们可以自己写一个cli工具。
## 准备
这里我们介绍基于webpack去写一个cli工具，从前往后讲，我们写一个cli,首先要先定义命令，通过命令触发webpack的构建流程。那么我们基本上需要以下几个工具包：
> commander：命令行接口的完整解决方案,可以方便的创建自定义命令行
> inquirer：用于创建可交互的命令行
> webpack4: 构建的基础
有了以上几个核心工具包之后我们就可以开始编写我们的cli工具了
## 开始
先看一下我们的工作目录：

```
├── bin   --定义自定义命令
├── src
│   ├── build   -- 构建流程
│   ├── develop  -- 开发流程
│   ├── produce
│   └── utils
└── webpack  --webpack配置文件
```

### 配置命令
打开package.json,创建bin字段，为我们的命令起一个名字(例如block)，执行文件指向我们的bin目录。
```
"bin": {
    "block": "./bin/block-cli.js"
  },
```
这意味着我们的命令是以block开头的，例如block build,block init 等等。然后我们进行block-cli.js的编写，注意这个文件的开头一定要有#!/usr/bin/env node，关于这行的作用大家就自行百度吧。这里我们需要引入commander这个工具包了。这里简单介绍一下commander工具的用法：

```javascript
#!/usr/bin/env node
const program = require('commander');
/**
 * project init
 */
program
  .command('init')
  .description('project init')
  .action(() => {
    init();
  });
/**
 * create modules and pages
 */
program
  .command('create <paths...>')
  .description('create module‘s or page’s path')
  .action((paths) => {
    createTemplete(paths);
  });
/**
 * build progress
 */
program
  .command('build')
  .option('-m, --module [module]', 'Specified the build module')
  .option('-p, --page [page]', 'Specified the build page')
  .description('build the project')
  .action((options) => {
    process.env.NODE_ENV = 'production';
    const build = require('../lib/build/build');
    build(options.module, options.page);
  });
program.parse(process.argv);
```
我们主要使用到3个方法，option,command,action, 这里分别介绍一下，option为我们创建命令的相关参数，例如commander会为我们创建一个默认的选项--help，例如我们可以执行block --help,这时控制台会输出我们定义的所有命令以及选项参数的帮助信息，如下：
```
$ block --help 
Options:
  -V, --version                  output the version number
  -conf, --config <config-name>  output the info of target config
  -h, --help                     output usage information

Commands:
  init                           project init
  create <paths...>              create module‘s or page’s path

```
如果我们想自定义帮助信息的输出，我们可以这样做(当调用--help时会触发--help事件执行这个回调)：
```javascript
program.on('--help', () => {
  console.log(`\r\nRun ${chalk.greenBright('block <command> --help')} for detailed usage of given command.`);
});
```
下面来看第一行第一行我们调用command('init')，我们就创建了一个init命令（block init）.description为该命令创建一个描述，这样会在帮助信息里面显示出来，action里是我们要为这个命令执行的事情，这里我们执行了一个init方法，该方法内容是创建几个固定的目录这里就不展开了。
我们的第3个命令block build，是命令结合参数的用法，可以看到我们调用了.option方法设定了两个参数，-m和-p全称module和page，我这里的逻辑是构建特定的模块和页面。这段写法在执行的时候这样：
block -m a -p b
action中的options参数中包含这两个option的值，program.parse(process.argv)方法放到命令的最后，这个方法会终结命令的执行。
### 配置构建流程
这里我们可以把我们预先定义好的webpack配置文件放到我们webpack文件中，这里就不举例子了，大家使用自己的配置文件即可。
### 执行构建流程
既然是我们自己定义的cli工具，在使用的时候我们就不再使用webpack的cli调用方式了，比如我们正常执行构建的时候会使用命令webpack --config，在我们自己的构建工具中我们应该更优雅的采用webpack的node-api方式执行构建，例子：
```javascript
import webpack from 'webpack';
import configuration from '../../webpack/webpack.config';

module.exports = () => {
  webpack(configuration, (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }
    console.log(stats.toString({
      colors: true,
      env: true,
    }));
    const info = stats.toJson();
    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }
  });
};
```
这里的configuration就是我们预先准备的webpack配置文件，我们调用webpack()方法将配置传入，回调里包含err和stats两个参数负责输出错误信息和我们平时看到的构建流程的信息。
我们有时候也可能会用到webpack-dev-server，它也是提供node-api方式调用的，下面是例子：
```javascript

import webpack from 'webpack';
import path from 'path';
import webpackDevServer from 'webpack-dev-server';
import merge from 'webpack-merge';
import chalk from 'chalk';
import getCommonConfig from '../utils/getCommonConfig';

module.exports = (modules = '*', pages = '*') => {
  const rootPath = process.cwd();
  const configuration = merge(getCommonConfig('development', modules, pages), {
    mode: 'development',
    devtool: 'source-map',
    plugins: [
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
    ]
  });
  const options = {
    contentBase: path.join(rootPath, 'static'),
    overlay: true,
    open: false,
    hot: true,
    compress: true,
    port: 8081,
    stats: {
      colors: true,
    },
    host: 'localhost',
    publicPath: '/'
  };
  webpackDevServer.addDevServerEntrypoints(configuration, options);
  const compiler = webpack(configuration);
  const server = new webpackDevServer(compiler, options);
  server.listen(8081, 'localhost', () => {
    console.log(chalk.greenBright('block dev-server listening on port 8081'));
  });
};
```
这边为了支持hotreload我们需要调用 webpackDevServer.addDevServerEntrypoints，另外使用api的时候以往我们写在配置文件中的devserve的配置我们以这个方法的options传入，不需要再在配置文件中定义了。
我们把执行的方法导出，在命令行定义处使用，就完成了我们自定义的cli工具的调用。
## 最后
以上我们就完成了一个简单的cli工具的基本流程，大家可以根据自己的需要去丰富流程。