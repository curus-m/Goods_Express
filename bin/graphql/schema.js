const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type User {
      name : String
      posts: [Post]
    }
    type Query {
      tempData: TempData
      tempDatas: [TempData]
      tempMaxMins:[TempData]
      user: User
    }
    type Post {
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