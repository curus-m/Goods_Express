const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('../config/queries')
const config = require('../config/config')
const pool = new Pool()
const bucketName = "goods-resources";
const resourceFolder = "resources/dakimakura/";
const thumbnailFolder = "resources/thumbnail/";
const logger = require('./logger');

module.exports = {
    getPreSignedURL : function(req, res, next) {
        let requestObject = JSON.parse(req.body);
        const fileName = requestObject.fileName;
        const category = requestObject.category;
        const folder = resourceFolder+category;
        const param = {
          Bucket: bucketName,
          Key: `${folder}/${fileName}`,
          Expires: 600
        };
        let s3 = new AWS.S3(s3Config);
        console.log("param: " + JSON.stringify(param));
        s3.getSignedUrl('putObject', param , function (err, url) {
          if (err) {
            console.error(err.stack);
            res.status(500).send('Something broke!');
          } else {
            res.json(url);
          }
        });
    },    
    getThumbPreSignedURL : function(req, res, next) {
      let requestObject = JSON.parse(req.body);
      let s3 = new AWS.S3(s3Config);
      const fileName = requestObject.fileName;
      const category = requestObject.category;
      const folder = thumbnailFolder+category;
      const param = {
        Bucket: bucketName,
        Key: `${folder}/${fileName}`,
        Expires: 600
      };
      console.log("param: " + JSON.stringify(param));
      s3.getSignedUrl('putObject', param , function (err, url) {
        if (err) {
          console.error(err.stack);
          res.status(500).send('Something broke!');
        } else {
          res.json(url);
        }
      });
  },    
    getMaterials : async function(req, res, next) {
          const client = await pool.connect()
          const query = queries.getMaterialList;
          try {
              const result = await client.query(query);
              res.json(result.rows);
          } catch(error) {
            console.log(error.stack);
            res.status(500).send('Something broke!');
          }
          finally {
              client.release()
          }

    }
}