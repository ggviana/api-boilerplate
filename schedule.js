const schedule = require('node-schedule')
const backup   = require('./jobs/backup')

module.exports.start = () => new Promise((resolve) => {
  // Returns to execution
  resolve()

  // Schedule weekly
  const weekly = new schedule.RecurrenceRule()
  weekly.dayOfWeek = 0 // Sunday
  weekly.hour = 0      // 24h00

  schedule.scheduleJob(weekly, () => {
    backup()
  })

  // Schedule one time
  const oneTime = new Date(2016, 6, 15, 0, 0, 0) // 2016-07-15 24h00

  schedule.scheduleJob(oneTime, () => {
    backup()
  })

  console.log('Running scheduled jobs.')
})