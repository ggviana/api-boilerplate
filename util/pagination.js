/* 
 * Returns the quantity of skipped items
 */
module.exports.skip = (pageSize, pageNumber) => pageSize * (pageNumber - 1)

/* 
 * Creates a pagination option from request
 */
module.exports.fromRequest = (req) => {
  const options = {}
  const pageNumber = req.body.pageNumber || req.query.pageNumber
  const pageSize = req.body.pageSize || req.query.pageSize

  if (pageNumber) {
    options.pageNumber = pageNumber
  }

  if (pageSize) {
    options.pageSize = pageSize
  }

  return options
}