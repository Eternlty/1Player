//输出路径
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/lcx/music/' : '/lcx/music/',
  assetsDir: 'static',
  indexPath: 'index.html',
  outputDir: 'dist',
  filenameHashing: true,
  productionSourceMap: false,
  devServer: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/lcx\/music\/img\/.*/, to: '/static/img/[name].[ext]' }
      ]
    }
  },
  chainWebpack: config => {
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'static/img/[name].[hash:8].[ext]'
          }
        }
      })
  }
}
