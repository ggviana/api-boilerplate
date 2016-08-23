const mssql = require('mssql')
const {
  conditions, ordenation, pickFirst, throwIfNotFound, merge, getQueryOptions, groupBy
} = require('../util/query-utils')

const find = module.exports.find = (options) => {
  options = getQueryOptions(options)

  const { pageSize, pageNumber, where, order } = options

  return new mssql.Request()
    .query(`
      SELECT 
        actions.*
      FROM (
        SELECT
          module.id AS module_id,
          module.name AS name_module, 
          action.id AS action_id,
          action.name AS action_name
        FROM core_module module
        LEFT JOIN core_action action ON action.module_id = module.id
      ) AS actions
      ${conditions(where)}
      ${ordenation(order)}
      OFFSET ${skip(pageSize, pageNumber)} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY OPTION (RECOMPILE);
    `)
    .then(actions => groupBy(actions, 'module_id'))
}

module.exports.findActiveActions = () => {
  return find({
    where: {
      'module.status' = 1,
      'action.status' = 1
    },
    order: [
      'module_id',
      'action_id'
    ]
  })
}
