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

const analysisController = () => import("#controllers/analysis_controller")
const dreamController = () => import("#controllers/dream_controller")
const sleepController = () => import("#controllers/sleep_controller")
const tagController = () => import("#controllers/tag_controller")
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
        router.post('/data_deletion', [userController, 'dataDeletion']).use(middleware.auth({ guards: ['api'] })),
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
          .group(() => { router.post('/list', [dreamController, 'listByUser']) })
          .prefix('/dreams')
          .use(middleware.auth({ guards: ['api'] }))

        // Recuperação de conta
        router
          .group(() => {
            router.post('/finish', [userController, 'finishAccountRecovery'])
            router.post('/:email', [userController, 'createAccountRecovery'])
            router.get('/:code', [userController, 'checkAccountRecovery'])
          })
          .prefix('/account_recovery')

        // Dados do usuário
        router
          .group(() => {
            router.post('/export', [userController, 'exportUserData'])
            router.post('/import', [userController, 'importUserData'])
            router.post('/sync_records', [userController, 'syncRecords'])
          })
          .prefix('/data')
          .use(middleware.auth({ guards: ['api'] }))
      })
      .prefix('/users'),

    // Rota Sonos
    router
      .group(() => {
        router.post('/', [sleepController, 'create']),
        router.put('/', [sleepController, 'update']),
        router.get('/list', [sleepController, 'list']),
        router.post('/simple_sleep', [sleepController, 'createSimpleSleep']),
        router.get('/simple_sleep', [sleepController, 'getSimpleSleep'])
        router.get('/list_sleeps_for_dream_creation', [sleepController, 'listSleepsForDreamCreation'])
        router.get('/:id', [sleepController, 'get'])
        router.delete('/:id', [sleepController, 'delete'])
      })
      .prefix('/sleeps')
      .use(middleware.auth({ guards: ['api'] })),

    // Rota Sonhos
    router
      .group(() => {
        router.post('/', [dreamController, 'create']),
        // Rota de sonhos rápidos e importados removida
        // necessita dividir entre sonho rápido e importado
        // router.post('/uncomplete', [dreamController, 'createUncomplete']),
        router.put('/', [dreamController, 'update']),
        router.get('/list', [dreamController, 'list']),
        router.get('/listBySleep', [dreamController, 'listBySleep']),
        router.get('/:id', [dreamController, 'get'])
        router.delete('/:id', [dreamController, 'delete'])
      })
      .prefix('/dreams')
      .use(middleware.auth({
        guards: ['api']
      }))

    router
      .group(() => {
        router.get('/list', [tagController, 'list']),
        router.get('/list_by_dream', [tagController, 'listByDream'])
        router.get('/list_dreams_by_tag', [tagController, 'listDreamsByTag'])
      })
      .prefix('/tags')
      .use(middleware.auth({
        guards: ['api']
      }))

    router
      .group(() => {
        router.post('/dreams', [analysisController, 'createDreamAnalysis'])
        router.get('/dreams/get', [analysisController, 'getDreamAnalysis'])
        router.post('/sleeps', [analysisController, 'createSleepAnalysis'])
        router.get('/sleeps/get', [analysisController, 'getSleepAnalysis'])
      })
      .prefix('/analysis')
      .use(middleware.auth({
        guards: ['api']
      }))
  })
  .prefix('/api')