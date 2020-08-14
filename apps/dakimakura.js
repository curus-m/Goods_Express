const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('../config/queries')
const config = require('../config/config')
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

const checkData  = function(data) {
    const errors = [];

    if(!data.name) {
        errors.push("Name Error");
    }
    if (!data.brand) {
        errors.push("Brand Error");
    }
    if (isNaN(data.price)) {
        errors.push("Name Error");
    }
    if (isNaN(data.material)) {
        errors.push("Material Error");
    }
    if (!data.releasedate) {
        errors.push("Date Error");
    }
    console.log("errors:" + errors);
    return errors.length > 0 ? false : true;
}
// change fileName on s3 
const changeFile = async function (oldFileName) {
    const date = new Date();
    let extension = `${oldFileName.split(".")[1]}`
    let newFileName = `${yyyymmddhhmmss(date)}.${extension}`;
    const copyParams = {
        Bucket: bucketName, 
        Key: `${dakimakuraFolder}${newFileName}`,
        CopySource:  `${bucketName}/${dakimakuraFolder}${oldFileName}`,
        ACL: "public-read"
    }
    s3.copyObject(copyParams, (err, data) => {
            if (err) { 
                console.log(err, err.stack); 
                Promise.reject(err);
            }   
            // an error occurred
            else {
                console.log("Copy complete");
                Promise.resolve(newFileName);
            }
    })
    
}

const deleteFile = function(fileName) {
    const deleteParams = {
        Bucket: bucketName, 
        Key:  `${dakimakuraFolder}${fileName}`,
    }
    
    s3.deleteObject(deleteParams, (err, data) => {
        if (err) { 
            console.log(err, err.stack); // an error occurred
            throw Error(err);
        }
        else {
            console.log("delete Complete")
        }
    });
}
const yyyymmddhhmmss = function(date) {
    var yyyy = date.getFullYear();
    var mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
    var dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);
};
 

module.exports = {
    getItem: function(req,res,next) {
        const no = req.params.id;
    
        (async (no) => {
            const client = await pool.connect()
            const query = queries.getDakiItem
            const param = [no]
            try {
                const result = await client.query(query,param)
                const data = result.rows[0];
                console.log(data);
                res.json(data);
            } finally {
                client.release()
            }
        })(no).catch(err => console.log(err.stack));
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
        console.log(`page: ${pages} , query: ${req.params.query}, category: ${category}`);
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
                res.json(data);
            } finally {
                client.release()
            }
        })().catch(err => console.log(err.stack))


      
    }

};