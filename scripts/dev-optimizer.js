#!/usr/bin/env node

/**
 * 开发优化工具
 * 提供热重载优化、构建优化和开发体验改进
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configFiles = {
      webpack: path.join(this.projectRoot, 'vue.config.js'),
      babel: path.join(this.projectRoot, 'babel.config.js'),
      eslint: path.join(this.projectRoot, '.eslintrc.js'),
      package: path.join(this.projectRoot, 'package.json')
    };
  }

  // 优化Vue配置
  optimizeVueConfig() {
    console.log('⚡ 优化Vue配置...');
    
    const optimizedConfig = `const path = require('path');

module.exports = {
  // 开发服务器配置
  devServer: {
    hot: true,
    overlay: {
      warnings: false,
      errors: true
    },
    // 启用gzip压缩
    compress: true,
    // 优化热重载性能
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: false
    }
  },
  
  // 构建优化
  configureWebpack: {
    // 开发环境优化
    ...(process.env.NODE_ENV === 'development' && {
      optimization: {
        splitChunks: false,
        minimize: false
      },
      resolve: {
        alias: {
          '@components': path.resolve(__dirname, 'src/components'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@assets': path.resolve(__dirname, 'src/assets')
        }
      }
    }),
    
    // 生产环境优化
    ...(process.env.NODE_ENV === 'production' && {
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              name: 'chunk-vendors',
              test: /[\\\\/]node_modules[\\\\/]/,
              priority: 10,
              chunks: 'initial'
            },
            common: {
              name: 'chunk-common',
              minChunks: 2,
              priority: 5,
              chunks: 'initial'
            },
            gameComponents: {
              name: 'chunk-games',
              test: /[\\\\/]src[\\\\/]components[\\\\/].*\\.vue$/,
              priority: 8,
              chunks: 'initial'
            }
          }
        }
      }
    })
  },
  
  // CSS优化
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV !== 'production',
    loaderOptions: {
      css: {
        // 启用CSS模块
        modules: {
          auto: true
        }
      }
    }
  },
  
  // 性能提示
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxAssetSize: 250000,
    maxEntrypointSize: 250000
  },
  
  // 源码映射
  productionSourceMap: false,
  
  // 并行构建
  parallel: require('os').cpus().length > 1,
  
  // 链式配置
  chainWebpack: config => {
    // 优化图片加载
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => ({
        ...options,
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:8].[ext]'
          }
        }
      }));
    
    // 预加载重要资源
    config.plugin('preload').tap(options => {
      options[0].include = 'initial';
      return options;
    });
    
    // 预取非关键资源
    config.plugin('prefetch').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || [];
      options[0].fileBlacklist.push(/\\.map$/, /hot-update\\.js$/);
      return options;
    });
  }
};`;
    
    fs.writeFileSync(this.configFiles.webpack, optimizedConfig);
    console.log('✅ Vue配置已优化');
  }

  // 优化Babel配置
  optimizeBabelConfig() {
    console.log('🔧 优化Babel配置...');
    
    const optimizedConfig = `module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      // 启用现代模式
      useBuiltIns: 'entry',
      corejs: 3,
      // 优化polyfill
      targets: {
        browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
      }
    }]
  ],
  plugins: [
    // 开发环境插件
    ...(process.env.NODE_ENV === 'development' ? [
      // 快速刷新
      ['@vue/babel-plugin-jsx', { mergeProps: false }]
    ] : []),
    
    // 生产环境插件
    ...(process.env.NODE_ENV === 'production' ? [
      // 移除console
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
      // 移除debugger
      'transform-remove-debugger'
    ] : [])
  ],
  
  // 缓存配置
  cacheDirectory: true,
  cacheCompression: false
};`;
    
    fs.writeFileSync(this.configFiles.babel, optimizedConfig);
    console.log('✅ Babel配置已优化');
  }

  // 优化ESLint配置
  optimizeESLintConfig() {
    console.log('📝 优化ESLint配置...');
    
    const optimizedConfig = `module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/prettier'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // 开发环境宽松规则
    ...(process.env.NODE_ENV === 'development' && {
      'no-console': 'off',
      'no-debugger': 'off',
      'vue/no-unused-vars': 'warn'
    }),
    
    // 生产环境严格规则
    ...(process.env.NODE_ENV === 'production' && {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'vue/no-unused-vars': 'error'
    }),
    
    // 通用规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error'
  },
  
  // 性能优化
  cache: true,
  cacheLocation: './node_modules/.cache/eslint/'
};`;
    
    fs.writeFileSync(this.configFiles.eslint, optimizedConfig);
    console.log('✅ ESLint配置已优化');
  }

  // 添加开发脚本
  addDevScripts() {
    console.log('📦 添加开发脚本...');
    
    const packageJson = JSON.parse(fs.readFileSync(this.configFiles.package, 'utf8'));
    
    // 添加新的脚本
    const newScripts = {
      'dev': 'npm run serve',
      'dev:analyze': 'vue-cli-service build --analyze',
      'dev:modern': 'vue-cli-service build --modern',
      'clean': 'rimraf dist node_modules/.cache',
      'deps:analyze': 'node scripts/dependency-analyzer.js analyze',
      'deps:visualize': 'node scripts/dependency-analyzer.js visualize',
      'optimize': 'node scripts/dev-optimizer.js optimize',
      'check': 'npm run lint && npm run test:refactored'
    };
    
    packageJson.scripts = { ...packageJson.scripts, ...newScripts };
    
    // 添加开发依赖
    const newDevDeps = {
      'rimraf': '^3.0.2',
      'webpack-bundle-analyzer': '^4.5.0'
    };
    
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDeps };
    
    fs.writeFileSync(this.configFiles.package, JSON.stringify(packageJson, null, 2));
    console.log('✅ 开发脚本已添加');
  }

  // 创建开发环境配置文件
  createDevEnvFiles() {
    console.log('🌍 创建环境配置文件...');
    
    // .env.development
    const devEnv = `# 开发环境配置
NODE_ENV=development
VUE_APP_TITLE=Tsubaki游戏开发环境
VUE_APP_DEBUG=true
VUE_APP_API_BASE_URL=http://localhost:3000

# 开发工具
VUE_APP_ENABLE_DEVTOOLS=true
VUE_APP_PERFORMANCE_MONITOR=true`;
    
    fs.writeFileSync(path.join(this.projectRoot, '.env.development'), devEnv);
    
    // .env.production
    const prodEnv = `# 生产环境配置
NODE_ENV=production
VUE_APP_TITLE=Tsubaki游戏
VUE_APP_DEBUG=false
VUE_APP_API_BASE_URL=https://api.tsubaki.com

# 性能优化
VUE_APP_ENABLE_DEVTOOLS=false
VUE_APP_PERFORMANCE_MONITOR=false`;
    
    fs.writeFileSync(path.join(this.projectRoot, '.env.production'), prodEnv);
    
    console.log('✅ 环境配置文件已创建');
  }

  // 创建开发工具配置
  createDevToolsConfig() {
    console.log('🛠️ 创建开发工具配置...');
    
    // VS Code配置
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }
    
    // VS Code设置
    const vscodeSettings = {
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "vetur.format.defaultFormatter.html": "prettier",
      "vetur.format.defaultFormatter.js": "prettier",
      "vetur.validation.template": false,
      "emmet.includeLanguages": {
        "vue-html": "html"
      },
      "files.associations": {
        "*.vue": "vue"
      }
    };
    
    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(vscodeSettings, null, 2)
    );
    
    // VS Code扩展推荐
    const extensions = {
      "recommendations": [
        "octref.vetur",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next"
      ]
    };
    
    fs.writeFileSync(
      path.join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensions, null, 2)
    );
    
    console.log('✅ 开发工具配置已创建');
  }

  // 性能监控设置
  setupPerformanceMonitoring() {
    console.log('📊 设置性能监控...');
    
    const monitoringCode = `// 性能监控工具
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    
    if (process.env.VUE_APP_PERFORMANCE_MONITOR === 'true') {
      this.init();
    }
  }
  
  init() {
    // 监控组件渲染性能
    this.observeComponentPerformance();
    
    // 监控路由切换性能
    this.observeRoutePerformance();
    
    // 监控资源加载性能
    this.observeResourcePerformance();
  }
  
  observeComponentPerformance() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('component')) {
          this.recordMetric('component-render', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    this.observers.push(observer);
  }
  
  observeRoutePerformance() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.recordMetric('route-navigation', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }
  
  observeResourcePerformance() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.recordMetric('resource-load', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }
  
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });
    
    // 保持最近100条记录
    const records = this.metrics.get(name);
    if (records.length > 100) {
      records.shift();
    }
  }
  
  getMetrics() {
    const result = {};
    
    this.metrics.forEach((records, name) => {
      const values = records.map(r => r.value);
      result[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };
    });
    
    return result;
  }
  
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// 全局实例
export const performanceMonitor = new PerformanceMonitor();`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'src/utils/performanceMonitor.js'),
      monitoringCode
    );
    
    console.log('✅ 性能监控已设置');
  }

  // 执行完整优化
  optimizeAll() {
    console.log('🚀 开始完整优化...\n');
    
    try {
      this.optimizeVueConfig();
      this.optimizeBabelConfig();
      this.optimizeESLintConfig();
      this.addDevScripts();
      this.createDevEnvFiles();
      this.createDevToolsConfig();
      this.setupPerformanceMonitoring();
      
      console.log('\n✅ 优化完成！');
      console.log('\n📋 新增功能:');
      console.log('  • 热重载优化');
      console.log('  • 构建性能提升');
      console.log('  • 代码分割优化');
      console.log('  • 开发工具配置');
      console.log('  • 性能监控');
      console.log('  • 环境配置');
      
      console.log('\n🎯 新增命令:');
      console.log('  npm run dev:analyze  # 构建分析');
      console.log('  npm run deps:visualize  # 依赖可视化');
      console.log('  npm run optimize  # 执行优化');
      console.log('  npm run check  # 代码检查');
      
    } catch (error) {
      console.error('❌ 优化失败:', error.message);
    }
  }

  // 分析当前配置
  analyzeCurrentConfig() {
    console.log('🔍 分析当前配置...\n');
    
    const analysis = {
      webpack: fs.existsSync(this.configFiles.webpack),
      babel: fs.existsSync(this.configFiles.babel),
      eslint: fs.existsSync(this.configFiles.eslint),
      envFiles: {
        dev: fs.existsSync(path.join(this.projectRoot, '.env.development')),
        prod: fs.existsSync(path.join(this.projectRoot, '.env.production'))
      },
      vscode: fs.existsSync(path.join(this.projectRoot, '.vscode')),
      performance: fs.existsSync(path.join(this.projectRoot, 'src/utils/performanceMonitor.js'))
    };
    
    console.log('📊 配置状态:');
    Object.entries(analysis).forEach(([key, value]) => {
      if (typeof value === 'object') {
        console.log(`  ${key}:`);
        Object.entries(value).forEach(([subKey, subValue]) => {
          console.log(`    ${subKey}: ${subValue ? '✅' : '❌'}`);
        });
      } else {
        console.log(`  ${key}: ${value ? '✅' : '❌'}`);
      }
    });
    
    return analysis;
  }
}

// 命令行接口
if (require.main === module) {
  const optimizer = new DevOptimizer();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'optimize':
      optimizer.optimizeAll();
      break;
      
    case 'analyze':
      optimizer.analyzeCurrentConfig();
      break;
      
    case 'vue':
      optimizer.optimizeVueConfig();
      break;
      
    case 'babel':
      optimizer.optimizeBabelConfig();
      break;
      
    case 'eslint':
      optimizer.optimizeESLintConfig();
      break;
      
    default:
      console.log(\`
🚀 开发优化工具

用法:
  node dev-optimizer.js optimize  # 执行完整优化
  node dev-optimizer.js analyze   # 分析当前配置
  node dev-optimizer.js vue       # 优化Vue配置
  node dev-optimizer.js babel     # 优化Babel配置
  node dev-optimizer.js eslint    # 优化ESLint配置
      \`);
  }
}

module.exports = DevOptimizer;
