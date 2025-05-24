const routes = (handler) => ([
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
    options: {
      auth: false, // tanpa autentikasi, publik
    },
  },
]);

module.exports = routes;
