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

const dreamController = () => import("#controllers/dream_controller")
const sleepController = () => import("#controllers/sleep_controller")
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
        router.post('/login', [userController, 'login']),

        // Sonos do usuário
        router
          .group(() => { router.get('/list', [sleepController, 'listByUser']) })
          .prefix('/sleeps')
          .use(middleware.auth({ guards: ['api'] }))

        // Sonhos do usuário
        router
          .group(() => { router.get('/list', [dreamController, 'listByUser']) })
          .prefix('/dreams')
          .use(middleware.auth({ guards: ['api'] }))
      })
      .prefix('/users'),

    // Rota Sonos
    router
      .group(() => {
        router.post('/', [sleepController, 'create']),
        router.put('/', [sleepController, 'update']),
        router.get('/list', [sleepController, 'list']),
        router.get('/:id', [sleepController, 'get'])
        router.delete('/:id', [sleepController, 'delete'])
      })
      .prefix('/sleeps')
      .use(middleware.auth({ guards: ['api'] })),

    // Rota Sonhos
    router
      .group(() => {
        router.post('/', [dreamController, 'create']),
        router.post('/uncomplete', [dreamController, 'createUncomplete']),
        router.put('/', [dreamController, 'update']),
        router.get('/list', [dreamController, 'list']),
        router.get('/:id', [dreamController, 'get'])
        router.delete('/:id', [dreamController, 'delete'])
      })
      .prefix('/dreams')
      .use(middleware.auth({
        guards: ['api']
      }))
  })
  .prefix('/api')