import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Dream from '#models/dream'
import DreamTag from '#models/dream_tag'
import Sleep from '#models/sleep'
import Tag from '#models/tag'
import User from '#models/user'

export default class extends BaseSeeder {
  static environment = ["development"]

  async run() {
    /**
     * O seguinte código popula o banco em caso de development e staging com dados prontos de
     * um usuário com 5 sonos e sonhos com características variáveis, valida-se isso ao verificar
     * a troca dos valores boleanos quando o index (i) é par ou ímpar.
     * 
     * Em caso de erro neste seeder, é importante verificar novos campos no usuário, no sono,
     * no sonho, na tag, no dreamTag e também os limites das chaves estrangeiras no sonho.
     * 
     * Os dados populados aqui servem apenas de análise e testes iniciais, em caso de necessidade,
     * esse trecho de código pode ser comentado.
     */
    // Inicializada data para o 1° dia do mês atual
    const dateNow = DateTime.now().minus({ seconds: ((DateTime.now().day - 1) * 86400) })

    await User.create({
      fullName: 'Administrador',
      email: 'morfeus@email.com',
      password: 'morfeus',
    })

    for (let i = 0; i < 5; i++) {
      // Avanço de um dia por sono
      const newDate = dateNow.plus({ seconds: (86400 * i) })
      await Sleep.create({
        userId: 1,
        date: newDate,
        sleepTime: 6,
        sleepStart: newDate,
        // Data final do sono é 6 horas após a inicial
        sleepEnd: newDate.plus({ seconds: (3600 * 6) }),
        wakeUpHumor: {
          undefinedHumor: (i % 2 === 0) && (i === 0),
          calm: (i % 2 === 0) && (i === 0),
          drowsiness: (i % 2 === 0) && (i === 2),
          tiredness: (i % 2 === 0) && (i === 2),
          anxiety: (i % 2 === 0) && (i === 4),
          happiness: (i % 2 === 0) && (i === 4),
          fear: (i % 2 === 0),
          sadness: (i % 2 === 0),
          other: (i % 2 === 0),
        },
        layDownHumor: {
          undefinedHumor: !(i % 2 === 0) && (i === 1),
          calm: !(i % 2 === 0) && (i === 1),
          drowsiness: !(i % 2 === 0) && (i === 3),
          tiredness: !(i % 2 === 0) && (i === 3),
          anxiety: !(i % 2 === 0),
          happiness: !(i % 2 === 0),
          fear: !(i % 2 === 0),
          sadness: !(i % 2 === 0),
          other: !(i % 2 === 0),
        },
        biologicalOccurences: {
          sudorese: (i % 2 === 0) && (i === 0),
          bruxismo: (i % 2 === 0) && (i === 0),
          apneiaDoSono: (i % 2 === 0) && (i === 2),
          ronco: (i % 2 === 0) && (i === 2),
          movimentosPeriodicosDosMembros: (i % 2 === 0) && (i === 4),
          despertaresParciais: (i % 2 === 0) && (i === 4),
          refluxoGastroesofagico: !(i % 2 === 0) && (i === 1),
          sialorreia: !(i % 2 === 0) && (i === 1),
          arritmias: !(i % 2 === 0) && (i === 3),
          mioclonia: !(i % 2 === 0) && (i === 3),
          parassonia: (i % 2 === 0),
          epistaxe: (i % 2 === 0),
          miccaoInvoluntaria: !(i % 2 === 0),
          evacuacaoInvoluntaria: !(i % 2 === 0),
          polucao: !(i % 2 === 0),
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await Dream.create({
        sleepId: i + 1,
        title: `Sonho ${ i + 1 }`,
        description: `Descrição do sonho ${ i + 1 }`,
        dreamPointOfViewId: (i % 2 === 0) ? 1 : 3,
        climate: {
          ameno: (i % 2 === 0) && (i === 0),
          calor: (i % 2 === 0) && (i === 0),
          garoa: (i % 2 === 0) && (i === 2),
          chuva: (i % 2 === 0) && (i === 2),
          tempestade: (i % 2 === 0) && (i === 4),
          nevoa: (i % 2 === 0) && (i === 4),
          neve: !(i % 2 === 0) && (i === 1),
          multiplos: !(i % 2 === 0) && (i === 1),
          outro: !(i % 2 === 0) && (i === 3),
          indefinido: !(i % 2 === 0) && (i === 3),
        },
        dreamHourId: i + 1,
        dreamDurationId: i + 1 > 4 ? 1 : i + 1,
        dreamLucidityLevelId: i + 1 > 4 ? 1 : i + 1,
        dreamTypeId: (i % 2 === 0) ? 1 : 2,
        dreamRealityLevelId: (i % 2 === 0) ? 1 : 2,
        eroticDream: i > 3,
        hiddenDream: i === 3,
        personalAnalysis: (i % 2 === 0) ? `Esse sonho tem análise` : undefined,
        dreamOriginId: i <= 3 ? 1 : 2,
        isComplete: true,
      })

      if (i === 0) {
        await Tag.createMany([
          { title: "ZERO" },
          { title: "PAR" },
          { title: "IMPAR" },
        ])
        await DreamTag.create({ dreamId: i + 1, tagId: 1 })
      }

      if (i % 2 === 0) await DreamTag.create({ dreamId: i + 1, tagId: 2 })
      if (i % 2 != 0) await DreamTag.create({ dreamId: i + 1, tagId: 3 })
    }
  }
}