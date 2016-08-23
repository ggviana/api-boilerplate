# Diretivas para criação da API
## Estrutura

A estrutura da aplicação deve seguir o seguinte esquema:
```
/
--/controllers
--/jobs
--/services
--/util
app.js
db.js
config.js
schedule.js
server.js
```
### Definições

* ### /controllers
  Endpoints da API e suas respectivas operações
* ### /jobs
  Tarefas automatizadas que podem ser ativadas com o `schedule.js`, por linha de comando ou manualmente
* ### /services
  Services de acesso ao(s) banco(s) de dados
* ### /util
  Funções e classes utilitárias para incentivar o reúso e deixar o código limpo
* ### app.js
  Ponto de entrada da aplicação. Aqui criamos a conexão do banco de dados, criamos as instâncias de servidor, e ativamos as tarefas agendadas.
* ### db.js
  Detalhes da conexão com o banco de dados.
* ### config.js
  Armazena as configurações dos diferentes ambientes. Usa a variável de sistema `NODE_ENV` para descobrir em qual o ambiente está
* ### schedule.js
  Define os horários de disparo das tarefas na pasta `/jobs`
* ### server.js
  Detalhes da criação de uma nova instância do servidor da API

## Anatomia dos componentes
A seguir estão os exemplos de código de como montar os componentes

### controller
```javascript
// Criaremos os endpoints para um CRUD de uma entidade chamada `store`

// É interessante deixar os imports na parte de cima do arquivo, assim
// saberemos sempre onde procurar.

// Primeiramente criamos um router importando o express e chamando a função Router
const router = require('express').Router()
// Aqui carregamos a service que vamos usar
const Store = require('../services/store')
// Essa função ajuda a converter detalhes do request como paginação e filtros para opções da query da service
const getOptionsFromRequest = require('../util/query-utils').getOptionsFromRequest

// Nesse momento já podemos exportar o router que vai ser automaticamente montado no servidor
module.exports = router

// Listar uma loja por id
router.get('/stores/:id', (req, res) => {
  Store.findById(req.params.id)
    .then(store => res.send(store))
    .catch(error => res.status(404).send())
})

// Listar lojas
// Aqui podemos passar filtros por query parameters
// Ex: ?id_bandeira=4&nome_loja=SHOPPING RORAIMA
router.get('/stores', (req, res) => {
  const options = getOptionsFromRequest(req)
  Store.find(options)
    .then(stores => res.send(stores))
    .catch(error => res.status(500).send(error))
})

// Criação de loja
// Os dados podem tanto serem enviados por formulário (usando header application/x-www-form-urlencoded)
// quanto por json (usando header application/json)
router.post('/stores', (req, res) => {
  Store.create(req.body)
    .then(store => res.send(store))
    .catch(error => res.status(500).send(error))
})

// Alteração de uma loja
router.put('/stores/:id', (req, res) => {
  Store.findById(req.params.id)
    .catch(error => res.status(404).send())
    .then(store => Store.update(store, req.body))
    .then(store => res.send(store))
    .catch(error => res.status(500).send(error))
})
```
### job
Esses exemplos usam a documentação do [node-schedule](https://github.com/node-schedule/node-schedule)

Em `schedules.js`
```javascript
const schedule = require('node-schedule')
const backup   = require('./jobs/backup')

module.exports.start = () => new Promise((resolve) => {
  // Returns to execution
  resolve()

  // Agendando uma tarefa recorrente
  const weekly = new schedule.RecurrenceRule()
  weekly.dayOfWeek = 0 // Sunday
  weekly.hour = 0      // 24h00

  schedule.scheduleJob(weekly, () => {
    backup()
  })

  // Agendando uma tarefa única
  const oneTime = new Date(2016, 6, 15, 0, 0, 0) // 2016-07-15 24h00

  schedule.scheduleJob(oneTime, () => {
    backup()
  })

  console.log('Running scheduled jobs.')
})
```

Em `job/backup.js`
```javascript
module.exports = () => {
  console.log("Executando backup")
  // Etapas do backup
}
```
### service
```javascript
// Driver do SQL Server
const mssql                 = require('mssql')
// Função skip usada para calcular OFFSET nas paginações das consultas
const skip                  = require('../util/pagination').skip
// Função para tratar dados
const removeNonNumericChars = require('../util/removeNonNumericChars')
// Gerador da cláusula WHERE
const conditions            = require('../util/query-utils').conditions
// Gerador da cláusula ORDER
const ordenation            = require('../util/query-utils').ordenation
// Função para pegar o primeiro row de um recordset
const pickFirst             = require('../util/query-utils').pickFirst
// Gerador de erros 404
const throwIfNotFound       = require('../util/query-utils').throwIfNotFound
// Função para atualizar uma row
const merge                 = require('../util/query-utils').merge
const getQueryOptions       = require('../util/query-utils').getQueryOptions

// Essa função faz a seleção de modo geral
const find = module.exports.find = (options) => {
  // Aqui estamos unindo as opções padrões com as que foram enviadas
  // na chamada da função
  options = getQueryOptions(options)

  const { pageSize, pageNumber, where, order } = options

  return new mssql.Request()
    .query(`
      SELECT
        loja.*
      FROM (
        ${/* 
        Esse encapsulamento em subquery é necessário para facilitar 
        a lógica de filtros que virá abaixo */}
        SELECT
          l.id_pdr,
          l.tipo_documento,
          l.numero_documento,
          l.razao_social,
          l.nome_loja,
          e.id_endereco,
          e.endereco,
          e.numero,
          e.complemento,
          e.cep,
          e.bairro,
          te.id_tipo_endereco,
          te.tipo_endereco,
          c.id_cidade,
          c.cidade,
          u.id_uf,
          u.uf,
          r.id_rede,
          r.rede,
          b.id_bandeira,
          b.bandeira,
          CASE
            WHEN e.latitude IS NULL THEN '0'
            ELSE e.latitude
          END AS latitude,
          CASE
            WHEN e.longitude IS NULL THEN '0'
            ELSE e.longitude
          END AS longitude
        FROM tbl_pos_loja as l
        INNER JOIN tbl_pos_loja_endereco AS e ON e.id_pdr = l.id_pdr
        INNER JOIN tbl_pos_bandeira AS b ON b.id_bandeira = l.id_bandeira
        INNER JOIN tbl_pos_rede AS r ON r.id_rede = b.id_rede
        INNER JOIN tbl_geo_tipo_endereco AS te ON te.id_tipo_endereco = e.id_tipo_endereco
        INNER JOIN tbl_geo_cidade AS c ON c.id_cidade = e.id_cidade
        INNER JOIN tbl_geo_uf AS u ON u.id_uf = c.id_uf
      ) AS loja
      ${/*
      Aqui serão serializados os filtros usando uma comparação 
      de igualdade (' = '). Caso esse não seja o comportamento desejado,         você pode usar o 'delete where.nome_da_propriedade' para remove-la
      da serialização */}
      ${conditions(where)}
      ${/*
      Aqui serão serializados a ordenação. O primeiro argumento é um 
      array de colunas e o segundo é um padrão caso nenhuma seja 
      selecionanda */}
      ${ordenation(order, 'id_pdr')}
      ${/*
      A função 'skip' determina, dado um tamanho de página e um número de
      página, quantos itens deve pular */}
      OFFSET ${skip(pageSize, pageNumber)} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY OPTION (RECOMPILE);
    `)
}

// Recupera uma entidade a partir de um id da chave primária
const findById = module.exports.findById = (id, options) => {
  // Aqui estamos unindo as opções padrões com as que foram enviadas
  // na chamada da função
  options = getQueryOptions(options)

  var { pageSize, pageNumber, where } = options
  // Altera o WHERE para selectionar uma chave primária
  where['id_pdr'] = id
  // Define que só vai pegar uma linha
  pageSize = 1
  pageNumber = 1
  
  // Usa a função 'find' definida anteriormente
  return find(options)
    // Pega a primeira linha da consulta
    .then(pickFirst)
    // Dá um erro se não achou nenhum
    .then(throwIfNotFound)
}

// Cria uma nova linha no banco de dados
// a partir de um objeto com dados
module.exports.create = (data) => {
  // Antes de salvar trata os dados
  data = beforeSave(data)

  // Cria uma transação
  const transaction = new mssql.Transaction()

  return transaction
    .begin()
    // Executa a primeira inserção
    .then(() => new mssql.Request(transaction)
      .query(`
        INSERT INTO tbl_pos_loja VALUES (
          '${data.tipo_documento}',
          '${data.numero_documento}',
          '${data.razao_social}',
          '${data.nome_loja}',
          ${data.id_bandeira}
        );
        SELECT SCOPE_IDENTITY() AS id;
      `)
    )
    // Pega o id da linha inserida
    .then(pickFirst)
    // Executa a segunda inserção baseada da primeira
    .then(store => new mssql.Request(transaction)
      .query(`
        INSERT INTO tbl_pos_loja_endereco VALUES (
          ${store.id},
          '${data.id_tipo_endereco}',
          '${data.endereco}',
          '${data.numero}',
          '${data.complemento}',
          '${data.cep}',
          '${data.bairro}',
          '${data.id_cidade}',
          '${data.latitude}',
          '${data.longitude}'
        );
      `)
      // Se tudo deu certo, dá 'COMMIT' na transação
      .then(() => transaction.commit())
      // Retorna o objeto salvo
      .then(() => findById(store.id))
    )
    // Se houve algum erro, dá 'ROLLBACK' na transação
    // e retorna o erro
    .catch(error => {
      transaction.rollback()
      reject(error)
    })
}

// Atualiza uma linha a partir de um objeto com dados
module.exports.update = (store, data) => {
  // Antes de salvar trata os dados
  data = beforeSave(merge(store, data))

  // Cria uma transação
  const transaction = new mssql.Transaction()

  return transaction
    .begin()
    // Executa a primeira atualiza
    .then(() => new mssql.Request(transaction)
      .query(`
        UPDATE tbl_pos_loja SET 
          tipo_documento = '${data.tipo_documento}',
          numero_documento = '${data.numero_documento}',
          nome_loja = '${data.nome_loja}',
          razao_social = '${data.razao_social}',
          id_bandeira = ${data.id_bandeira}
        WHERE id_pdr = ${data.id_pdr}
      `)
    )
    // Executa a segunda atualiza baseada da primeira
    .then(() => new mssql.Request(transaction)
      .query(`
        UPDATE tbl_pos_loja_endereco SET 
          id_tipo_endereco = '${data.id_tipo_endereco}',
          endereco = '${data.endereco}',
          numero = '${data.numero}',
          complemento = '${data.complemento}',
          cep = '${data.cep}',
          bairro = '${data.bairro}',
          id_cidade = '${data.id_cidade}',
          latitude = '${data.latitude}',
          longitude = '${data.longitude}'
        WHERE id_pdr = ${data.id_pdr}
      `)
    )
    // Se tudo deu certo, dá 'COMMIT' na transação
    .then(() => transaction.commit())
    // Retorna o objeto salvo
    .then(() => findById(data.id_pdr))
    // Se houve algum erro, dá 'ROLLBACK' na transação
    // e retorna o erro
    .catch(error => {
      transaction.rollback()
      return error
    })
}

// Faz o tratamento de dados antes de salvar
const beforeSave = data => {
  data.numero_documento = removeNonNumericChars(data.numero_documento)
  data.cep = removeNonNumericChars(data.cep)

  return data
}
```
### util
O propósito dessa pasta é guardar as funções que podem ser usadas em várias partes diferentes. Por isso tente manter os arquivos bem curtos e com funções relacionadas umas as outras. Além disso mantenha as funções curtas, isso é um bom indicativo que ela pode ser usada em diferentes partes do código

## Links úteis
* [Documentação Express](http://expressjs.com/en/4x/api.html)
* [Documentação Schedules](https://github.com/node-schedule/node-schedule)
* [Documentação Driver Microsoft SQL Server](https://github.com/patriksimek/node-mssql)