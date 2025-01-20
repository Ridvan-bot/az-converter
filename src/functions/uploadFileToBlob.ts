import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import * as dotenv from 'dotenv';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function uploadFileToBlob(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    console.log(`

        ===========================================================
        ||                                                       ||
        ||               Uploading file to Azure Blob            ||
        ||                                                       ||
        ===========================================================
        `);
    context.log(`File upload function processed request for url "${request.url}"`);

    if (request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file') as unknown as File;

        if (file) {
            const allowedMimeTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
            if (!allowedMimeTypes.includes(file.type)) {
                return { body: `Please upload an Excel or CSV file.` };
            }
            try {
                const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
                context.log('Blob service client created.');
                const containerClient = blobServiceClient.getContainerClient('convertfiles');
                context.log('Container client created.');
                const blockBlobClient = containerClient.getBlockBlobClient(file.name);
                context.log('Block blob client created.');
                const fileBuffer = Buffer.from(await file.arrayBuffer());
                context.log('File buffer created.');
                await blockBlobClient.uploadData(fileBuffer);
                context.log('File uploaded to Azure Blob Storage.');

                // List blobs in the container
                let blobs = containerClient.listBlobsFlat();
                for await (const blob of blobs) {
                context.log(`Blob: ${blob.name}`);
                }
                return { body: `File uploaded successfully to Azure Blob Storage!` };
            } catch (error) {
                context.log(`Error creating BlobServiceClient: ${error.message}`);
                return { body: `Error creating BlobServiceClient: ${error.message}` };
            }
        } else {
            return { body: `No file found in the request.` };
        }
    } else {
        return { body: `Please use POST method to upload files.` };
    }
};


app.http('uploadFileToBlob', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: uploadFileToBlob
});