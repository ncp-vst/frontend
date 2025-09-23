const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api-server', createProxyMiddleware({
      target: 'http://49.50.130.15:8080', //타겟이 되는 api url
      changeOrigin: true, // 서버 구성에 따른 호스트 헤더 변경 여부 설정
    })
  );

  app.use('/clova', createProxyMiddleware({
      target: 'http://49.50.130.15:8000',
      changeOrigin: true,
    })
  );
};
