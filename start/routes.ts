/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const userController = () => import("#controllers/user_controller")

router
  .group(() => {
    // Rota Padrão
    router.get('/', () => { return "Morfeus Backend" }),

    // Rota Usuários
    router
      .group(() => {
        router.post('/', [userController, 'create']),
        router.put('/', [userController, 'update']),
        router.get('/list', [userController, 'list']),
        router.get('/:id', [userController, 'get'])
      })
      .prefix('/users'),

    // Rota Sonos
    router
      .group(() => {
        router.post('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.put('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/:id', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/list', ({ response }) => { response.status(501).json("Rota não desenvolvida.") })
      })
      .prefix('/sleeps'),

    // Rota Sonhos
    router
      .group(() => {
        router.post('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.put('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/:id', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/list', ({ response }) => { response.status(501).json("Rota não desenvolvida.") })
      })
      .prefix('/dreams')
  })
  .prefix('/api')