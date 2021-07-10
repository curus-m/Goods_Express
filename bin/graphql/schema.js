const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Query {
      tempData: TempData
      tempDatas: [TempData]
      tempMaxMins:[TempData]
      user: User
    }
    type TempData {
      time: String,
      temperature: Float,
      humidity: Float,
      maxtemp: Float,
      maxhumidity: Float,
      mintemp: Float,
      minhumidity: Float,
    }
 `)