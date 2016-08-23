const distinct   = require('./distinct')
const Pagination = require('./pagination')
const inArray    = require('./inArray')

/*
 * Take the first row of a query if it exists or `null` if does not
 * Used to abstract query record sets
 */
const pickFirst = module.exports.pickFirst = recordset => recordset[0] || null

/*
 * If the recordset does not contain any item, throw a `Not found` error
 * Otherwise passes the record set
 */
module.exports.throwIfNotFound = recordset => {

  if (recordset == null)
    throw new Error('Not found.')

  return recordset
}

/*
 * Merge updated data into a row
 */
module.exports.merge = (row, data) => {
  const availableColumns = Object
    .keys(row)
    .filter(column => data[column] != null)
  
  availableColumns.forEach(column => row[column] = data[column])

  return row
}

/*
 * Groups a query into a object separated by a column identifier
 */
module.exports.groupBy = (arr, id) => {
  const distinctIds = distinct(arr.map(item => item[id]))

  return distinctIds.reduce((groups, groupId) => {
    groups[groupId] = arr.filter(item => item[id] === groupId)
    return groups
  }, {})
}

/*
 * Generate `WHERE` clause conditions
 */
module.exports.conditions = where => {
  const conditions = Object
    .keys(where)
    .map(condition => {
      if (isNaN(where[condition]))
        return `${condition} = '${where[condition]}'`
      else
        return `${condition} = ${where[condition]}`
    })

  return conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''
}

/*
 * Generate `ORDER BY` clause
 */
module.exports.ordenation = (order = [], defaultKey = '1') => {
  const dirs = ['ASC', 'DESC']

  const getDir = (dir) => inArray(dirs, dir.toUpperCase()) ? dir : ''

  const columns = order
    .map(column => {
      if (Array.isArray(column))
        return `${column[0]} ${getDir(column[1])}`
      return `${column}`
    })

  return columns.length > 0
    ? `ORDER BY ${columns.join(', ')}`
    : `ORDER BY ${defaultKey}`
}

/*
 * Generate the defaults options for queries
 */
module.exports.getQueryOptions = userOptions => {
  const options = Object.assign({}, {
      pageSize: 20,
      pageNumber: 1,
      where: {},
      order: []
    }, userOptions)

  delete options.where.pageSize
  delete options.where.pageNumber

  return options
}

/*
 * Generate query options from request
 */
module.exports.getOptionsFromRequest = request => {
  const pagination = Pagination.fromRequest(request)
  
  const options = Object.assign({}, pagination, {
    where: request.query
  })

  return options
}
