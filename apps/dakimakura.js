const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('./queries.js')
const pool = new Pool()
const bucketName = "goods-resources";
const dakimakuraFolder = "resources/dakimakura/";
const s3Config = {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: 'ap-northeast-1',
    signatureVersion: 'v4'
}
const pageItems = 10;
const s3 = new AWS.S3(s3Config);

module.exports = {
    getItem: function(req,res,next) {

    },
    getList: function(req,res,next) {
        // console.log('Request Type:', req.method);

        const pages = req.params.page ? req.params.page : 1;
        let searchQuery = req.params.query ? req.params.query : '';
        searchQuery = `%${searchQuery}%`;
        const category = req.params.category ? req.params.category : 0;
        let categoryStart, categoryEnd;
        if( category == 0 )
        {
            categoryStart = 0;
            categoryEnd = 10;
        } else {
            categoryStart = category;
            categoryEnd = category;
        }
        console.log(`page: ${pages} , query: ${searchQuery}, category: ${category}`);
        let offset = pageItems * (pages-1);
        (async () => {
            const client = await pool.connect();
            const dakiListQuery = queries.getDakiList;
            const dakiListParam = [searchQuery, categoryStart, categoryEnd, pageItems, offset];
            const dakiCountQuery = queries.getTotalDakimakura;
            const dakiCountParam = [searchQuery, categoryStart, categoryEnd]
            try {
                const dakiList = await client.query(dakiListQuery, dakiListParam);
                let count = await client.query(dakiCountQuery, dakiCountParam);
                count = Math.ceil(count.rows[0].count/pageItems);
                const data = {
                    dakimakuras: dakiList.rows,
                    totalPages: count
                }
                callback(null, createResponse(200, data))
            } finally {
                client.release()
            }
        })().catch(err => console.log(err.stack))


        res.send(data);
    }

};