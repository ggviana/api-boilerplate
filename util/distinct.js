const inArray = require('./inArray')

module.exports = arr => arr.reduce((distinct, item) => {
  // If item is not in array, add item
  if (! inArray(distinct, item)) distinct.push(item)

  return distinct
}, [])