import fs from "fs-extra";
import mimeTypes from "mime-types";

export function encode(data: ArrayBuffer, mediaType: string) {
    if (!data || !mediaType) {
        console.log('ImageDataURI :: Error :: Missing some of the required params: data, mediaType ');
        return null;
    }

    mediaType = (/\//.test(mediaType)) ? mediaType : 'image/' + mediaType;
    let dataBase64 = (Buffer.isBuffer(data)) ? data.toString('base64') : new Buffer(data).toString('base64');
    let dataImgBase64 = 'data:' + mediaType + ';base64,' + dataBase64;

    return dataImgBase64;
}

export function encodeFromFile(filePath: string) {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            reject('ImageDataURI :: Error :: Missing some of the required params: filePath');
            return null;
        }

        let mediaType = mimeTypes.lookup(filePath);
        if (!mediaType) {
            reject('ImageDataURI :: Error :: Couldn\'t recognize media type for file');
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                return reject('ImageDataURI :: Error :: ' + JSON.stringify(err, null, 4));
            }
            return resolve(encode(data, mediaType || ''));
        });
    });

}

