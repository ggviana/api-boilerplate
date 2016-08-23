const mssql                 = require('mssql')
const skip                  = require('../util/pagination').skip
const removeNonNumericChars = require('../util/removeNonNumericChars')
const {
  conditions, ordenation, pickFirst, throwIfNotFound, merge, getQueryOptions
} = require('../util/query-utils')

const find = module.exports.find = (options) => {
  options = getQueryOptions(options)

  const { pageSize, pageNumber, where, order } = options

  return new mssql.Request()
    .query(`
      SELECT
        loja.*
      FROM (
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
      ${conditions(where)}
      ${ordenation(order, 'id_pdr')}
      OFFSET ${skip(pageSize, pageNumber)} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY OPTION (RECOMPILE);
    `)
}

const findById = module.exports.findById = (id, options) => {
  options = getQueryOptions(options)

  var { pageSize, pageNumber, where } = options

  where['id_pdr'] = id
  pageSize = 1
  pageNumber = 1
  
  return find(options)
    .then(pickFirst)
    .then(throwIfNotFound)
}

module.exports.create = (data) => {
  data = beforeSave(data)

  const transaction = new mssql.Transaction()

  return transaction
    .begin()
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
    .then(pickFirst)
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
      .then(() => transaction.commit())
      .then(() => findById(store.id))
    )
    .catch(error => {
      transaction.rollback()
      reject(error)
    })
}

module.exports.update = (store, data) => {
  data = beforeSave(merge(store, data))

  const transaction = new mssql.Transaction()

  return transaction
    .begin()
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
    .then(() => transaction.commit())
    .then(() => findById(data.id_pdr))
    .catch(error => {
      transaction.rollback()
      return error
    })
}

const beforeSave = data => {
  data.numero_documento = removeNonNumericChars(data.numero_documento)
  data.cep = removeNonNumericChars(data.cep)

  return data
}