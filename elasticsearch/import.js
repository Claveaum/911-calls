const elasticsearch = require('elasticsearch');
const csv = require('csv-parser');
const fs = require('fs');

const esClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

const documents = [];
const mapping = {
    index: "emergency",
    body: {
        mappings: {
            call: {
                properties: {
                    timeStamp: {type: "date", format: "yyyy-MM-dd HH:mm:ss"},
                    coordinates: {type: "geo_point"},
                    type: {type: "keyword"},
                    title: {type: "text"},
                    desc: {type: "text"},
                    twp: {type: "keyword"},
                    addr: {type: "text"},
                    zip: {type: "keyword"}
                }
            }
        }
    }
};

fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', (data) => {
        data.coordinates = `${data.lat}, ${data.lng}`;
        data.type = data.title.split(":", 2)[0];
        documents.push({index: {_index: "emergency", _type: "call"}}, data);
    })
    .on('end', () => {
        esClient.indices.create(mapping)
            .then(() => esClient.bulk({body: documents, timeout: "60000ms"}))
            .then(() => console.log("Import succeed"), console.error);
    });