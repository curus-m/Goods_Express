const pgConfig = require('../config/config');
const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('../config/queries')
const pool = new Pool(pgConfig.postgre);
const bucketName = "goods-resources";
const dakimakuraFolder = "resources/dakimakura/";
const logger = require('./logger');
const s3Config = {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: 'ap-northeast-1',
    signatureVersion: 'v4'
}
const pageItems = 10;
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

const getNewFileName = function(oldFileName) {
    const date = new Date();
    let extension = `${oldFileName.split(".")[1]}`
    let newFileName = `${yyyymmddhhmmss(date)}.${extension}`;
    return newFileName;
}
// change fileName on s3 
const changeFile = function (oldFileName, newFileName) {
    const copyParams = {
        Bucket: bucketName, 
        Key: `${dakimakuraFolder}${newFileName}`,
        CopySource:  `${bucketName}/${dakimakuraFolder}${oldFileName}`,
        ACL: "public-read"
    }
    let s3 = new AWS.S3(s3Config);
    s3.copyObject(copyParams, (err, data) => {
            return new Promise((resolve, reject) => {
                if (err) { 
                    console.log("Error : ");
                    console.log(err, err.stack); 
                    reject(err);
                }   
                else {
                    console.log("Copy complete");
                    deleteFile(oldFileName);
                    resolve(newFileName);
                }
            });
    });
}

const deleteFile = function(fileName) {
    const deleteParams = {
        Bucket: bucketName, 
        Key:  `${dakimakuraFolder}${fileName}`,
    }
    let s3 = new AWS.S3(s3Config);
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
    let yyyy = date.getFullYear();
    let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
    let dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    let ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);
};
 

module.exports = {
    getItem: async function(req, res, next) {
        const no = req.params.id;
        logger.debug(`Get Daki Item No: ${no}`);
        const client = await pool.connect();
        const query = queries.getDakiItem;
        const param = [no]
        try {
            const result = await client.query(query, param);
            const data = result.rows[0];
            // console.log(data);
            res.json(data);
        } catch (error) {
            console.log(err.stack);
        } finally {
            client.release()
        }
    },
    getList: async function(req, res, next) {
        let date = new Date();
        logger.debug(">>>> Get List on " + date.toISOString());

        const pages = req.query.page ? req.query.page : 1;
        let searchQuery = req.query.query ? req.query.query : '';
        searchQuery = `%${searchQuery}%`;
        const category = req.query.category ? req.query.category : 0;
        let categoryStart, categoryEnd;
        if(category == 0)
        {
            categoryStart = 0;
            categoryEnd = 10;
        } else {
            categoryStart = category;
            categoryEnd = category;
        }
        logger.debug(`page: ${pages} , query: ${req.query.query}, category: ${category}`);
        let offset = pageItems * (pages-1);
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
        } catch(err){
            console.log(err.stack);
            res.status(500).send({ message: 'Invalid Data!' , contents: error.stack});
        } finally {
            client.release()
        }
        
    },
    create : async function(req, res, next) {
        const myData = JSON.parse(Object.keys(req.body)[0]);
        console.log(myData);
        const isOk = checkData(myData);
        if(!isOk) {
            res.status(500).send({ message: 'Invalid Data!'});
        }
        console.log("Data OK!");
        const client = await pool.connect()
        const query = queries.addDakimakura
        const oldFileName = myData.fileName;
        try {
            if (myData.fileName) { 
                let newFileName = getNewFileName(myData.fileName);
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, newFileName]
                console.log(param);
                client.query(query,param).then((result) => {
                    console.log("Successfully added");
                    if (oldFileName != "noimage.jpg") { 
                        changeFile(oldFileName, newFileName);
                    }
                    res.json({ message: 'OK' });
                }, (error) => {
                    console.log(error);
                    console.log("Fail!");
                    if (oldFileName != "noimage.jpg") { deleteFile(oldFileName); }
                })
            } else { 
                let defaultFileName = "noimage.jpg";
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, defaultFileName]
                client.query(query,param).then((result) => {
                    console.log("Successfully added");
                }, (error) => {
                    console.log(error);
                    console.log("Fail!");
                });
            }
        } catch (error) {
            console.log(error.stack);
            res.status(500).send({ message: 'Invalid Data!' , contents: error.stack});
        }finally {
            client.release();
        }
    },
    update: async function(req, res, next) {
        const myData = JSON.parse(Object.keys(req.body)[0]);
        console.log(myData);
        const isOk = checkData(myData);
        if(!isOk) {
            callback(null, createResponse(404, { message: 'Invalid Data!'}));
        }
        console.log("Data OK!");
    
        const client = await pool.connect()
        let fileName = ""; // it is original
        let oldFileName = myData.fileName;
        let query, param;
        try {
            if (myData.fileName) { 
                let newFileName = getNewFileName(myData.fileName);
                // image change 
                query = queries.updateDakimakura;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description, newFileName];
                if (oldFileName != "noimage.jpg") { 
                    changeFile(oldFileName, newFileName);
                }
            } else { 
                // pass image update
                fileName = "noimage.jpg";
                query = queries.updateDakimakuraNoImage;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description];
            }
            console.log(param);
            const result = await client.query(query,param)
            console.log("Update Complete");
            res.json({ message: 'OK' });
        } catch (error) {
            console.log(error.stack);
            res.status(500).send({ message: 'Invalid Data!', contents : error.stack});
        } finally {
            client.release()
            if (myData.fileName) { deleteFile(oldFileName);}
        }
    },
    delete: async function(req, res, next) {
        const no = req.params.id;
        const client = await pool.connect();
        const query = queries.deleteDakimakura;
        const param = [no]
        try {
            const result = await client.query(query,param)
            console.log(result.rows[0])
            res.json({ message: 'OK' });
        } catch(error) {
            console.log(error.stack);
            res.status(500).send({ message: 'error!', contents : error.stack});
        }finally {
            client.release();
        }
    }
};