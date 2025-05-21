module.exports = {
    chainWebpack: config => {
      config.module
        .rule('csv')
        .test(/\.csv$/)
        .use('csv-loader')
        .loader('csv-loader')
        .options({
          dynamicTyping: true,
          header: true,
          skipEmptyLines: true,
          comments: '//'  // 加入忽略註解的選項
        });
    }
  };