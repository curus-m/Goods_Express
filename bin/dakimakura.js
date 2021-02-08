const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const pgConfig = require('../config/config');
const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('../config/queries')
const pool = new Pool(pgConfig.postgre);
const config = require('../config/config');
const logger = require('./logger');
const s3Config = {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: 'ap-northeast-1',
    signatureVersion: 'v4'
}
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
    console.log("errors:" + errors);
    return errors.length > 0 ? false : true;
}

// change fileName on s3 
const uploadeangeFileOnS3 = function (oldFileName, newFileName) {
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
}
const deleteFile = function(fileName) {
    fs.rm(config.resourcePath+'dakimakura/'+fileName, function(err) {
        console.log(err);
    })
}
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
}
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

        // data check => (image file save) => thumbnail save 
        const myData = JSON.parse(req.body.data);
        const isOk = checkData(myData);
        if(!isOk) {
            res.status(500).send({ message: 'Invalid Data!'});
        }
        console.log("Data OK!");
        try{
            let file =  req.file;
            let newfileName = file.filename;
            let oldFileName = file.originalname;
            console.log("name " + oldFileName + " goes to " + newfileName);
            const client = await pool.connect()
            const query = queries.addDakimakura
            if (oldFileName) { 
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, newfileName]
                console.log(param);
                client.query(query,param).then((result) => {
                    console.log("Successfully added");
                    if (oldFileName != "noimage.jpg") { 
                        // create Thumbnail
                        let options = { height : 250 }
                        const thumbnail = imageThumbnail(config.resourcePath+'dakimakura/'+newfileName, options)
                        .then(thumbnail => { 
                            fs.writeFile(config.thumbnailPath+"dakimakura/"+newfileName, thumbnail, err => {
                            if (err) {
                                console.error(err)
                            }
                                //file written successfully
                            });
                        })      
                        .catch(err => console.error(err));
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
        }
        catch (error) {
            console.log(error.stack);
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
                    if (oluploadeileName != "noimage.jpg") { 
                        changeuploadele(oldFileName, newFileName);
                    }
                    res.json({ message: 'OK' });
                }, (error) => {
                    console.log(error);
                    console.log("Fail!");
                    if (oluploadeileName != "noimage.jpg") { deleteFile(oldFileName); }
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
        } */
    },
    update: async function(req, res, next) {
        const myData = JSON.parse(req.body.data);
        console.log(myData);
        const isOk = checkData(myData);
        if(!isOk) {
            callback(null, createResponse(404, { message: 'Invalid Data!'}));
        }
        console.log("Data OK!");
        const client = await pool.connect()
        let query, param;
        try {
            let file =  req.file;
            const newfileName = file.filename;
            const uploadedFileName = file.originalname;
            if (uploadedFileName) { 
                // image change 
                query = queries.updateDakimakura;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description, newfileName];
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
            if (myuploadeta.fileName) { deleteFile(oldFileName);}
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