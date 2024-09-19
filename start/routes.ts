/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from './kernel.js'
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
        router.put('/', [userController, 'update']).use(middleware.auth({ guards: ['api'] })),
        router.get('/list', [userController, 'list']).use(middleware.auth({ guards: ['api'] })),
        router.get('/:id', [userController, 'get']).use(middleware.auth({ guards: ['api'] })),
        router.delete('/:id', [userController, 'delete']).use(middleware.auth({ guards: ['api'] })),
        router.post('/login', [userController, 'login'])
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
      .prefix('/sleeps')
      .use(middleware.auth({
        guards: ['api']
      })),

    // Rota Sonhos
    router
      .group(() => {
        router.post('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.put('/', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/:id', ({ response }) => { response.status(501).json("Rota não desenvolvida.") }),
        router.get('/list', ({ response }) => { response.status(501).json("Rota não desenvolvida.") })
      })
      .prefix('/dreams')
      .use(middleware.auth({
        guards: ['api']
      }))
  })
  .prefix('/api')