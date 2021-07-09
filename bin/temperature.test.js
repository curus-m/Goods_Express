const moment = require('moment');


function getTempMaxMins () {
    const before = moment().add(-7, 'd').format("YYYY-MM-DD")
    const today = moment().format("YYYY-MM-DD");
    // const param = [today]
    return before + " / " + today;
}
const env = "development"
test('date test', () => {
  expect(getTempMaxMins()).toEqual("2021-07-02 / 2021-07-09");
});