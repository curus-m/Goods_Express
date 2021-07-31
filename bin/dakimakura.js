const express = require('express');
const app = express();
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const config = require('../config/config');
// const AWS = require('aws-sdk');
const { Pool } = require('pg')
const logger = require('../config/logger');
const queries = require('../config/queries')
const env = app.get('env');
const pool = new Pool(config[env].postgre);
const defaultImageName = "noimage.jpg"
// const s3Config = {
//     accessKeyId: process.env.ACCESS_KEY,
//     secretAccessKey: process.env.SECRET_KEY,
//     region: 'ap-northeast-1',
//     signatureVersion: 'v4'
// }
const thumbnailOptions = { height : 250 }
const pageItems = 8;
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
    console.log("errors:" + errors.length);
    return errors.length > 0 ? false : true;
}

// change fileName on s3 
/* const uploadeangeFileOnS3 = function (oldFileName, newFileName) {
    const copyParams = {
        Bucket: config.bucketName, 
        Key: `${config.dakimakuraFolder}${newFileName}`,
        CopySouploadece:  `${config.bucketName}/${config.dakimakuraFolder}${oldFileName}`,
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
                    deleteuploadele(oldFileName);
                    resolve(newFileName);
                }
            });
    });
}*/
const deleteImage = function(fileName) {
    fs.rm(config[env].resourcePath+'dakimakura/'+fileName, function(err) {
        logger.error(err);
    });
    fs.rm(config[env].thumbnailPath+'dakimakura/'+fileName, function(err) {
        logger.error(err);
    });
}
const createThumbnail = function(filename) {
    const thumbnail = imageThumbnail(config[env].resourcePath+'dakimakura/'+filename, thumbnailOptions)
    .then(thumbnail => { 
        fs.writeFile(config[env].thumbnailPath+"dakimakura/"+filename, thumbnail, err => {
        if (err) {
            logger.error(err);
        }
            //file written successfully
        });
    })      
    .catch(err => logger.error(err));

}
/*
const deleteFileOnS3 = function(fileName) {
    const deleteParams = {
        Bucket: config.bucketName, 
        Key:  `${config.dakimakuraFolder}${fileName}`,
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
}*/
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
            logger.debug(`Get Daki Item No: ${no}`);
            // logger.debug(JSON.stringify(data));
            res.json(data);
        } catch (error) {
            logger.error(error.stack);
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
        logger.info(`page: ${pages} , query: ${req.query.query}, category: ${category}`);
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
            logger.error(err.stack);
            res.status(500).send({ message: 'Invalid Data!' , contents: error.stack});
        } finally {
            client.release()
        }
        
    },
    addItem : async function(req, res, next) {
        const myData = JSON.parse(req.body.data);
        const isOk = checkData(myData);
        if(!isOk) {
            res.status(500).send({ message: 'Invalid Data!'});
        }
        logger.debug("Data OK!");
        try{
            if (req.file !== undefined) { 
                let newfileName = req.file.filename;
                let oldFileName = req.file.originalname;
                logger.debug("name " + oldFileName + " goes to " + newfileName);
                const client = await pool.connect()
                let query = queries.addDakimakura
                let param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, newfileName]
                logger.debug(param);
                client.query(query,param).then((result) => {
                    logger.info("Successfully added: ", myData.name);
                    if (oldFileName != defaultImageName) { 
                        createThumbnail(newfileName);
                    }
                    query = queries.getDakiId;
                    param = [myData.name, myData.brand, myData.price];
                    client.query(query,param).then(result => {
                        res.json({ message: 'OK', id: result.rows[0].id });
                    });
                }, (error) => {
                    logger.log(error);
                    logger.log("Fail!");
                    if (oldFileName != defaultImageName) { deleteImage(oldFileName); }
                })
            } else { 
                let defaultFileName = defaultImageName;
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, defaultFileName]
                client.query(query,param).then((result) => {
                    logger.info("Successfully added", myData.name);
                }, (error) => {
                    logger.error(error);
                    logger.error("Fail!");
                });
            }
        }
        catch (error) {
            logger.error(error.stack);
            res.status(500).send({ message: 'Invalid Data!' , contents: error.stack});
        }finally {

        } 
        /*
        try {

            
        const client = await pool.connect()
        const query = queries.addDakimakura
        const uploadedFileName = myData.fileName;

            if (myData.fileName) { 
                let newFileName = getNewFileName(myData.fileName);
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, newFileName]
                console.log(param);
                client.query(query,param).then((result) => {
                    console.log("Successfully added");
                    if (oluploadeileName != defaultImageName) { 
                        changeuploadele(oldFileName, newFileName);
                    }
                    res.json({ message: 'OK' });
                }, (error) => {
                    console.log(error);
                    console.log("Fail!");
                    if (oluploadeileName != defaultImageName) { deleteFile(oldFileName); }
                })
            } else { 
                let defaultFileName = defaultImageName;
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
        } */
    },
    update: async function(req, res, next) {
        const myData = JSON.parse(req.body.data);
        const isOk = checkData(myData);
        if(!isOk) {
            callback(null, createResponse(404, { message: 'Invalid Data!'}));
        }
        const client = await pool.connect();
        let query, param;
        try {
            if (req.file !== undefined) { 
                const newfileName = req.file.filename;
                const uploadedFileName = myData.originalImage;
                // image change 
                query = queries.updateDakimakura;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description, newfileName];
                createThumbnail(newfileName);
                if (uploadedFileName !== defaultImageName) { deleteImage(uploadedFileName);}
            } else { 
                // pass image update
                query = queries.updateDakimakuraNoImage;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description];
            }
            logger.debug(param);
            const result = await client.query(query,param)
            logger.info("Update Complete", myData.name);
            res.json({ message: 'OK' });
        } catch (error) {
            logger.err(error.stack);
            res.status(500).send({ message: 'Invalid Data!', contents : error.stack});
        } finally {
            client.release()
          
        }
    },
    delete: async function(req, res, next) {
        const no = req.params.id;
        const client = await pool.connect();
        const param = [no]
        try {
            let query = queries.getDakiItem;
            let result = await client.query(query, param);
            const data = result.rows[0];
            const filename = data.image;
            query =  queries.deleteDakimakura;
            result = await client.query(query,param)
            logger.debug(result.rows[0])
            res.json({ message: 'OK' });
            if(filename !== defaultImageName) {
                deleteImage(filename);
            }
        } catch(error) {
            logger.error(error.stack);
            res.status(500).send({ message: 'error!', contents : error.stack});
        }finally {
            client.release();
        }
    }
};