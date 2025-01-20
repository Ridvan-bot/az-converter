import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const blobTrigger = async function (blob: Buffer): Promise<void> {
    try {
        console.log(`
            
            ============================================================
            ||                                                       ||
            ||       Blob trigger function processed blob            ||
            ||                                                       ||
            ============================================================
            `);
        console.log('Blob trigger function processed blob');
        let blobName = 'pohlmanTestExcel.xlsx';
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('convertfiles');
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const blobExtension = path.extname(blobName).toLowerCase();

     if (blobExtension === '.xlsx' || blobExtension === '.xls') {
        // Convert Excel to CSV
        const workbook = XLSX.read(blob, { type: 'buffer' });
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        const csvBlobName = blobName.replace(blobExtension, '.csv');
        const csvBlockBlobClient = containerClient.getBlockBlobClient(csvBlobName);
        await csvBlockBlobClient.upload(csv, csv.length);
        console.log(`Converted ${blobName} to ${csvBlobName}`);
        await csvBlockBlobClient.delete();
        console.log(`Deleted converted CSV blob: ${csvBlobName}`);
     }
    else if (blobExtension === '.csv') {
      //  Convert CSV to Excel
        const workbook = XLSX.read(blob.toString(), { type: 'string' });
        const excelBlobName = blobName.replace(blobExtension, '.xlsx');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        const excelBlockBlobClient = containerClient.getBlockBlobClient(excelBlobName);
        await excelBlockBlobClient.upload(excelBuffer, excelBuffer.length);
        console.log(`Converted ${blobName} to ${excelBlobName}`);
        await excelBlockBlobClient.delete();
        console.log(`Deleted converted CSV blob: ${excelBlobName}`);
    } else {
        console.log(`Unsupported file type: ${blobExtension}`);
    }
            // Delete the original blob
            await blockBlobClient.delete();
            console.log(`Deleted original blob: ${blobName}`);
            // Delete the converted CSV blob


} catch (error) {
    console.log(`Error processing blob: ${error.message}`);
};
};

app.storageBlob('convertFile', {
    path: 'convertfiles/{name}',
    connection: 'AZURE_STORAGE_CONNECTION_STRING',
    handler: blobTrigger
});